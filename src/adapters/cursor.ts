/**
 * Cursor IDE adapter - generates .cursorrules files.
 * Cursor is an AI-first code editor that uses .cursorrules for AI behavior customization.
 *
 * .cursorrules is a plain text file with sections and rules guiding the AI editor.
 * Unlike Claude/Aider, Cursor doesn't have separate executor/verifier agents.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";

/**
 * Cursor IDE adapter implementation.
 * Generates .cursorrules files with rule-based guidance for AI code editing.
 */
export class CursorAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "cursor";
	readonly displayName = "Cursor IDE";
	readonly agentFileExtension = ".cursorrules";
	readonly supportsExecutor = false; // Cursor doesn't have separate executor agents
	readonly supportsVerifier = false; // Cursor doesn't have separate verifier agents

	/**
	 * Generate .cursorrules file for Cursor IDE.
	 * Transforms project context into actionable rules for AI editing.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = this.buildCursorrules(briefContent, config);
		return {
			path: ".cursorrules",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Cursor does not support separate executor agents.
	 * Executor guidance is included in the main .cursorrules file.
	 */
	generateExecutorAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Cursor does not support separate verifier agents.
	 * Verification guidance is included in the main .cursorrules file.
	 */
	generateVerifierAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Transform phase plan for Cursor format.
	 * Converts markdown task list to rule-based guidance.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		// Extract task structure and convert to rules format
		const lines = planContent.split("\n");
		const rules: string[] = [];

		let currentPhase = "";
		let inTasks = false;

		for (const line of lines) {
			// Detect phase headers (## Phase X: Name)
			if (line.startsWith("##") && line.includes("Phase")) {
				currentPhase = line.replace(/^#+\s*/, "").trim();
				rules.push(`\n[${currentPhase}]\n`);
				inTasks = true;
				continue;
			}

			// Detect subtask headers (### or **Subtask)
			if ((line.startsWith("###") || line.includes("**Subtask")) && inTasks) {
				const taskName = line.replace(/^#+\s*|\*\*/g, "").trim();
				rules.push(`\nWhen implementing ${taskName}:`);
				continue;
			}

			// Detect deliverables (- [ ])
			if (line.trim().startsWith("- [ ]")) {
				const task = line.replace(/^-\s*\[\s*\]\s*/, "").trim();
				// Skip checkbox syntax, keep only the description
				if (!task.includes("[x]")) {
					rules.push(`- ${task}`);
				}
			}
		}

		return rules.join("\n");
	}

	/**
	 * Get Cursor IDE-specific instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Cursor IDE**: Open this plan in Cursor, reference .cursorrules in Composer with @.cursorrules.
Use Composer's multi-file editing to implement each subtask. Verify .cursorrules covers current phase.

**Composer Tips**:
- Reference the plan with @DEVELOPMENT_PLAN.md for context
- Reference .cursorrules with @.cursorrules for rules
- Use multiple edits in one Composer session
- Verify each deliverable checkbox before moving to next task`;
	}

	/**
	 * Build complete .cursorrules content from brief and config.
	 */
	private buildCursorrules(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		// Extract project info from brief
		const projectInfo = this.extractProjectInfo(briefContent, config);

		sections.push(projectInfo);

		// Add development workflow section
		sections.push(this.buildWorkflowSection());

		// Add code standards section
		sections.push(this.buildCodeStandardsSection(config.language));

		// Add task execution section
		sections.push(this.buildTaskExecutionSection());

		// Add testing section
		sections.push(this.buildTestingSection(config.testCoverage));

		return sections.join("\n\n");
	}

	/**
	 * Extract and format project information from brief.
	 */
	private extractProjectInfo(briefContent: string, config: AdapterConfig): string {
		const lines = [
			"[Project Overview]",
			"",
			`Project: ${config.projectName}`,
			`Language: ${config.language.charAt(0).toUpperCase() + config.language.slice(1)}`,
			`Test Coverage Target: ${config.testCoverage}%`,
		];

		// Try to extract goal/overview from brief
		const briefLines = briefContent.split("\n");
		for (let i = 0; i < briefLines.length; i++) {
			if (briefLines[i].includes("## Overview") || briefLines[i].includes("## Goal")) {
				// Capture next few meaningful lines
				for (let j = i + 1; j < Math.min(i + 5, briefLines.length); j++) {
					const line = briefLines[j].trim();
					if (line && !line.startsWith("#") && !line.startsWith("|")) {
						lines.push(line);
						break;
					}
				}
				break;
			}
		}

		return lines.join("\n");
	}

	/**
	 * Build workflow guidance section.
	 */
	private buildWorkflowSection(): string {
		return `[Development Workflow]

For each development task:

1. Read the current phase in DEVELOPMENT_PLAN.md
2. Identify all deliverables for the current subtask
3. Implement changes following code standards below
4. Verify all tests pass before moving to next subtask
5. Commit changes with semantic commit messages

When using Cursor Composer:
- Start with context by referencing @DEVELOPMENT_PLAN.md
- Use @.cursorrules to remind AI of project standards
- Reference @src for implementation patterns
- Make multiple file edits in one session
- Verify functionality before committing`;
	}

	/**
	 * Build code standards section based on language.
	 */
	private buildCodeStandardsSection(language: string): string {
		const baseStandards = `[Code Style & Standards]

General principles:
- Use the project's existing patterns and conventions
- Prioritize clarity and maintainability
- Include comments explaining complex logic
- Keep functions focused and single-purpose`;

		const languageSpecific: Record<string, string> = {
			typescript: `

TypeScript-Specific:
- Use strict mode (strict: true in tsconfig.json)
- Add explicit return types to exported functions
- Use const for variables (never var)
- Prefer type imports: import type { Type }
- Use interfaces for object contracts
- Avoid any; use unknown if needed`,

			python: `

Python-Specific:
- Use type hints on function signatures
- Follow PEP 8 style guide
- Use docstrings for modules and functions
- Use f-strings for string formatting
- Use context managers (with statements)
- Prefer list comprehensions over loops`,

			javascript: `

JavaScript-Specific:
- Use const by default, let if rebinding needed
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use async/await instead of promises
- Add JSDoc comments on exported functions`,

			rust: `

Rust-Specific:
- Follow Rust naming conventions (snake_case for functions)
- Use Result for fallible operations
- Avoid unwrap() in library code
- Use borrowing to avoid unnecessary copies
- Document public APIs with documentation comments`,

			go: `

Go-Specific:
- Follow Go conventions (CamelCase for exports)
- Use errors.Is() for error checking
- Implement interfaces explicitly
- Use defer for cleanup operations
- Keep packages focused and small`,
		};

		return baseStandards + (languageSpecific[language] || "");
	}

	/**
	 * Build task execution guidance section.
	 */
	private buildTaskExecutionSection(): string {
		return `[Task Execution]

For each subtask:

Deliverables Checklist:
- Read all deliverables listed in DEVELOPMENT_PLAN.md
- Create/modify files as specified
- Implement code exactly as shown in Complete Code sections
- Test each deliverable before moving to next

Verification Steps:
1. Run tests: npm test (or pytest, cargo test, etc.)
2. Type check: npx tsc --noEmit (for TypeScript)
3. Format: npm run format (if available)
4. Lint: npm run lint (if available)

Commit Standards:
- Use semantic commits: feat(scope): description
- One commit per subtask
- Reference issue numbers if applicable`;
	}

	/**
	 * Build testing requirements section.
	 */
	private buildTestingSection(testCoverage: number): string {
		return `[Testing Requirements]

Coverage Target: ${testCoverage}%

Test Strategy:
- Unit tests for each new function
- Integration tests for major features
- Regression tests for bug fixes
- One test file per source file (e.g., generators.ts → __tests__/generators.test.ts)

Test Execution:
- Run all tests: npm test
- Run specific test: npx vitest run <filename>
- Check coverage: npx vitest run --coverage

Test Quality:
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies
- Keep tests focused and isolated`;
	}
}

/** Singleton instance of CursorAdapter */
export const cursorAdapter = new CursorAdapter();
