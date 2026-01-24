import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

import { addRateLimitHeaders, unauthorizedResponse, validateRequest } from "./auth";
import {
	SESSION_METADATA_SCHEMA,
	extractGeoFromRequest,
	generateSessionId,
	createSessionMetadataSQL,
	updateActivitySQL,
	parseSessionMetadata,
	shouldExpireSession,
	aggregateSessionToKV,
	type SessionMetadata,
} from "./session-tracking";
import { handleDashboard, handleDashboardAPI } from "./dashboard";
import { handleLanding } from "./landing";

// Hash IP address for privacy-preserving usage tracking
async function hashIP(ip: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(ip + "-devplan-salt");
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Track usage in KV (call this for each MCP request)
async function trackUsage(request: Request, env: Env): Promise<void> {
	try {
		const ip = request.headers.get("CF-Connecting-IP") || "unknown";
		const hashedUser = await hashIP(ip);
		const today = new Date().toISOString().split("T")[0];
		const key = `usage:${today}:${hashedUser}`;

		const currentCount = parseInt(await env.DEVPLAN_KV.get(key) || "0");
		await env.DEVPLAN_KV.put(key, String(currentCount + 1), {
			expirationTtl: 86400 * 30 // Keep for 30 days
		});
	} catch {
		// Don't fail the request if tracking fails
	}
}
import {
	createBrief,
	detectTechConflicts,
	filterLessonsForProject,
	filterLessonsBySeverity,
	formatLesson,
	generateClaudeMd,
	generateExecutorAgent,
	generateLessonId,
	generateLessonsSafeguards,
	generatePlan,
	generateProgressSummary,
	generateVerifierAgent,
	getSubtask,
	type Lesson,
	parseBrief,
	updateProgress,
	validatePlan,
	validateHaikuExecutable,
	type HaikuValidationResult,
	type HaikuValidationError,
	findRelevantLessons,
	// Issue-to-task system
	parseIssueContent,
	classifyIssue,
	extractAffectedComponents,
	generateRemediationTask,
	formatRemediationPlan,
} from "./generators";
import { INTERVIEW_QUESTIONS, listTemplates } from "./templates";
import { exportWorkflow, exportMermaid } from "./workflow-export";

// Extend Env interface for our bindings
interface Env {
	AUTH_ENABLED: string;
	FREE_TIER_LIMIT: string;
	SESSION_INACTIVITY_TTL_DAYS: string;
	SESSION_ABSOLUTE_TTL_DAYS: string;
	CLEANUP_CHECK_HOURS: string;
	DEVPLAN_KV: KVNamespace;
	MCP_OBJECT: DurableObjectNamespace;
	// Cloudflare Analytics API (optional - for dashboard)
	CF_ANALYTICS_TOKEN: string;
	CF_ACCOUNT_ID: string;
	CF_ZONE_ID: string;
}

export class DevPlanMCP extends McpAgent {
	server = new McpServer({
		name: "DevPlan",
		version: "1.0.0",
	});

	// Session metadata cache (to avoid repeated SQLite reads)
	private sessionId: string | null = null;

	/**
	 * Initialize session tracking when the Durable Object starts.
	 * Called automatically by the McpAgent framework.
	 */
	async onStart(): Promise<void> {
		// Call parent onStart to ensure MCP initialization
		await super.onStart();

		const env = (this as unknown as { env: Env }).env;
		const ctx = (this as unknown as { ctx: DurableObjectState }).ctx;
		const request = (this as unknown as { request?: Request }).request;

		// DISABLED: Session tracking was causing excessive DO writes
		// Each session creates SQLite tables and rows, and with the alarm
		// rescheduling loop, this exceeded free tier limits.
		//
		// The MCP tools still work fine without session tracking.
		//
		// try {
		// 	ctx.storage.sql.exec(SESSION_METADATA_SCHEMA);
		// } catch {}
		//
		// this.sessionId = generateSessionId();
		// const geo = request ? extractGeoFromRequest(request) : { ... };
		// const insertSQL = createSessionMetadataSQL(this.sessionId, geo, transportType);
		// ctx.storage.sql.exec(insertSQL);

		// Keep sessionId for logging purposes only (no storage)
		this.sessionId = generateSessionId();

		// DISABLED: Alarm scheduling was causing massive DO write usage
		// Each alarm reschedule counts as a write, and with thousands of DOs
		// this exceeded the 100k rows_written/day free tier limit
		// See: https://developers.cloudflare.com/durable-objects/api/alarms/
		//
		// const checkHours = parseInt(env.CLEANUP_CHECK_HOURS || "6");
		// try {
		// 	await this.schedule(checkHours * 60 * 60, "checkExpiration");
		// } catch {
		// 	// Scheduling failed - continue without cleanup
		// }
	}

	/**
	 * Scheduled callback - ALWAYS cleans up the DO to stop the alarm loop.
	 *
	 * Previously this would check expiration and reschedule, but that caused
	 * a feedback loop: thousands of DOs each rescheduling hourly = 100k+ writes/day.
	 *
	 * Now: any alarm that fires will clean up the DO and NOT reschedule.
	 * This stops the bleeding from existing zombie DOs.
	 */
	async checkExpiration(): Promise<void> {
		const ctx = (this as unknown as { ctx: DurableObjectState }).ctx;
		const doId = ctx.id.toString().slice(0, 8);

		// AGGRESSIVE CLEANUP: Always delete everything, never reschedule
		// This stops the alarm feedback loop that was exceeding free tier limits
		console.log(`[DO:${doId}] Zombie cleanup triggered - deleting all storage`);
		try {
			await ctx.storage.deleteAlarm();
			await ctx.storage.deleteAll();
			console.log(`[DO:${doId}] Cleanup complete - DO will cease to exist`);
		} catch (err) {
			console.error(`[DO:${doId}] Cleanup failed:`, err);
			// If deleteAll fails, try to at least stop the alarm
			try {
				await ctx.storage.deleteAlarm();
				console.log(`[DO:${doId}] Alarm deleted, storage cleanup failed`);
			} catch {
				console.error(`[DO:${doId}] Total cleanup failure`);
			}
		}
	}

	/**
	 * Update activity timestamp when tools are called.
	 * DISABLED: This was writing to SQLite on every tool call,
	 * contributing to rows_written limit exhaustion.
	 */
	private updateActivity(): void {
		// No-op - session tracking disabled to stay within free tier limits
	}

	async init() {
		// Tool 0: devplan_start - The main entry point
		this.server.tool(
			"devplan_start",
			"START HERE: Initialize a new project using the DevPlan methodology. This tool provides comprehensive inline instructions for building a development plan that Claude Code can execute step-by-step.",
			{},
			async () => {
				this.updateActivity();
				return {
				content: [
					{
						type: "text",
						text: `# DevPlan Project Builder

You are about to create a development plan using the ClaudeCode-DevPlanBuilder methodology.

---

## ⚠️ CRITICAL: Study the HelloCLI Example First

**Before proceeding, you MUST fetch and study the complete HelloCLI example.** This is NOT optional - it teaches you what "Haiku-executable" means:

1. **Fetch the example DEVELOPMENT_PLAN.md**:
   \`\`\`
   WebFetch: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md
   \`\`\`

2. **Study what makes it Haiku-executable**:
   - Every subtask has **complete, copy-pasteable code blocks** (not pseudocode)
   - Every deliverable has **exact file paths** (\`src/hello_cli/main.py\`)
   - Every subtask has **verification commands** that prove completion
   - No inference required - Haiku executes this mechanically

3. **Key insight**: Your generated plans must match this quality level. If a subtask doesn't have working code that Haiku can copy-paste, it's NOT Haiku-executable.

**After studying the example, proceed with the interview below.**

---

## Step 1: Interview the User

Ask these questions ONE AT A TIME, waiting for responses:

1. "What's your project name?"
2. "What type of project is this? (CLI tool, web app, API, or library)"
3. "In one sentence, what does it do?"
4. "Who will use it? (e.g., developers, end users, admins)"
5. "What are the 3-5 must-have features for MVP?"
6. "Any technologies you must use or cannot use?"
7. "What's your timeline?"
8. "Any constraints I should know about?"

---

## Step 2: Create PROJECT_BRIEF.md

Write to \`PROJECT_BRIEF.md\` using this structure:

\`\`\`markdown
# Project Brief: {name}

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | {name} |
| **Project Type** | {cli/web_app/api/library} |
| **Goal** | {one sentence} |
| **Timeline** | {timeline} |
| **Team Size** | 1 |

## Target Users

- {user type 1}
- {user type 2}

## Features

### Must-Have (MVP)

1. **{Feature Name}** - {description}
2. **{Feature Name}** - {description}

### Nice-to-Have (v2)

- {feature}

## Technical Requirements

### Tech Stack

| Component | Technology |
|-----------|------------|
| Language | {language} |
| Framework | {framework} |
| Testing | {test framework} |

### Constraints

- {constraint 1}
- {constraint 2}

## Success Criteria

1. {criterion 1}
2. {criterion 2}

## Out of Scope

- {thing 1}
- {thing 2}
\`\`\`

---

## Step 3: Create DEVELOPMENT_PLAN.md

Structure the plan with phases, tasks, and subtasks:

- **Phases** (0, 1, 2...): Major milestones
- **Tasks** (0.1, 1.2...): Features within a phase (one git branch each)
- **Subtasks** (0.1.1, 1.2.3...): Single-session work items (2-4 hours each)

### Subtask Template

Each subtask MUST include ALL of these sections:

\`\`\`markdown
**Subtask X.Y.Z: {Title} (Single Session)**

**Prerequisites**:
- [x] X.Y.W: {Previous subtask title}

**Deliverables**:
- [ ] {Specific, actionable item with exact file path}
- [ ] {Another specific item - 3-7 total}
- [ ] {Write tests for the above}

**Technology Decisions**:
- {Specific library/pattern choice with rationale}

**Files to Create**:
- \`src/path/to/file.ts\`

**Files to Modify**:
- \`src/existing/file.ts\`

**Success Criteria**:
- [ ] {Testable condition: "X command returns Y"}
- [ ] {Another testable condition}
- [ ] All tests pass

**Completion Notes**:
- **Implementation**: (what was done)
- **Files Created**: (list with line counts)
- **Files Modified**: (list)
- **Tests**: (X tests, Y% coverage)
- **Build**: (pass/fail status)
- **Branch**: (branch name)
\`\`\`

### Task Complete Section

Add after each task's subtasks:

\`\`\`markdown
### Task X.Y Complete - Squash Merge

- [ ] All subtasks complete
- [ ] All tests pass
- [ ] Squash merge: \`git checkout main && git merge --squash feature/X-Y-name\`
- [ ] Delete branch: \`git branch -d feature/X-Y-name\`
\`\`\`

### 🎯 Haiku-Executable Requirement

> **Every subtask MUST contain complete, working code that Haiku can copy-paste and execute.**
> If you're writing \`{placeholder}\` or \`// TODO\`, it's NOT Haiku-executable.

**What Haiku-executable looks like** (from HelloCLI example):
\`\`\`markdown
**Deliverables:**
- [ ] \`src/hello_cli/main.py\` - Entry point

**Complete Code:**

Create file \`src/hello_cli/main.py\`:
\\\`\\\`\\\`python
import argparse
from hello_cli.greeter import Greeter

def main():
    parser = argparse.ArgumentParser(description="Hello CLI")
    parser.add_argument("name", help="Name to greet")
    args = parser.parse_args()

    greeter = Greeter()
    print(greeter.greet(args.name))

if __name__ == "__main__":
    main()
\\\`\\\`\\\`

**Verification:**
\\\`\\\`\\\`bash
python -m hello_cli world
# Expected: "Hello, world!"
\\\`\\\`\\\`
\`\`\`

### Critical Rules

1. **Write complete code blocks** - Claude Haiku will execute this plan; it cannot infer missing details
2. **Include verification commands** - Show exact commands to prove each deliverable works
3. **Git workflow**: One branch per TASK (not subtask). Commit after each subtask. Squash merge when task completes.
4. **3-7 deliverables** per subtask, each with explicit checkbox
5. **2-4 hour scope** per subtask maximum

---

## Step 4: Create CLAUDE.md

Write project rules with these sections:

\`\`\`markdown
# {Project} - Claude Code Rules

## Project Overview
{One paragraph description}

## Quick Reference

| Component | Technology |
|-----------|------------|
| Language | {language} |
| Framework | {framework} |
| Testing | {test framework} |
| Linting | {linter} |

## Directory Structure
\\\`\\\`\\\`
{project}/
├── src/
├── tests/
└── ...
\\\`\\\`\\\`

## Commands

| Command | Purpose |
|---------|---------|
| \`{install cmd}\` | Install dependencies |
| \`{test cmd}\` | Run tests |
| \`{lint cmd}\` | Run linter |

## Coding Standards

- {Standard 1}
- {Standard 2}

## Session Checklist

### Starting a Session
- [ ] Read this file
- [ ] Check DEVELOPMENT_PLAN.md for next subtask
- [ ] Create/checkout correct branch

### Ending a Session
- [ ] All tests pass
- [ ] Commit with semantic message
- [ ] Update completion notes in plan
\`\`\`

---

## Step 5: Create Executor Agent

Write to \`.claude/agents/{project}-executor.md\`:

\`\`\`markdown
---
name: {project}-executor
description: PROACTIVELY use this agent to execute {project} development subtasks.
tools: Read, Write, Edit, Bash, Glob, Grep
model: haiku
---

# {Project} Executor Agent

## Before Starting
1. Read CLAUDE.md completely
2. Read DEVELOPMENT_PLAN.md completely
3. Find the subtask you're assigned

## Execution Loop
For each deliverable checkbox:
1. Implement the requirement exactly as specified
2. Write/update tests
3. Run tests and fix failures
4. Mark checkbox complete in the plan

## After Completion
1. Fill in all completion notes fields
2. Commit with semantic message: \`feat(scope): description\`
3. Report what was done

## Error Recovery
- If tests fail: fix immediately before continuing
- If blocked: document in completion notes, move to next deliverable
- If unclear: check CLAUDE.md for project conventions
\`\`\`

---

## Step 6: Create Verifier Agent

Write to \`.claude/agents/{project}-verifier.md\`:

\`\`\`markdown
---
name: {project}-verifier
description: Validate completed application against PROJECT_BRIEF.md
tools: Read, Bash, Glob, Grep
model: sonnet
---

# {Project} Verifier Agent

## Verification Process
1. Read PROJECT_BRIEF.md for requirements
2. Smoke test: run the application
3. Feature verification: test each MVP feature
4. Edge cases: test error handling
5. Produce verification report

## Report Format
For each feature: PASS/FAIL with evidence
\`\`\`

---

## Common Mistakes to Avoid

❌ Don't create branches for subtasks (only for TASKS)
❌ Don't write vague deliverables ("implement feature") - be specific with file paths
❌ Don't skip success criteria - they're how we verify completion
❌ Don't forget the "Task Complete" section after each task
❌ Don't use placeholder code - write real, complete, copy-pasteable code blocks
❌ Don't skip the completion notes template

---

## 📋 Full Workflow (Tell the User)

After planning is complete, explain this workflow to the user:

### Phase 1: Build (Executor Agent)
\`\`\`
Use the {project}-executor agent to execute subtask [X.Y.Z]
\`\`\`
- Execute subtasks one at a time, or let the executor run through them
- Watch it work, or step away and let it build
- Check \`devplan_progress_summary\` to see completion status

### Phase 2: Verify (CRITICAL - Don't Skip!)
\`\`\`
Use the {project}-verifier agent to validate the application against PROJECT_BRIEF.md
\`\`\`
- **Run the verifier AFTER all subtasks are complete**
- The verifier will try to break the application and find gaps
- Any issues found become lessons learned for future projects

### Phase 3: Capture Lessons
\`\`\`
Use devplan_extract_lessons_from_report with the verification report
\`\`\`
- Extract lessons from any issues the verifier found
- These get injected into future plans to prevent the same mistakes

**Remind the user**: "After the executor finishes building, don't forget to run the verifier!"

---

## Reference

**If your generated plan doesn't match the quality of these examples, go back and fix it:**

- **DEVELOPMENT_PLAN.md** (the gold standard): https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md
- **PROJECT_BRIEF.md**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/PROJECT_BRIEF.md
- **CLAUDE.md**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/CLAUDE.md
- **Executor Agent**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/.claude/agents/hello-cli-executor.md

---

## Next Step

**First**: Fetch and study the HelloCLI DEVELOPMENT_PLAN.md example (see CRITICAL section above).

**Then**: Start by asking the user: **"What's your project name?"**`,
					},
				],
			};
			}
		);

		// Tool 1: devplan_interview_questions
		this.server.tool(
			"devplan_interview_questions",
			"Get interview questions to ask the user about their project. Ask these ONE AT A TIME, waiting for responses.",
			{},
			async () => {
				this.updateActivity();
				return {
				content: [
					{
						type: "text",
						text: `Ask the user each of these questions ONE AT A TIME. Wait for their response before asking the next question.\n\n${JSON.stringify(INTERVIEW_QUESTIONS, null, 2)}`,
					},
				],
			};
			}
		);

		// Tool 2: devplan_create_brief
		this.server.tool(
			"devplan_create_brief",
			"Create a PROJECT_BRIEF.md after interviewing the user. This captures their requirements in a structured format.",
			{
				name: z.string().describe("Project name"),
				project_type: z.string().describe("Project type: cli, web_app, api, or library"),
				goal: z.string().describe("One-sentence project description"),
				target_users: z.array(z.string()).describe("Target user types"),
				features: z.array(z.string()).describe("Must-have MVP features"),
				tech_stack: z
					.object({
						must_use: z.array(z.string()).optional(),
						cannot_use: z.array(z.string()).optional(),
					})
					.optional()
					.describe("Technology preferences"),
				timeline: z.string().optional().describe("Project timeline (e.g., '2 weeks')"),
				team_size: z.number().optional().describe("Number of developers (default: 1)"),
				constraints: z.array(z.string()).optional().describe("Constraints/requirements"),
				nice_to_have: z.array(z.string()).optional().describe("Nice-to-have features for v2"),
			},
			async ({ name, project_type, goal, target_users, features, tech_stack, timeline, team_size, constraints, nice_to_have }) => {
				this.updateActivity();
				// Check for tech stack conflicts
				const techConflicts = tech_stack?.must_use
					? detectTechConflicts(tech_stack.must_use)
					: [];

				const brief = createBrief({
					name,
					projectType: project_type,
					goal,
					targetUsers: target_users,
					features,
					techStack: tech_stack
						? {
								mustUse: tech_stack.must_use,
								cannotUse: tech_stack.cannot_use,
							}
						: undefined,
					timeline,
					teamSize: team_size,
					constraints,
					niceToHave: nice_to_have,
				});

				const warningsSection = techConflicts.length > 0
					? `\n\n⚠️ **Tech Stack Warnings**:\n${techConflicts.map(w => `- ${w}`).join("\n")}\n\nThese are warnings only - you may proceed if the combination is intentional.`
					: "";

				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Write the following content to PROJECT_BRIEF.md in the project root:\n\n${brief}${warningsSection}\n\n---\nNEXT STEP: Now create DEVELOPMENT_PLAN.md following the exact format from https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md

You can use devplan_generate_plan as a starting point, but you MUST enhance it to match the quality and detail level of the example.`,
						},
					],
				};
			}
		);

		// Tool 3: devplan_parse_brief
		this.server.tool(
			"devplan_parse_brief",
			"Parse an existing PROJECT_BRIEF.md file to extract structured data. Use this if a brief already exists.",
			{
				content: z.string().describe("Full PROJECT_BRIEF.md content"),
				response_format: z.enum(["json", "markdown"]).default("json").describe("Output format"),
			},
			async ({ content, response_format }) => {
				this.updateActivity();
				const parsed = parseBrief(content);
				const output =
					response_format === "json"
						? JSON.stringify(parsed, null, 2)
						: `# Parsed Brief\n\n**Project**: ${parsed.projectName}\n**Type**: ${parsed.projectType}\n**Goal**: ${parsed.primaryGoal}`;
				return {
					content: [{ type: "text", text: output }],
				};
			}
		);

		// Tool 4: devplan_generate_plan
		this.server.tool(
			"devplan_generate_plan",
			`Generate a DEVELOPMENT_PLAN.md scaffold. IMPORTANT: This outputs a SCAFFOLD, not a finished plan.

REQUIRED WORKFLOW (you MUST follow this):
1. Call this tool to get the scaffold
2. ENHANCE the scaffold by:
   - Reading the project's existing codebase
   - Writing COMPLETE file contents for each subtask (no "Add to" instructions)
   - Including ALL imports in every code block
   - Making test fixtures self-contained in each test file
   - Providing exact line context for any file modifications
3. Call devplan_validate_haiku_executable to verify the plan
4. If validation fails, fix the issues and re-validate
5. ONLY present the plan to the user after validation passes

The user should NEVER see the raw scaffold - only the enhanced, validated plan.`,
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md or JSON brief"),
				template: z.string().optional().describe("Template override"),
				min_severity: z.enum(["critical", "warning", "info"]).optional()
					.describe("Minimum severity of lessons to include. 'critical' = only critical, 'warning' = critical + warning, 'info' = all (default)"),
			},
			async ({ brief_content, min_severity }) => {
				this.updateActivity();
				// Get lessons from KV first - they're used for both:
				// 1. Injecting into subtask success criteria
				// 2. Adding safeguards section
				const env = (this as unknown as { env: Env }).env;
				let lessons: Lesson[] = [];
				let lessonsSection = "";
				let lessonsCount = 0;
				let injectedCount = 0;

				try {
					const storedLessons = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
					if (storedLessons && storedLessons.length > 0) {
						const brief = parseBrief(brief_content);
						const projectType = brief.projectType || "cli";

						// Filter by project type (excludes archived by default)
						let filteredLessons = filterLessonsForProject(storedLessons, projectType);

						// Apply severity filter if specified
						if (min_severity) {
							filteredLessons = filterLessonsBySeverity(filteredLessons, min_severity);
						}

						lessons = filteredLessons;
						lessonsSection = generateLessonsSafeguards(storedLessons, projectType, min_severity);
						lessonsCount = filteredLessons.length;
					}
				} catch {
					// No lessons yet
				}

				// Generate plan with lessons injected into subtask success criteria
				const plan = generatePlan(brief_content, lessons.length > 0 ? lessons : undefined);

				// Count how many subtasks got lesson-based criteria (approximate)
				if (lessons.length > 0) {
					const lessonMarkers = (plan.match(/\(from lesson:/g) || []).length;
					injectedCount = lessonMarkers;
				}

				// Insert safeguards section after "## How to Use This Plan" section
				let enhancedPlan = plan;
				if (lessonsSection) {
					const insertPoint = plan.indexOf("---\n\n## Project Overview");
					if (insertPoint !== -1) {
						enhancedPlan = plan.slice(0, insertPoint) + lessonsSection + "\n---\n\n" + plan.slice(insertPoint + 5);
					} else {
						// Fallback: prepend to plan
						enhancedPlan = lessonsSection + "\n" + plan;
					}
				}

				const severityNote = min_severity && min_severity !== "info"
					? ` (filtered to ${min_severity}+ severity)`
					: "";
				const lessonsNote = lessonsCount > 0
					? `\n\n📚 **${lessonsCount} lessons learned**${severityNote} incorporated: ${injectedCount > 0 ? `${injectedCount} injected into subtask success criteria` : "added as safeguards section"}.`
					: "";

				return {
					content: [
						{
							type: "text",
							text: `Here is a scaffold for DEVELOPMENT_PLAN.md:\n\n${enhancedPlan}\n\n---\nIMPORTANT: This is a starting point. You MUST review and enhance it to match the quality of https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md

Key things to verify/add:
- Each subtask has 3-7 specific deliverables with checkboxes
- Each subtask has testable success criteria
- Git instructions at the TASK level (not subtask)
- Prerequisites reference specific subtask IDs like "- [x] 1.2.1: Previous Subtask Title"
- Completion notes template for every subtask
- Complete, copy-pasteable code blocks (Haiku-executable)
- **Task Complete section** after each task with squash merge checklist:
  \`\`\`
  ### Task X.Y Complete - Squash Merge
  - [ ] All subtasks complete
  - [ ] All tests pass
  - [ ] Squash merge to main: \`git checkout main && git merge --squash feature/X-Y-name\`
  - [ ] Delete branch: \`git branch -d feature/X-Y-name\`
  \`\`\`${lessonsNote}

---

## 🔴 VALIDATION REQUIRED

Before presenting this plan to the user, you MUST:

1. **Enhance** this scaffold with complete, working code for each subtask
2. **Validate** by calling \`devplan_validate_haiku_executable\` with the enhanced plan
3. **Fix** any issues reported by validation
4. **Re-validate** until the plan passes

Do NOT show this scaffold to the user. Show only the validated plan.

NEXT STEP: Enhance this plan, then call devplan_validate_haiku_executable to verify it.`,
						},
					],
				};
			}
		);

		// Tool 5: devplan_generate_claude_md
		this.server.tool(
			"devplan_generate_claude_md",
			"Generate a CLAUDE.md scaffold with project rules and session checklists. Use this as a starting point, then enhance it to match https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/CLAUDE.md",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md or JSON brief"),
				language: z.string().default("python").describe("Primary language"),
				test_coverage: z.number().default(80).describe("Required coverage percentage"),
			},
			async ({ brief_content, language, test_coverage }) => {
				this.updateActivity();
				const claudeMd = generateClaudeMd(brief_content, language, test_coverage);
				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Write the following content to CLAUDE.md in the project root:\n\n${claudeMd}\n\n---\nIMPORTANT: This is a starting point. You MUST review and enhance it to match the quality and structure of https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/CLAUDE.md\n\nKey things to verify/add:\n- All 10 numbered sections present\n- Session checklists (Starting/Ending) with specific items\n- Git conventions with branch naming patterns\n- Code standards specific to the project language\n- Testing requirements with coverage thresholds\n- Completion notes template with line count tracking\n\nNEXT STEP: Create the executor agent using devplan_generate_executor`,
						},
					],
				};
			}
		);

		// Tool 6: devplan_list_templates
		this.server.tool(
			"devplan_list_templates",
			"List available project templates (cli, web_app, api, library). Use this to show the user what project types are supported.",
			{
				project_type: z.string().optional().describe("Filter by type"),
				response_format: z.enum(["json", "markdown"]).default("json").describe("Output format"),
			},
			async ({ project_type, response_format }) => {
				this.updateActivity();
				let templates = listTemplates();
				if (project_type) {
					templates = templates.filter((t) => t.type === project_type);
				}

				const output =
					response_format === "json"
						? JSON.stringify(templates, null, 2)
						: templates.map((t) => `- **${t.name}** (${t.type}): ${t.description}`).join("\n");

				return {
					content: [{ type: "text", text: output }],
				};
			}
		);

		// Tool 7: devplan_validate_plan
		this.server.tool(
			"devplan_validate_plan",
			"Validate a DEVELOPMENT_PLAN.md file for required sections and structure. Use this to check if a plan is complete.",
			{
				content: z.string().describe("DEVELOPMENT_PLAN.md content"),
				strict: z.boolean().default(false).describe("Treat warnings as errors"),
			},
			async ({ content, strict }) => {
				this.updateActivity();
				const result = validatePlan(content, strict);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Tool 8: devplan_get_subtask
		this.server.tool(
			"devplan_get_subtask",
			"Get details for a specific subtask by ID (e.g., '0.1.1'). Use during implementation to retrieve subtask requirements.",
			{
				plan_content: z.string().describe("DEVELOPMENT_PLAN.md content"),
				subtask_id: z.string().describe("ID in format X.Y.Z"),
			},
			async ({ plan_content, subtask_id }) => {
				this.updateActivity();
				const result = getSubtask(plan_content, subtask_id);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Tool 9: devplan_update_progress
		this.server.tool(
			"devplan_update_progress",
			"Mark a subtask as complete and add completion notes. Use after finishing a subtask to update DEVELOPMENT_PLAN.md.",
			{
				plan_content: z.string().describe("Current plan content"),
				subtask_id: z.string().describe("ID to mark complete"),
				completion_notes: z.string().describe("Notes about completion"),
			},
			async ({ plan_content, subtask_id, completion_notes }) => {
				this.updateActivity();
				const updated = updateProgress(plan_content, subtask_id, completion_notes);
				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Update DEVELOPMENT_PLAN.md with the following content:\n\n${updated}`,
						},
					],
				};
			}
		);

		// Tool 10: devplan_generate_executor
		this.server.tool(
			"devplan_generate_executor",
			"Generate an executor agent file (.claude/agents/{project}-executor.md). This creates a specialized Haiku-powered agent for executing subtasks with full project context.",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md content or JSON brief"),
				language: z.string().default("python").describe("Primary language (python or typescript)"),
			},
			async ({ brief_content, language }) => {
				this.updateActivity();
				const { content, filePath } = generateExecutorAgent(brief_content, language);
				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Create the executor agent file at \`${filePath}\`

First, create the directory if it doesn't exist:
\`\`\`bash
mkdir -p .claude/agents
\`\`\`

Then write the following content to \`${filePath}\`:

${content}

---
IMPORTANT: This executor agent uses \`model: haiku\` because the entire point of the DevPlan methodology is creating plans so detailed that Claude Haiku can execute them mechanically.

To use the executor, invoke it with:
\`\`\`
Use the {project}-executor agent to execute subtask X.Y.Z
\`\`\`

See https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/docs/EXECUTOR_AGENT.md for more details.`,
						},
					],
				};
			}
		);

		// Tool 11: devplan_generate_verifier
		this.server.tool(
			"devplan_generate_verifier",
			"Generate a verifier agent file (.claude/agents/{project}-verifier.md). This creates a Sonnet-powered agent for validating completed applications against PROJECT_BRIEF.md requirements.",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md content or JSON brief"),
				language: z.string().default("python").describe("Primary language (python or typescript)"),
			},
			async ({ brief_content, language }) => {
				this.updateActivity();
				const { content, filePath } = generateVerifierAgent(brief_content, language);
				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Create the verifier agent file at \`${filePath}\`

First, create the directory if it doesn't exist:
\`\`\`bash
mkdir -p .claude/agents
\`\`\`

Then write the following content to \`${filePath}\`:

${content}

---
IMPORTANT: This verifier agent uses \`model: sonnet\` because verification requires deeper analytical capabilities to "try to break" the application and find gaps.

To use the verifier, invoke it with:
\`\`\`
Use the {project}-verifier agent to validate the application against PROJECT_BRIEF.md
\`\`\`

See https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/docs/VERIFIER_AGENT.md for more details.`,
						},
					],
				};
			}
		);

		// Tool 12: devplan_progress_summary
		this.server.tool(
			"devplan_progress_summary",
			"Get a progress summary for a development plan. Shows completion percentage, phase-by-phase progress, next actionable subtask, and recently completed work.",
			{
				plan_content: z.string().describe("DEVELOPMENT_PLAN.md content"),
			},
			async ({ plan_content }) => {
				this.updateActivity();
				const summary = generateProgressSummary(plan_content);

				// Format as readable markdown
				const phaseProgressLines = summary.phaseProgress.map(
					(p) => `  - Phase ${p.id}: ${p.title} - ${p.completed}/${p.total} (${p.percentComplete}%)`
				).join("\n");

				const recentLines = summary.recentlyCompleted.length > 0
					? summary.recentlyCompleted.map((s) => `  - ${s.id}: ${s.title}`).join("\n")
					: "  - None yet";

				const nextAction = summary.nextSubtask
					? `**Next Subtask**: ${summary.nextSubtask.id} - ${summary.nextSubtask.title}\n\nTo continue, use this prompt:\n\`\`\`\nPlease read CLAUDE.md and DEVELOPMENT_PLAN.md completely, then implement subtask [${summary.nextSubtask.id}], following all rules and marking checkboxes as you complete each item.\n\`\`\``
					: `**🎉 All subtasks complete!**

## ⚠️ IMPORTANT: Run the Verifier

Before considering this project done, you MUST run the verifier agent:

\`\`\`
Use the {project}-verifier agent to validate the application against PROJECT_BRIEF.md
\`\`\`

The verifier will:
- Smoke test the application
- Verify each MVP feature works
- Try to break it with edge cases
- Produce a verification report

Any issues found can be captured as lessons learned using \`devplan_extract_lessons_from_report\`.

**Don't skip this step!** The verifier catches issues before users do.

---
💬 **Love DevPlan?** Share your experience with **#devplanmcp** on social media!`;

				const output = `# Development Plan Progress Summary

## Overall Progress
- **Phases**: ${summary.stats.phases}
- **Tasks**: ${summary.stats.tasks}
- **Subtasks**: ${summary.stats.completedSubtasks}/${summary.stats.subtasks} complete
- **Progress**: ${summary.stats.percentComplete}%

## Phase Progress
${phaseProgressLines}

## Recently Completed
${recentLines}

## ${nextAction}`;

				return {
					content: [{ type: "text", text: output }],
				};
			}
		);

		// Tool 13: devplan_add_lesson
		this.server.tool(
			"devplan_add_lesson",
			"Add a lesson learned from verifier feedback. Lessons are stored in KV and used to improve future plan generation.",
			{
				issue: z.string().describe("What went wrong - the problem observed"),
				root_cause: z.string().describe("Why it happened - the underlying cause"),
				fix: z.string().describe("How it was fixed - the solution applied"),
				pattern: z.string().describe("Pattern to watch for - a short identifier like 'Missing error handling for empty input'"),
				project_types: z.array(z.string()).optional().describe("Project types this applies to (e.g., ['cli', 'api']). Empty means all types."),
				severity: z.enum(["critical", "warning", "info"]).default("warning").describe("Severity: critical (must fix), warning (should fix), info (nice to know)"),
			},
			async ({ issue, root_cause, fix, pattern, project_types, severity }) => {
				this.updateActivity();
				const lesson: Lesson = {
					id: generateLessonId(),
					issue,
					rootCause: root_cause,
					fix,
					pattern,
					projectTypes: project_types || [],
					severity,
					createdAt: new Date().toISOString().split("T")[0],
				};

				// Get existing lessons from KV
				const env = (this as unknown as { env: Env }).env;
				let lessons: Lesson[] = [];
				try {
					const existing = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
					if (existing) {
						lessons = existing;
					}
				} catch {
					// First lesson, array doesn't exist yet
				}

				// Add the new lesson
				lessons.push(lesson);

				// Save back to KV
				await env.DEVPLAN_KV.put("lessons", JSON.stringify(lessons));

				return {
					content: [
						{
							type: "text",
							text: `✅ Lesson added successfully!

${formatLesson(lesson)}

**Total lessons stored**: ${lessons.length}

This lesson will be included in future plan generation for ${lesson.projectTypes.length === 0 ? "all project types" : lesson.projectTypes.join(", ") + " projects"}.`,
						},
					],
				};
			}
		);

		// Tool 14: devplan_list_lessons
		this.server.tool(
			"devplan_list_lessons",
			"List all lessons learned from previous projects. Optionally filter by project type or include archived lessons.",
			{
				project_type: z.string().optional().describe("Filter lessons for a specific project type (e.g., 'cli', 'api', 'web_app')"),
				include_archived: z.boolean().default(false).describe("Include archived lessons in the list"),
			},
			async ({ project_type, include_archived }) => {
				this.updateActivity();
				// Get lessons from KV
				const env = (this as unknown as { env: Env }).env;
				let lessons: Lesson[] = [];
				try {
					const existing = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
					if (existing) {
						lessons = existing;
					}
				} catch {
					// No lessons yet
				}

				if (lessons.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `📚 **No lessons learned yet.**

To add a lesson, use the \`devplan_add_lesson\` tool after finding an issue during verification.

Example workflow:
1. Run the verifier agent on a completed project
2. Find an issue that could have been prevented
3. Use \`devplan_add_lesson\` to capture:
   - What went wrong (issue)
   - Why it happened (root_cause)
   - How to fix it (fix)
   - Pattern to watch for (pattern)
   - Which project types it applies to (project_types)
   - How severe it is (severity)`,
							},
						],
					};
				}

				// Count archived vs active
				const archivedCount = lessons.filter(l => l.archived).length;
				const activeCount = lessons.length - archivedCount;

				// Filter by project type and archived status
				let filteredLessons: Lesson[];
				if (project_type) {
					filteredLessons = filterLessonsForProject(lessons, project_type, include_archived);
				} else if (!include_archived) {
					// Filter out archived lessons even without project type filter
					filteredLessons = lessons.filter(l => !l.archived);
				} else {
					filteredLessons = lessons;
				}

				// Group by severity
				const critical = filteredLessons.filter(l => l.severity === "critical");
				const warnings = filteredLessons.filter(l => l.severity === "warning");
				const info = filteredLessons.filter(l => l.severity === "info");

				const sections: string[] = [];
				const filterNote = project_type ? ` (filtered for ${project_type})` : "";
				const archivedNote = !include_archived && archivedCount > 0 ? ` (excluding ${archivedCount} archived)` : "";

				sections.push(`# 📚 Lessons Learned${filterNote}${archivedNote}

**Total**: ${filteredLessons.length} lessons shown | ${activeCount} active | ${archivedCount} archived
`);

				if (critical.length > 0) {
					sections.push(`## 🔴 Critical (${critical.length})
${critical.map(l => formatLesson(l)).join("\n\n")}
`);
				}

				if (warnings.length > 0) {
					sections.push(`## 🟡 Warnings (${warnings.length})
${warnings.map(l => formatLesson(l)).join("\n\n")}
`);
				}

				if (info.length > 0) {
					sections.push(`## 🔵 Info (${info.length})
${info.map(l => formatLesson(l)).join("\n\n")}
`);
				}

				// Add tip about archived lessons
				if (!include_archived && archivedCount > 0) {
					sections.push(`---
💡 **Tip**: Use \`include_archived: true\` to see ${archivedCount} archived lesson(s).`);
				}

				return {
					content: [{ type: "text", text: sections.join("\n") }],
				};
			}
		);

		// Tool 15: devplan_delete_lesson
		this.server.tool(
			"devplan_delete_lesson",
			"Delete a lesson by ID or pattern. Use this to remove outdated, incorrect, or duplicate lessons.",
			{
				lesson_id: z.string().optional().describe("The lesson ID to delete (e.g., 'lesson_1234567890_abc123')"),
				pattern: z.string().optional().describe("Delete lessons matching this pattern (partial match)"),
				confirm: z.boolean().default(false).describe("Set to true to actually delete. Without this, only shows what would be deleted."),
			},
			async ({ lesson_id, pattern, confirm }) => {
				this.updateActivity();
				if (!lesson_id && !pattern) {
					return {
						content: [
							{
								type: "text",
								text: "❌ You must provide either `lesson_id` or `pattern` to identify which lesson(s) to delete.",
							},
						],
					};
				}

				const env = (this as unknown as { env: Env }).env;
				let lessons: Lesson[] = [];
				try {
					const existing = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
					if (existing) {
						lessons = existing;
					}
				} catch {
					// No lessons
				}

				if (lessons.length === 0) {
					return {
						content: [{ type: "text", text: "📚 No lessons stored yet." }],
					};
				}

				// Find lessons to delete
				const toDelete = lessons.filter(l => {
					if (lesson_id) return l.id === lesson_id;
					if (pattern) return l.pattern.toLowerCase().includes(pattern.toLowerCase()) ||
						l.issue.toLowerCase().includes(pattern.toLowerCase());
					return false;
				});

				if (toDelete.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `❌ No lessons found matching ${lesson_id ? `ID "${lesson_id}"` : `pattern "${pattern}"`}`,
							},
						],
					};
				}

				if (!confirm) {
					return {
						content: [
							{
								type: "text",
								text: `⚠️ **Preview: ${toDelete.length} lesson(s) would be deleted**

${toDelete.map(l => formatLesson(l)).join("\n\n")}

---
To confirm deletion, call again with \`confirm: true\``,
							},
						],
					};
				}

				// Actually delete
				const remaining = lessons.filter(l => !toDelete.some(d => d.id === l.id));
				await env.DEVPLAN_KV.put("lessons", JSON.stringify(remaining));

				return {
					content: [
						{
							type: "text",
							text: `✅ **Deleted ${toDelete.length} lesson(s)**

${toDelete.map(l => `- ${l.pattern}`).join("\n")}

**Remaining lessons**: ${remaining.length}`,
						},
					],
				};
			}
		);

		// Tool 16: devplan_archive_lesson
		this.server.tool(
			"devplan_archive_lesson",
			"Archive or unarchive a lesson. Archived lessons are preserved but excluded from plan generation. Use this to retire old lessons without deleting them.",
			{
				lesson_id: z.string().describe("The lesson ID to archive/unarchive (e.g., 'lesson_1234567890_abc123')"),
				archive: z.boolean().default(true).describe("true to archive, false to unarchive"),
			},
			async ({ lesson_id, archive }) => {
				this.updateActivity();
				const env = (this as unknown as { env: Env }).env;
				let lessons: Lesson[] = [];
				try {
					const existing = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
					if (existing) {
						lessons = existing;
					}
				} catch {
					// No lessons
				}

				if (lessons.length === 0) {
					return {
						content: [{ type: "text", text: "📚 No lessons stored yet." }],
					};
				}

				// Find the lesson
				const lessonIndex = lessons.findIndex(l => l.id === lesson_id);
				if (lessonIndex === -1) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Lesson with ID "${lesson_id}" not found.\n\nUse \`devplan_list_lessons\` to see all available lessons and their IDs.`,
							},
						],
					};
				}

				const lesson = lessons[lessonIndex];
				const wasArchived = lesson.archived ?? false;

				if (wasArchived === archive) {
					return {
						content: [
							{
								type: "text",
								text: `ℹ️ Lesson is already ${archive ? "archived" : "active"}.\n\n${formatLesson(lesson)}`,
							},
						],
					};
				}

				// Update the lesson
				lessons[lessonIndex] = {
					...lesson,
					archived: archive,
					archivedAt: archive ? new Date().toISOString().split("T")[0] : undefined,
				};

				await env.DEVPLAN_KV.put("lessons", JSON.stringify(lessons));

				const action = archive ? "archived" : "unarchived";
				return {
					content: [
						{
							type: "text",
							text: `✅ Lesson ${action} successfully!\n\n${formatLesson(lessons[lessonIndex])}\n\n${
								archive
									? "This lesson will no longer be included in plan generation."
									: "This lesson is now active and will be included in plan generation."
							}`,
						},
					],
				};
			}
		);

		// Tool 17: devplan_extract_lessons_from_report
		this.server.tool(
			"devplan_extract_lessons_from_report",
			"Parse a verification report and extract suggested lessons. Returns pre-filled lesson data that can be reviewed and saved with devplan_add_lesson.",
			{
				report_content: z.string().describe("The full verification report markdown content"),
				project_type: z.string().optional().describe("Project type to associate with extracted lessons (e.g., 'cli', 'api')"),
			},
			async ({ report_content, project_type }) => {
				this.updateActivity();
				const extractedLessons: Array<{
					issue: string;
					rootCause: string;
					fix: string;
					pattern: string;
					severity: "critical" | "warning" | "info";
				}> = [];

				// Parse Critical Issues section
				const criticalMatch = report_content.match(/###\s*Critical\s*\([^)]*\)|###\s*Critical\s*Issues[^\n]*\n([\s\S]*?)(?=###|## |$)/i);
				if (criticalMatch) {
					const section = criticalMatch[1] || criticalMatch[0];
					const issues = section.match(/^\d+\.\s*(.+)$/gm) || [];
					for (const issue of issues) {
						const text = issue.replace(/^\d+\.\s*/, "").trim();
						if (text && !text.includes("None") && text.length > 5) {
							extractedLessons.push({
								issue: text,
								rootCause: "(needs analysis)",
								fix: "(needs solution)",
								pattern: text.split(/[:.–-]/)[0].trim().slice(0, 50),
								severity: "critical",
							});
						}
					}
				}

				// Parse Warnings section
				const warningsMatch = report_content.match(/###\s*Warnings?\s*\([^)]*\)|###\s*Warnings?\s*[^\n]*\n([\s\S]*?)(?=###|## |$)/i);
				if (warningsMatch) {
					const section = warningsMatch[1] || warningsMatch[0];
					const issues = section.match(/^\d+\.\s*(.+)$/gm) || [];
					for (const issue of issues) {
						const text = issue.replace(/^\d+\.\s*/, "").trim();
						if (text && !text.includes("None") && text.length > 5) {
							extractedLessons.push({
								issue: text,
								rootCause: "(needs analysis)",
								fix: "(needs solution)",
								pattern: text.split(/[:.–-]/)[0].trim().slice(0, 50),
								severity: "warning",
							});
						}
					}
				}

				// Parse Issues Found section (alternative format)
				const issuesFoundMatch = report_content.match(/##\s*Issues Found\s*\n([\s\S]*?)(?=## |$)/i);
				if (issuesFoundMatch && extractedLessons.length === 0) {
					const section = issuesFoundMatch[1];
					const issues = section.match(/^\d+\.\s*(.+)$/gm) || section.match(/^[-*]\s*(.+)$/gm) || [];
					for (const issue of issues) {
						const text = issue.replace(/^[\d\-*]+\.?\s*/, "").trim();
						if (text && !text.includes("None") && text.length > 5) {
							extractedLessons.push({
								issue: text,
								rootCause: "(needs analysis)",
								fix: "(needs solution)",
								pattern: text.split(/[:.–-]/)[0].trim().slice(0, 50),
								severity: "warning",
							});
						}
					}
				}

				// Parse failed table rows (Status: ❌)
				const failedRows = report_content.match(/\|[^|]*\|[^|]*\|[^|]*\|\s*❌\s*\|/g) || [];
				for (const row of failedRows) {
					const cells = row.split("|").filter(c => c.trim());
					if (cells.length >= 1) {
						const testName = cells[0].trim();
						if (testName && testName.length > 3) {
							// Avoid duplicates
							if (!extractedLessons.some(l => l.pattern.includes(testName.slice(0, 20)))) {
								extractedLessons.push({
									issue: `Test failed: ${testName}`,
									rootCause: "(needs analysis)",
									fix: "(needs solution)",
									pattern: `Failed: ${testName.slice(0, 40)}`,
									severity: "warning",
								});
							}
						}
					}
				}

				if (extractedLessons.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `📋 **No issues found in the verification report.**

The report appears to be clean, or the format wasn't recognized.

Expected formats:
- "### Critical Issues" or "### Critical (Must Fix Before Release)" sections with numbered items
- "### Warnings" sections with numbered items
- "## Issues Found" section with bullet points
- Tables with ❌ status indicators

If issues exist but weren't extracted, you can manually add them with \`devplan_add_lesson\`.`,
							},
						],
					};
				}

				const projectTypeStr = project_type ? `["${project_type}"]` : "[]";

				return {
					content: [
						{
							type: "text",
							text: `📋 **Extracted ${extractedLessons.length} potential lesson(s) from verification report**

Review each one and add with \`devplan_add_lesson\`:

${extractedLessons.map((l, i) => `---
### ${i + 1}. ${l.pattern}

**Severity**: ${l.severity}
**Issue**: ${l.issue}
**Root Cause**: ${l.rootCause}
**Fix**: ${l.fix}

\`\`\`json
{
  "issue": "${l.issue.replace(/"/g, '\\"')}",
  "root_cause": "(fill in after analysis)",
  "fix": "(fill in the solution)",
  "pattern": "${l.pattern.replace(/"/g, '\\"')}",
  "project_types": ${projectTypeStr},
  "severity": "${l.severity}"
}
\`\`\``).join("\n\n")}

---
**Next steps:**
1. Review each extracted issue
2. Fill in the root cause and fix for valuable lessons
3. Call \`devplan_add_lesson\` with the completed data
4. Skip trivial or one-off issues that won't recur`,
						},
					],
				};
			}
		);

		// ====================================================================
		// ISSUE-TO-TASK TOOLS (Post-release remediation planning)
		// ====================================================================

		// Tool 18: devplan_parse_issue - Analyze a GitHub issue
		this.server.tool(
			"devplan_parse_issue",
			"Parse and analyze a GitHub issue to extract structured remediation requirements. Use with: `gh issue view <number> --json number,title,body,labels,comments,url`",
			{
				issue_content: z.string().describe("JSON output from `gh issue view <number> --json number,title,body,labels,comments,url`"),
			},
			async ({ issue_content }) => {
				this.updateActivity();
				try {
					const issue = parseIssueContent(issue_content);
					const classification = classifyIssue(issue);
					const components = extractAffectedComponents(issue.body);

					const severityIcon = {
						critical: "🔴",
						high: "🟠",
						medium: "🟡",
						low: "🔵",
					}[classification.severity];

					return {
						content: [
							{
								type: "text",
								text: `# Issue #${issue.number} Analysis

**Title**: ${issue.title}
**Type**: ${classification.type}
**Severity**: ${severityIcon} ${classification.severity}
**State**: ${issue.state || "OPEN"}

## Affected Components
${components.length > 0 ? components.map((c) => `- \`${c}\``).join("\n") : "- (none detected - investigate codebase)"}

## Suggested Approach
${classification.suggestedApproach}

---

**Next step**: Use \`devplan_issue_to_task\` to generate a full remediation task from this issue.

Example:
\`\`\`
devplan_issue_to_task with:
  issue_content: <same JSON>
  mode: "append" (to add to existing DEVELOPMENT_PLAN.md)
  existing_plan: <content of DEVELOPMENT_PLAN.md>
\`\`\``,
							},
						],
					};
				} catch (e) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Error parsing issue: ${e instanceof Error ? e.message : "Unknown error"}

**Expected format**: JSON from \`gh issue view <number> --json number,title,body,labels,comments,url\`

Example:
\`\`\`bash
gh issue view 803 --json number,title,body,labels,comments,url
\`\`\``,
							},
						],
					};
				}
			}
		);

		// Tool 19: devplan_issue_to_task - Convert issue to remediation task
		this.server.tool(
			"devplan_issue_to_task",
			"Convert a GitHub issue into a remediation task with subtasks. Returns markdown suitable for appending to DEVELOPMENT_PLAN.md or creating a standalone REMEDIATION_PLAN.md.",
			{
				issue_content: z.string().describe("JSON output from `gh issue view <number> --json number,title,body,labels,comments,url`"),
				existing_plan: z.string().optional().describe("Existing DEVELOPMENT_PLAN.md content. If provided, generates task IDs that don't conflict with existing R.X phases."),
				mode: z.enum(["append", "standalone"]).default("standalone").describe("'append' generates content to add to existing plan, 'standalone' creates full REMEDIATION_PLAN.md"),
				project_type: z.string().optional().describe("Project type for context (cli, web_app, api, library)"),
				language: z.string().optional().describe("Primary language (python, typescript) for appropriate test patterns"),
			},
			async ({ issue_content, existing_plan, mode, project_type, language }) => {
				this.updateActivity();
				try {
					const issue = parseIssueContent(issue_content);
					const task = generateRemediationTask(issue, existing_plan, project_type, language);
					const markdown = formatRemediationPlan(task, mode);

					// Check for relevant lessons
					const env = (this as unknown as { env: Env }).env;
					let lessonsNote = "";
					try {
						const storedLessons = await env.DEVPLAN_KV.get<Lesson[]>("lessons", "json");
						if (storedLessons && storedLessons.length > 0) {
							const relevantLessons = findRelevantLessons(task.title, task.subtasks.flatMap((s) => s.deliverables), storedLessons, project_type || "cli");
							if (relevantLessons.length > 0) {
								lessonsNote = `\n\n📚 **Relevant lessons learned** (${relevantLessons.length}):\n${relevantLessons.map((l) => `- **${l.pattern}**: ${l.fix}`).join("\n")}\n\nConsider incorporating these into your fix approach.`;
							}
						}
					} catch {
						// No lessons or KV error - continue without
					}

					const actionText =
						mode === "append"
							? `## Action Required

Append the following content to your **DEVELOPMENT_PLAN.md** file.

**Recommended location**: Before the "## Git Workflow" section (if present), or at the end of the file.`
							: `## Action Required

Write the following content to a new **REMEDIATION_PLAN.md** file.`;

					return {
						content: [
							{
								type: "text",
								text: `# Generated Remediation Task for Issue #${task.issueNumber}

${actionText}
${lessonsNote}

---

${markdown}

---

## Execution Prompt

After adding the plan, execute the first subtask with:

\`\`\`
Please read CLAUDE.md and ${mode === "append" ? "DEVELOPMENT_PLAN.md" : "REMEDIATION_PLAN.md"} completely, then implement subtask ${task.subtasks[0].id}, following all rules and marking checkboxes as you complete each item.
\`\`\``,
							},
						],
					};
				} catch (e) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Error generating remediation task: ${e instanceof Error ? e.message : "Unknown error"}

**Expected format**: JSON from \`gh issue view <number> --json number,title,body,labels,comments,url\`

Example:
\`\`\`bash
gh issue view 803 --json number,title,body,labels,comments,url
\`\`\``,
							},
						],
					};
				}
			}
		);

		// Tool 20: devplan_usage_stats - View usage distribution
		this.server.tool(
			"devplan_usage_stats",
			"View usage statistics showing how requests are distributed across users. Helps understand if usage is concentrated among few users or spread across many.",
			{
				date: z.string().optional().describe("Date to query (YYYY-MM-DD format). Defaults to today."),
				days: z.number().optional().describe("Number of days to include (1-30). Defaults to 7."),
			},
			async ({ date, days = 7 }) => {
				this.updateActivity();
				const env = (this as unknown as { env: Env }).env;

				// Collect stats for the date range
				const stats: Array<{
					date: string;
					uniqueUsers: number;
					totalRequests: number;
					requestsPerUser: number[];
				}> = [];

				const endDate = date ? new Date(date) : new Date();
				const clampedDays = Math.min(Math.max(days, 1), 30);

				for (let i = 0; i < clampedDays; i++) {
					const d = new Date(endDate);
					d.setDate(d.getDate() - i);
					const dateStr = d.toISOString().split("T")[0];

					// List all keys for this date
					const listResult = await env.DEVPLAN_KV.list({ prefix: `usage:${dateStr}:` });

					const requestCounts: number[] = [];
					let totalRequests = 0;

					for (const key of listResult.keys) {
						const count = parseInt(await env.DEVPLAN_KV.get(key.name) || "0");
						if (count > 0) {
							requestCounts.push(count);
							totalRequests += count;
						}
					}

					// Sort descending for percentile calculations
					requestCounts.sort((a, b) => b - a);

					stats.push({
						date: dateStr,
						uniqueUsers: requestCounts.length,
						totalRequests,
						requestsPerUser: requestCounts,
					});
				}

				// Calculate aggregate stats
				const totalUsers = new Set(stats.flatMap(s => s.requestsPerUser.map((_, i) => `${s.date}:${i}`))).size;
				const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);
				const allRequestCounts = stats.flatMap(s => s.requestsPerUser).sort((a, b) => b - a);

				// Distribution analysis
				const median = allRequestCounts.length > 0
					? allRequestCounts[Math.floor(allRequestCounts.length / 2)]
					: 0;
				const p90 = allRequestCounts.length > 0
					? allRequestCounts[Math.floor(allRequestCounts.length * 0.1)]
					: 0;
				const max = allRequestCounts[0] || 0;
				const avg = allRequestCounts.length > 0
					? Math.round(totalRequests / allRequestCounts.length)
					: 0;

				// Daily breakdown
				const dailyBreakdown = stats.map(s => {
					const avg = s.uniqueUsers > 0 ? Math.round(s.totalRequests / s.uniqueUsers) : 0;
					const max = s.requestsPerUser[0] || 0;
					return `| ${s.date} | ${s.uniqueUsers} | ${s.totalRequests.toLocaleString()} | ${avg} | ${max} |`;
				}).join("\n");

				// Build histogram buckets
				const buckets = [
					{ label: "1-10", min: 1, max: 10, count: 0 },
					{ label: "11-50", min: 11, max: 50, count: 0 },
					{ label: "51-100", min: 51, max: 100, count: 0 },
					{ label: "101-500", min: 101, max: 500, count: 0 },
					{ label: "500+", min: 501, max: Infinity, count: 0 },
				];

				for (const count of allRequestCounts) {
					for (const bucket of buckets) {
						if (count >= bucket.min && count <= bucket.max) {
							bucket.count++;
							break;
						}
					}
				}

				const histogram = buckets
					.filter(b => b.count > 0)
					.map(b => {
						const bar = "█".repeat(Math.min(Math.ceil(b.count / 2), 30));
						return `| ${b.label.padEnd(7)} | ${bar} ${b.count} |`;
					}).join("\n");

				return {
					content: [
						{
							type: "text",
							text: `# DevPlan MCP Usage Statistics

## Summary (Last ${clampedDays} days)

| Metric | Value |
|--------|-------|
| **Total Requests** | ${totalRequests.toLocaleString()} |
| **Unique User-Days** | ${allRequestCounts.length} |
| **Avg Requests/User/Day** | ${avg} |
| **Median Requests/User** | ${median} |
| **90th Percentile** | ${p90} |
| **Max (Power User)** | ${max} |

## Daily Breakdown

| Date | Users | Requests | Avg/User | Max |
|------|-------|----------|----------|-----|
${dailyBreakdown}

## Request Distribution (Requests per User)

| Range   | Users |
|---------|-------|
${histogram || "| (no data) | |"}

---
*Note: Users are identified by hashed IP addresses for privacy. Each unique IP per day counts as one "user-day".*`,
						},
					],
				};
			}
		);

		// Tool 21: devplan_validate_haiku_executable - Check if plan is Haiku-executable
		this.server.tool(
			"devplan_validate_haiku_executable",
			"Validate that a DEVELOPMENT_PLAN.md is Haiku-executable (can be implemented by Claude Haiku without interpretation). Returns specific errors with fix instructions. IMPORTANT: After calling devplan_generate_plan, you MUST enhance the scaffold with complete code, then call this tool to validate before presenting to the user.",
			{
				plan_content: z.string().describe("Full content of DEVELOPMENT_PLAN.md to validate"),
			},
			async ({ plan_content }) => {
				this.updateActivity();

				const result = validateHaikuExecutable(plan_content);

				if (result.isHaikuExecutable) {
					return {
						content: [
							{
								type: "text",
								text: `# ✅ Plan is Haiku-Executable

## Summary
- **Status**: PASS
- **Subtasks Checked**: ${result.stats.subtasksChecked}
- **Code Blocks Checked**: ${result.stats.codeBlocksChecked}
- **Issues Found**: 0

${result.warnings.length > 0 ? `## Warnings (non-blocking)\n${result.warnings.map(w => `- ${w}`).join('\n')}` : ''}

The plan can be executed by Claude Haiku without interpretation. Each subtask has complete, copy-pasteable code.`,
							},
						],
					};
				}

				// Format errors for Claude to fix
				const errorsBySubtask = new Map<string, HaikuValidationError[]>();
				for (const error of result.errors) {
					const existing = errorsBySubtask.get(error.subtaskId) || [];
					existing.push(error);
					errorsBySubtask.set(error.subtaskId, existing);
				}

				let errorReport = "";
				for (const [subtaskId, errors] of errorsBySubtask) {
					errorReport += `\n### Subtask ${subtaskId}\n\n`;
					for (const error of errors) {
						errorReport += `**Issue**: ${error.message}\n`;
						errorReport += `**Type**: \`${error.type}\`\n`;
						errorReport += `**Fix**: ${error.fix}\n\n`;
					}
				}

				return {
					content: [
						{
							type: "text",
							text: `# ❌ Plan is NOT Haiku-Executable

## Summary
- **Status**: FAIL
- **Subtasks Checked**: ${result.stats.subtasksChecked}
- **Code Blocks Checked**: ${result.stats.codeBlocksChecked}
- **Issues Found**: ${result.stats.issuesFound}

## Issues to Fix
${errorReport}
${result.warnings.length > 0 ? `## Warnings\n${result.warnings.map(w => `- ${w}`).join('\n')}` : ''}

## Required Action

You MUST fix all issues above before presenting this plan to the user. For each issue:

1. Read the **Fix** instruction
2. Update the plan content accordingly
3. Re-run this validation tool
4. Repeat until validation passes

**Common Fixes**:
- \`add_to_instruction\`: Show complete file contents, not just additions
- \`missing_imports\`: Add all necessary import statements to code blocks
- \`cross_subtask_reference\`: Include fixture definitions in each test file
- \`ambiguous_modification\`: Provide exact line context or complete file
- \`incomplete_code\`: Replace placeholders with working code`,
						},
					],
					isError: true,
				};
			}
		);

		// Tool 22: devplan_export_workflow - Export plan as visual workflow
		this.server.tool(
			"devplan_export_workflow",
			"Export a DEVELOPMENT_PLAN.md as ReactFlow-compatible JSON for visual workflow tools like Sim.ai. Returns nodes, edges, and metadata for rendering the plan as an interactive diagram.",
			{
				plan_content: z.string().describe("Full content of DEVELOPMENT_PLAN.md"),
				platform: z
					.enum(["sim", "n8n", "reactflow", "generic"])
					.optional()
					.describe("Target platform format (default: reactflow)"),
				include_completed: z
					.boolean()
					.optional()
					.describe("Include completed subtasks in output (default: true)"),
				include_success_criteria: z
					.boolean()
					.optional()
					.describe("Include success criteria in node data (default: false)"),
			},
			async ({ plan_content, platform, include_completed, include_success_criteria }) => {
				this.updateActivity();

				const result = exportWorkflow(plan_content, {
					platform,
					includeCompleted: include_completed,
					includeSuccessCriteria: include_success_criteria,
				});

				if (!result.success) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Error exporting workflow: ${result.error}

**Expected format**: A DEVELOPMENT_PLAN.md file with:
- \`## Phase N: Title\` headers for phases
- \`### Task N.M: Title\` headers for tasks
- \`**Subtask N.M.P: Title**\` markers for subtasks
- \`**Prerequisites**:\` sections with checkbox items

Example usage:
\`\`\`
devplan_export_workflow({ plan_content: "..." })
\`\`\``,
							},
						],
						isError: true,
					};
				}

				return {
					content: [
						{
							type: "text",
							text: `# Workflow Export Successful

**Plan**: ${result.workflow.metadata.planName}
**Nodes**: ${result.workflow.metadata.nodeCount}
**Edges**: ${result.workflow.metadata.edgeCount}
**Platform**: ${result.workflow.metadata.platform}

## ReactFlow JSON

\`\`\`json
${JSON.stringify(result.workflow, null, 2)}
\`\`\`

## Usage

Import this JSON into ReactFlow, Sim.ai, or any compatible visual workflow tool.`,
						},
					],
				};
			}
		);

		// Tool 23: devplan_export_workflow_mermaid - Export plan as Mermaid diagram markdown
		this.server.tool(
			"devplan_export_workflow_mermaid",
			"Export a DEVELOPMENT_PLAN.md as a Mermaid flowchart diagram in markdown format. Perfect for embedding in documentation or viewing in VS Code/GitHub. Save the output as workflow.md to get a visual representation of your plan.",
			{
				plan_content: z.string().describe("Full content of DEVELOPMENT_PLAN.md"),
				include_completed: z
					.boolean()
					.optional()
					.describe("Include completed subtasks in output (default: true)"),
			},
			async ({ plan_content, include_completed }) => {
				this.updateActivity();

				const result = exportMermaid(plan_content, {
					includeCompleted: include_completed,
				});

				if (!result.success) {
					return {
						content: [
							{
								type: "text",
								text: `❌ Error exporting workflow: ${result.error}

**Expected format**: A DEVELOPMENT_PLAN.md file with:
- \`## Phase N: Title\` headers for phases
- \`### Task N.M: Title\` headers for tasks
- \`**Subtask N.M.P: Title**\` markers for subtasks
- \`**Prerequisites**:\` sections with checkbox items

Example usage:
\`\`\`
devplan_export_workflow_mermaid({ plan_content: "..." })
\`\`\``,
							},
						],
						isError: true,
					};
				}

				// Generate markdown with embedded Mermaid diagram
				const markdown = `# ${result.mermaid.metadata.planName} - Workflow

\`\`\`mermaid
${result.mermaid.diagram}
\`\`\`

---
*Generated by DevPlan MCP Server • ${result.mermaid.metadata.nodeCount} nodes • ${new Date(result.mermaid.metadata.exportedAt).toLocaleDateString()}*
`;

				return {
					content: [
						{
							type: "text",
							text: `# Mermaid Workflow Export Successful

**Plan**: ${result.mermaid.metadata.planName}
**Nodes**: ${result.mermaid.metadata.nodeCount}

## Save as workflow.md

Copy the content below and save it as \`workflow.md\` in your project. It will render as an interactive flowchart in VS Code, GitHub, and other Mermaid-compatible viewers.

---

${markdown}`,
						},
					],
				};
			}
		);
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Domain detection
		const isMcpSubdomain = url.hostname === "mcp.devplanmcp.store";
		const isRootDomain = url.hostname === "devplanmcp.store";
		const isWorkersDevDomain = url.hostname.endsWith(".workers.dev");

		// Redirect workers.dev to MCP subdomain for MCP endpoints, root for others
		if (isWorkersDevDomain) {
			const isMcpPath = url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp";
			const targetDomain = isMcpPath ? "https://mcp.devplanmcp.store" : "https://devplanmcp.store";
			const newUrl = new URL(url.pathname + url.search, targetDomain);
			return Response.redirect(newUrl.toString(), 301);
		}

		// MCP subdomain: redirect non-MCP paths to root domain
		if (isMcpSubdomain) {
			const isMcpPath = url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp" || url.pathname === "/health";
			if (!isMcpPath) {
				return Response.redirect(`https://devplanmcp.store${url.pathname}${url.search}`, 301);
			}
		}

		// Root domain: redirect MCP paths to MCP subdomain
		if (isRootDomain) {
			const isMcpPath = url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp";
			if (isMcpPath) {
				return Response.redirect(`https://mcp.devplanmcp.store${url.pathname}${url.search}`, 301);
			}
		}

		// Landing page - root domain only
		if (url.pathname === "/") {
			return handleLanding();
		}

		// Health check endpoint (JSON) - both domains
		if (url.pathname === "/health") {
			return new Response(
				JSON.stringify({
					name: "DevPlan MCP Server",
					version: "1.0.0",
					status: "healthy",
					auth: env.AUTH_ENABLED === "true" ? "enabled" : "disabled",
					docs: "https://github.com/mmorris35/devplan-mcp-server",
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// Dashboard endpoints - root domain only (already redirected above if on mcp subdomain)
		if (url.pathname === "/dashboard") {
			return handleDashboard(request, env);
		}
		if (url.pathname === "/dashboard/api/stats") {
			return handleDashboardAPI(env);
		}

		// MCP endpoints - mcp subdomain only (already redirected above if on root domain)
		if (url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp") {
			const accept = request.headers.get("Accept") || "";

			// Validate SSE endpoint requests
			if (url.pathname === "/sse") {
				// SSE clients must accept text/event-stream
				if (!accept.includes("text/event-stream") && !accept.includes("*/*")) {
					return new Response("Bad Request: SSE endpoint requires Accept: text/event-stream", { status: 400 });
				}
			}

			// Validate /mcp endpoint requests
			if (url.pathname === "/mcp" && request.method === "POST") {
				const contentType = request.headers.get("Content-Type") || "";
				// MCP HTTP clients must send JSON and accept both JSON and event-stream
				if (!contentType.includes("application/json")) {
					return new Response("Bad Request: MCP endpoint requires Content-Type: application/json", { status: 400 });
				}
				if (!accept.includes("application/json") && !accept.includes("*/*")) {
					return new Response("Bad Request: MCP endpoint requires Accept header with application/json", { status: 400 });
				}
			}

			// Validate API key and rate limits (passes through if AUTH_ENABLED=false)
			const authResult = await validateRequest(request, env);
			if (!authResult.authorized) {
				return unauthorizedResponse(authResult.error || "Unauthorized");
			}

			// Usage tracking disabled to stay within KV free tier limits
			// ctx.waitUntil(trackUsage(request, env));

			// Route to appropriate handler
			let response: Response;
			if (url.pathname === "/sse" || url.pathname === "/sse/message") {
				response = await DevPlanMCP.serveSSE("/sse").fetch(request, env, ctx);
			} else {
				response = await DevPlanMCP.serve("/mcp").fetch(request, env, ctx);
			}

			// Add rate limit headers to response
			return addRateLimitHeaders(response, authResult);
		}

		return new Response("Not Found", { status: 404 });
	},
};
