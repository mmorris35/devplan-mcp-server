/**
 * Cline adapter - generates instructions for the Cline VS Code extension.
 * Cline is an autonomous coding agent for VS Code with integrated tools.
 *
 * The Cline adapter generates .cline/instructions.md with task-specific guidance
 * and system prompts for the Cline extension to follow.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";

/**
 * Cline VS Code extension adapter implementation.
 * Generates instructions files for Cline's autonomous coding mode.
 */
export class ClineAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "cline";
	readonly displayName = "Cline (VS Code)";
	readonly agentFileExtension = ".md";
	readonly supportsExecutor = false; // Cline operates as a unified agent
	readonly supportsVerifier = false;

	/**
	 * Generate .cline/instructions.md file for Cline extension.
	 * This becomes Cline's system prompt and behavior guidelines.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = this.buildClineInstructions(briefContent, config);
		return {
			path: ".cline/instructions.md",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Cline does not support separate executor agents.
	 * All execution guidance is in the main instructions.
	 */
	generateExecutorAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Cline does not support separate verifier agents.
	 * All verification guidance is in the main instructions.
	 */
	generateVerifierAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Transform phase plan for Cline format.
	 * Cline works best with clear action lists.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		const lines = planContent.split("\n");
		const transformed: string[] = [];

		let currentSection = "";
		let inCodeBlock = false;

		for (const line of lines) {
			// Track code blocks
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
			}

			// Skip code blocks as-is
			if (inCodeBlock) {
				transformed.push(line);
				continue;
			}

			// Convert phase headers
			if (line.startsWith("## Phase") && !inCodeBlock) {
				const phaseName = line.replace(/^#+\s*/, "").trim();
				transformed.push(`\n## ${phaseName} - Execution Guide\n`);
				currentSection = phaseName;
				continue;
			}

			// Convert subtask headers to action items
			if (line.startsWith("###") && !inCodeBlock && !line.includes("Phase")) {
				const taskName = line.replace(/^#+\s*/, "").trim();
				transformed.push(`\n### Next Action: ${taskName}\n`);
				continue;
			}

			// Convert deliverables to checked action lists
			if (line.trim().startsWith("- [ ]") && !inCodeBlock) {
				const task = line.replace(/^-\s*\[\s*\]\s*/, "").trim();
				// Only include task description, not technical details
				if (!task.includes(":") && task.length > 0) {
					transformed.push(`- ✓ ${task}`);
				} else if (task.includes(":")) {
					// For tasks with colons, extract the main action
					const action = task.split(":")[0].trim();
					transformed.push(`- ✓ ${action}`);
				}
				continue;
			}

			// Keep other lines as-is
			transformed.push(line);
		}

		return transformed.join("\n");
	}

	/**
	 * Get Cline-specific instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Cline (VS Code)**: Open this project in VS Code with Cline extension installed.
Reference DEVELOPMENT_PLAN.md in Cline's message context. Cline will autonomously execute tasks following .cline/instructions.md.

**Cline Workflow**:
1. Open Cline chat in VS Code
2. Load DEVELOPMENT_PLAN.md as context
3. Ask: "Please implement subtask X.Y.Z from DEVELOPMENT_PLAN.md"
4. Cline will autonomously complete the implementation
5. Verify tests pass before proceeding`;
	}

	/**
	 * Build Cline instructions content.
	 */
	private buildClineInstructions(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		sections.push(this.buildClineSystemPrompt(config));
		sections.push(this.buildProjectContext(briefContent, config));
		sections.push(this.buildClineWorkflow());
		sections.push(this.buildCodeStandards(config.language));
		sections.push(this.buildClineTools());
		sections.push(this.buildExecutionGuidance(config.language, config.testCoverage));
		sections.push(this.buildErrorHandling());

		return sections.join("\n\n");
	}

	/**
	 * Build Cline system prompt section.
	 */
	private buildClineSystemPrompt(config: AdapterConfig): string {
		return `# Cline Instructions for ${config.projectName}

## System Prompt

You are Cline, an autonomous coding agent working on ${config.projectName}.
You have full access to VS Code tools, terminal commands, and file editing.

**Primary Goal**: Complete development subtasks specified in DEVELOPMENT_PLAN.md

**Key Capabilities You Have**:
- Read and edit files using VS Code
- Execute terminal commands (tests, build, lint, format)
- Search and understand code patterns
- Create new files and directories
- Run git commands

**Your Constraints**:
- Do not modify DEVELOPMENT_PLAN.md (except marking progress with Cline-specific markers)
- Do not push to remote repositories
- Do not delete important files
- Ask for clarification if requirements are ambiguous`;
	}

	/**
	 * Build project context section.
	 */
	private buildProjectContext(briefContent: string, config: AdapterConfig): string {
		const lines: string[] = ["## Project Context"];

		lines.push(`**Project**: ${config.projectName}`);
		lines.push(`**Language**: ${this.formatLanguage(config.language)}`);
		lines.push(`**Test Coverage Target**: ${config.testCoverage}%`);
		lines.push("");

		// Extract brief overview
		const briefLines = briefContent.split("\n");
		let foundOverview = false;

		for (let i = 0; i < briefLines.length; i++) {
			if (briefLines[i].includes("## Overview") || briefLines[i].includes("## Goal")) {
				foundOverview = true;
				lines.push("**Project Goal**:");
				for (let j = i + 1; j < Math.min(i + 5, briefLines.length); j++) {
					const line = briefLines[j].trim();
					if (line && !line.startsWith("#") && !line.startsWith("|")) {
						lines.push(`- ${line}`);
						if (lines.length > 6) break;
					}
				}
				break;
			}
		}

		if (!foundOverview) {
			lines.push("See PROJECT_BRIEF.md for complete project details.");
		}

		return lines.join("\n");
	}

	/**
	 * Build Cline workflow section.
	 */
	private buildClineWorkflow(): string {
		return `## Your Workflow

### Phase 1: Task Understanding (Analyze)

When given a subtask to implement:

1. **Locate the task** in DEVELOPMENT_PLAN.md
2. **Read all deliverables** - understand what needs to be created
3. **Check prerequisites** - ensure all prior subtasks are complete
4. **Plan your approach** - decide file modifications needed

### Phase 2: Implementation (Execute)

For each deliverable:

1. **Read existing code** - understand patterns and conventions
2. **Create/modify files** - make changes as specified
3. **Implement immediately** - don't ask for confirmation on straightforward tasks
4. **Test incrementally** - verify after each logical change

### Phase 3: Verification (Verify)

Before marking complete:

1. **Run tests** - ensure all tests pass
2. **Type check** - verify no type errors
3. **Lint/Format** - ensure code quality
4. **Final review** - confirm all deliverables completed

### Phase 4: Handoff (Commit)

1. **Commit changes** - use semantic commit messages
2. **Update progress** - mark subtask complete in DEVELOPMENT_PLAN.md
3. **Report results** - summarize what was implemented`;
	}

	/**
	 * Build code standards section.
	 */
	private buildCodeStandards(language: string): string {
		const standards = `## Code Standards

### Universal Rules

- Follow existing patterns in the codebase
- Write clear, maintainable code over clever code
- Add comments explaining complex logic
- Keep functions focused (single responsibility)
- Use meaningful names
- Avoid deep nesting (max 3 levels)`;

		const languageSpecific: Record<string, string> = {
			typescript: `

### TypeScript

- Strict mode: \`"strict": true\`
- Always add explicit return types to exported functions
- Use \`const\` by default, \`let\` only when needed
- Prefer \`import type\` for type-only imports
- Use interfaces for objects, types for unions
- Avoid \`any\`; use \`unknown\` with type narrowing`,

			python: `

### Python

- Follow PEP 8 style
- Use type hints on all functions
- Use docstrings for modules/classes/functions
- Use f-strings for formatting
- Use context managers for resources
- Prefer comprehensions over loops`,

			javascript: `

### JavaScript

- Use \`const\` by default
- Arrow functions for callbacks
- Template literals for strings
- async/await over .then()
- JSDoc comments on exports
- Destructure function parameters`,

			rust: `

### Rust

- snake_case for functions, CamelCase for types
- Use Result instead of panic
- Avoid unwrap() in library code
- Use borrowing instead of copies
- Document public APIs
- Use iterators over loops`,

			go: `

### Go

- CamelCase exports, snake_case private
- Check errors immediately
- Use errors.Is() and errors.As()
- Use defer for cleanup
- Keep packages focused
- Use comments for exports`,
		};

		return standards + (languageSpecific[language] || "");
	}

	/**
	 * Build Cline tools section.
	 */
	private buildClineTools(): string {
		return `## Cline Tools & Commands

### File Operations

- **Read files**: Use VS Code to open and read files
- **Edit files**: Make precise edits, add/remove lines as needed
- **Create files**: Create new files with complete content
- **Search**: Use VS Code search to find code patterns

### Terminal Commands

Execute these frequently:

\`\`\`bash
# Type checking (TypeScript)
npx tsc --noEmit

# Run tests
npm test
npx vitest run

# Format code
npm run format

# Lint code
npm run lint

# Build (if applicable)
npm run build
wrangler deploy --dry-run
\`\`\`

### Git Commands

- \`git status\` - Check current state
- \`git add <file>\` - Stage changes
- \`git commit -m "message"\` - Commit changes
- \`git log --oneline\` - View recent commits

### VS Code Features

- Open command palette: Ctrl+Shift+P (Cmd+Shift+P on Mac)
- Go to file: Ctrl+P
- Search in files: Ctrl+Shift+F
- Terminal: Ctrl+\` (backtick)`;
	}

	/**
	 * Build execution guidance section.
	 */
	private buildExecutionGuidance(language: string, testCoverage: number): string {
		const commands = this.getLanguageVerification(language);

		return `## Execution Guidance

### Before Starting Any Task

- [ ] Read DEVELOPMENT_PLAN.md
- [ ] Open the project in VS Code with Cline
- [ ] Ensure all dependencies are installed
- [ ] Run tests to verify baseline

### Subtask Execution Steps

1. **Preparation**
   - Read the subtask in DEVELOPMENT_PLAN.md
   - Review all deliverables
   - Check prerequisites are marked [x]

2. **Implementation**
   - Create/modify each file as specified
   - Use exact code from the plan
   - Test after each significant change

3. **Verification**
   ${commands}

4. **Completion**
   - All tests pass
   - Code quality checks pass
   - No TypeScript/type errors
   - All deliverables marked complete`;
	}

	/**
	 * Build error handling section.
	 */
	private buildErrorHandling(): string {
		return `## Error Handling

### Common Issues & Solutions

**If tests fail**:
1. Read the error message carefully
2. Identify which test is failing
3. Check the implementation matches requirements
4. Run tests again to verify fix

**If TypeScript compilation fails**:
1. Run \`npx tsc --noEmit\` to see all errors
2. Fix type errors one at a time
3. Check imports are correct
4. Ensure interface implementations match

**If you get stuck**:
1. Review the relevant code patterns in the existing codebase
2. Check if similar functionality exists
3. Reference the code standards above
4. Ask for clarification on ambiguous requirements

### When to Ask for Help

- Requirements are unclear or ambiguous
- Dependencies are not available
- Tests fail for unknown reasons
- You need clarification on design decisions`;
	}

	/**
	 * Format language name for display.
	 */
	private formatLanguage(language: string): string {
		const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
		return language === "typescript" ? "TypeScript" : capitalize(language);
	}

	/**
	 * Get language-specific verification commands.
	 */
	private getLanguageVerification(language: string): string {
		const commands: Record<string, string> = {
			typescript: `- [ ] \`npx tsc --noEmit\` passes
   - [ ] \`npm test\` passes
   - [ ] \`npm run lint\` passes (if available)
   - [ ] \`npm run format\` passes (if available)`,

			python: `- [ ] \`mypy .\` passes (type checking)
   - [ ] \`pytest\` passes (tests)
   - [ ] \`pylint\` passes (linting)
   - [ ] \`black --check\` passes (formatting)`,

			javascript: `- [ ] \`npm test\` passes
   - [ ] \`npm run lint\` passes (if available)
   - [ ] \`npm run format\` passes (if available)`,

			rust: `- [ ] \`cargo check\` passes
   - [ ] \`cargo test\` passes
   - [ ] \`cargo clippy\` passes
   - [ ] \`cargo fmt --check\` passes`,

			go: `- [ ] \`go test ./...\` passes
   - [ ] \`golangci-lint run\` passes (linting)
   - [ ] \`go fmt ./...\` passes (formatting)`,
		};

		return commands[language] || `- [ ] All tests pass for ${language}`;
	}
}

/** Singleton instance of ClineAdapter */
export const clineAdapter = new ClineAdapter();
