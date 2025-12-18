import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

import { addRateLimitHeaders, unauthorizedResponse, validateRequest } from "./auth";
import {
	createBrief,
	generateClaudeMd,
	generateExecutorAgent,
	generatePlan,
	generateProgressSummary,
	getSubtask,
	parseBrief,
	updateProgress,
	validatePlan,
} from "./generators";
import { INTERVIEW_QUESTIONS, listTemplates } from "./templates";

// Extend Env interface for our bindings
interface Env {
	AUTH_ENABLED: string;
	FREE_TIER_LIMIT: string;
	DEVPLAN_KV: KVNamespace;
	MCP_OBJECT: DurableObjectNamespace;
}

export class DevPlanMCP extends McpAgent {
	server = new McpServer({
		name: "DevPlan",
		version: "1.0.0",
	});

	async init() {
		// Tool 0: devplan_start - The main entry point
		this.server.tool(
			"devplan_start",
			"START HERE: Initialize a new project using the DevPlan methodology. This tool provides instructions for building a comprehensive development plan that Claude Code can execute step-by-step.",
			{},
			async () => ({
				content: [
					{
						type: "text",
						text: `# DevPlan Project Builder

You are about to create a development plan using the ClaudeCode-DevPlanBuilder methodology.

## IMPORTANT: Read the methodology first

Before proceeding, you MUST read and understand the full methodology from the original repository:

1. **Read the README**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/README.md
2. **Read PROMPT_SEQUENCE.md**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/PROMPT_SEQUENCE.md
3. **Study the example files** in the hello-cli example:
   - https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/PROJECT_BRIEF.md
   - https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md
   - https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/CLAUDE.md
   - https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/hello-cli-executor.md
4. **Read the Executor Agent docs**: https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/docs/EXECUTOR_AGENT.md

## Your Task

After reading those files, help the user create these 4 files:
1. **PROJECT_BRIEF.md** - Capture their project requirements through interview
2. **DEVELOPMENT_PLAN.md** - A detailed, paint-by-numbers development plan following the exact format from the example
3. **CLAUDE.md** - Project rules following the exact format from the example
4. **Executor Agent** (.claude/agents/{project}-executor.md) - A specialized Haiku-powered agent for executing subtasks

## Key Principles from the Methodology

- Each subtask must be completable in a single 2-4 hour session
- 3-7 deliverables per subtask with explicit checkboxes
- Git branching at TASK level (not subtask) - one branch per task, squash merge when complete
- Prerequisites reference specific subtask IDs
- Completion notes template for every subtask
- Success criteria that are testable and objective
- Plans must be "Haiku-executable" - complete code, no inference required
- **Task Complete section** after each task's subtasks with squash merge checklist

## Next Step

Fetch and read the README.md from the repository above, then interview the user about their project idea.`,
					},
				],
			})
		);

		// Tool 1: devplan_interview_questions
		this.server.tool(
			"devplan_interview_questions",
			"Get interview questions to ask the user about their project. Ask these ONE AT A TIME, waiting for responses.",
			{},
			async () => ({
				content: [
					{
						type: "text",
						text: `Ask the user each of these questions ONE AT A TIME. Wait for their response before asking the next question.\n\n${JSON.stringify(INTERVIEW_QUESTIONS, null, 2)}`,
					},
				],
			})
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
				return {
					content: [
						{
							type: "text",
							text: `ACTION REQUIRED: Write the following content to PROJECT_BRIEF.md in the project root:\n\n${brief}\n\n---\nNEXT STEP: Now create DEVELOPMENT_PLAN.md following the exact format from https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md

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
			"Generate a DEVELOPMENT_PLAN.md scaffold. Use this as a starting point, then enhance it to match the example at https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md or JSON brief"),
				template: z.string().optional().describe("Template override"),
			},
			async ({ brief_content }) => {
				const plan = generatePlan(brief_content);
				return {
					content: [
						{
							type: "text",
							text: `Here is a scaffold for DEVELOPMENT_PLAN.md:\n\n${plan}\n\n---\nIMPORTANT: This is a starting point. You MUST review and enhance it to match the quality of https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/DEVELOPMENT_PLAN.md

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
  \`\`\`

NEXT STEP: Create CLAUDE.md following https://raw.githubusercontent.com/mmorris35/ClaudeCode-DevPlanBuilder/main/examples/hello-cli/CLAUDE.md`,
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

		// Tool 11: devplan_progress_summary
		this.server.tool(
			"devplan_progress_summary",
			"Get a progress summary for a development plan. Shows completion percentage, phase-by-phase progress, next actionable subtask, and recently completed work.",
			{
				plan_content: z.string().describe("DEVELOPMENT_PLAN.md content"),
			},
			async ({ plan_content }) => {
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
					: "**All subtasks complete!** Ready for final review and release.";

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
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Health check endpoint - no auth required
		if (url.pathname === "/" || url.pathname === "/health") {
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

		// MCP endpoints - apply auth middleware
		if (url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp") {
			// Validate API key and rate limits (passes through if AUTH_ENABLED=false)
			const authResult = await validateRequest(request, env);
			if (!authResult.authorized) {
				return unauthorizedResponse(authResult.error || "Unauthorized");
			}

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
