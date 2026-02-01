/**
 * Windsurf adapter - generates instructions for Codium's Windsurf editor.
 * Windsurf is an AI-native IDE built on Cascade architecture from Codium AI.
 *
 * The Windsurf adapter generates .windsurf/rules.md with project guidelines
 * and agent instructions optimized for Windsurf's Cascade reasoning engine.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";

/**
 * Windsurf IDE adapter implementation.
 * Generates rule files for Windsurf's AI-native development environment.
 */
export class WindsurfAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "windsurf";
	readonly displayName = "Windsurf (Codium)";
	readonly agentFileExtension = ".md";
	readonly supportsExecutor = false; // Windsurf operates as unified agent
	readonly supportsVerifier = false;

	/**
	 * Generate .windsurf/rules.md file for Windsurf IDE.
	 * This becomes the system context for Windsurf's Cascade reasoning.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = this.buildWindsurfRules(briefContent, config);
		return {
			path: ".windsurf/rules.md",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Windsurf does not support separate executor agents.
	 * All execution is handled by the unified IDE.
	 */
	generateExecutorAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Windsurf does not support separate verifier agents.
	 * All verification is handled by the unified IDE.
	 */
	generateVerifierAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Transform phase plan for Windsurf format.
	 * Windsurf benefits from clear structure and hierarchical organization.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		const lines = planContent.split("\n");
		const transformed: string[] = [];

		let inCodeBlock = false;
		let lastWasEmpty = false;

		for (const line of lines) {
			// Track code blocks
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				transformed.push(line);
				lastWasEmpty = false;
				continue;
			}

			if (inCodeBlock) {
				transformed.push(line);
				lastWasEmpty = false;
				continue;
			}

			// Skip consecutive empty lines
			if (!line.trim()) {
				if (!lastWasEmpty) {
					transformed.push(line);
					lastWasEmpty = true;
				}
				continue;
			}

			// Add separators before phase headers
			if (line.startsWith("## Phase")) {
				if (transformed.length > 0 && transformed[transformed.length - 1].trim()) {
					transformed.push("");
				}
				transformed.push(line);
				lastWasEmpty = false;
				continue;
			}

			// Convert task checkboxes to clear action items
			if (line.trim().startsWith("- [ ]")) {
				const task = line.replace(/^-\s*\[\s*\]\s*/, "").trim();
				// Format as a clear action
				if (task.includes(":")) {
					const [action, details] = task.split(":", 2);
					transformed.push(`- **${action.trim()}** - ${details.trim()}`);
				} else {
					transformed.push(`- **${task}**`);
				}
				lastWasEmpty = false;
				continue;
			}

			transformed.push(line);
			lastWasEmpty = false;
		}

		return transformed.join("\n");
	}

	/**
	 * Get Windsurf-specific instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Windsurf IDE**: Open this project in Windsurf editor. The Cascade reasoning engine will use .windsurf/rules.md for context.
Ask Windsurf to implement subtasks from DEVELOPMENT_PLAN.md. Windsurf will reason through implementation using Cascade multi-turn planning.

**Windsurf Workflow**:
1. Open project in Windsurf editor
2. Windsurf reads .windsurf/rules.md automatically
3. Request: "Please implement subtask X.Y.Z from DEVELOPMENT_PLAN.md"
4. Windsurf uses Cascade to plan and execute
5. Review and commit the changes`;
	}

	/**
	 * Build Windsurf rules content.
	 */
	private buildWindsurfRules(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		sections.push(this.buildWindsurfHeader(config));
		sections.push(this.buildProjectOverview(briefContent, config));
		sections.push(this.buildCascadeGuidance());
		sections.push(this.buildDevelopmentPhilosophy());
		sections.push(this.buildCodeStandards(config.language));
		sections.push(this.buildWorkflowRules(config.language));
		sections.push(this.buildTestingRules(config.testCoverage));
		sections.push(this.buildCommunicationRules());

		return sections.join("\n\n");
	}

	/**
	 * Build Windsurf header section.
	 */
	private buildWindsurfHeader(config: AdapterConfig): string {
		return `# Windsurf Rules for ${config.projectName}

**IDE**: Codium Windsurf with Cascade Reasoning
**Language**: ${this.formatLanguage(config.language)}
**Test Target**: ${config.testCoverage}%

This file defines rules and context for Windsurf's Cascade multi-turn reasoning engine.
Windsurf reads this file to understand project requirements and implement changes autonomously.`;
	}

	/**
	 * Build project overview section.
	 */
	private buildProjectOverview(briefContent: string, config: AdapterConfig): string {
		const lines: string[] = ["## Project Overview"];

		lines.push(`**Project**: ${config.projectName}`);
		lines.push(`**Language**: ${this.formatLanguage(config.language)}`);
		lines.push(`**Type**: Application development with DevPlan methodology`);
		lines.push("");

		// Extract overview from brief
		const briefLines = briefContent.split("\n");
		let foundOverview = false;

		for (let i = 0; i < briefLines.length; i++) {
			if (briefLines[i].includes("## Overview") || briefLines[i].includes("## Goal")) {
				foundOverview = true;
				lines.push("**Goal & Context**:");
				for (let j = i + 1; j < Math.min(i + 8, briefLines.length); j++) {
					const line = briefLines[j].trim();
					if (line.startsWith("#")) break;
					if (line && !line.startsWith("|")) {
						lines.push(line);
					}
				}
				break;
			}
		}

		if (!foundOverview) {
			lines.push("Refer to PROJECT_BRIEF.md for complete project details.");
		}

		return lines.join("\n");
	}

	/**
	 * Build Cascade guidance section.
	 */
	private buildCascadeGuidance(): string {
		return `## Cascade Reasoning Guide

The Cascade reasoning engine planning your development uses multi-turn analysis:

### Planning Phase
- Understand the current subtask from DEVELOPMENT_PLAN.md
- Identify all deliverables that need completion
- Check prerequisites: ensure prior subtasks are marked [x]
- Plan the sequence of file modifications

### Analysis Phase
- Examine existing code patterns in the project
- Identify conventions and style guidelines (see Code Standards below)
- Determine what files need creation vs. modification
- Check for dependencies and imports needed

### Implementation Phase
- Create and modify files in logical sequence
- Apply code standards consistently
- Test incrementally after significant changes
- Verify type correctness and compilation

### Verification Phase
- Ensure all tests pass
- Confirm code quality standards are met
- Verify no regressions in existing functionality
- Validate that all deliverables are complete`;
	}

	/**
	 * Build development philosophy section.
	 */
	private buildDevelopmentPhilosophy(): string {
		return `## Development Philosophy

### Core Principles

**1. Correctness First**
- All code must compile and pass type checking
- Tests verify correctness before any code is committed
- No skipping or disabling of quality checks

**2. Clarity Over Cleverness**
- Code should be easy to understand
- Use clear variable names and function signatures
- Document complex logic with comments
- Avoid unnecessary complexity

**3. Incremental Development**
- Complete one deliverable at a time
- Test after each logical change
- Commit frequently with semantic messages
- Break large tasks into smaller steps

**4. Pattern Consistency**
- Follow existing code patterns in the project
- Match formatting and style conventions
- Use the same approaches for similar problems
- Maintain architectural consistency

### Task Execution Mindset

When implementing a subtask:
- Read all requirements first (the "what" and "why")
- Don't make assumptions—follow specifications exactly
- Test thoroughly before considering task complete
- Document what you did in completion notes`;
	}

	/**
	 * Build code standards section.
	 */
	private buildCodeStandards(language: string): string {
		const baseStandards = `## Code Standards

### All Languages

- Follow existing patterns in the codebase
- Use meaningful, descriptive names
- Keep functions focused and single-purpose
- Add comments explaining "why", not "what"
- Avoid code duplication
- Keep nesting depth to maximum of 3 levels
- Prefer clarity over conciseness`;

		const languageSpecific: Record<string, string> = {
			typescript: `

### TypeScript Specifics

- Strict mode mandatory: \`"strict": true\`
- All exported functions must have explicit return types
- Use \`const\` by default, \`let\` only if variable is reassigned, never \`var\`
- Type imports only: \`import type { Type } from 'module'\`
- Interfaces for objects/contracts, types for unions/primitives
- Never use \`any\`—use \`unknown\` with proper type narrowing
- Use enums only for fixed constant sets; prefer discriminated unions`,

			python: `

### Python Specifics

- Follow PEP 8 style guide strictly
- Type hints on all function signatures
- Docstrings for modules, classes, and public methods
- Use f-strings for all string formatting
- Context managers (with statements) for resource handling
- List/dict comprehensions preferred over explicit loops
- Dataclasses or NamedTuple for structured data`,

			javascript: `

### JavaScript Specifics

- \`const\` by default, \`let\` if reassignment needed, never \`var\`
- Arrow functions for all callbacks: \`const fn = () => {}\`
- Template literals for string interpolation: \`\\\`Value: \${var}\\\`\`
- async/await instead of .then() chains
- JSDoc comments on all exported functions
- Destructuring for function parameters when helpful
- Early returns to reduce nesting`,

			rust: `

### Rust Specifics

- Rust naming: snake_case for functions, CamelCase for types
- Use \`Result<T, E>\` for fallible operations
- Avoid \`unwrap()\` in library code; use \`?:\` operator
- Borrowing instead of cloning for efficiency
- Documentation comments (///) for all public items
- Iterators over manual loops for clarity
- \`match\` expressions for exhaustive pattern matching`,

			go: `

### Go Specifics

- Go conventions: CamelCase for exports, lowercase for private
- Error handling: check and handle errors immediately
- Use \`errors.Is()\` and \`errors.As()\` for error comparison
- \`defer\` statements for resource cleanup
- Small, focused packages
- Comments for exported functions/types
- Avoid init() functions except essential setup`,
		};

		return baseStandards + (languageSpecific[language] || "");
	}

	/**
	 * Build workflow rules section.
	 */
	private buildWorkflowRules(language: string): string {
		const commands = this.getVerificationCommands(language);

		return `## Workflow Rules

### Task Execution Sequence

For each subtask in DEVELOPMENT_PLAN.md:

1. **Parse Requirements**
   - Find the subtask ID (format: X.Y.Z)
   - Read all deliverables in order
   - Verify all prerequisites are marked [x]

2. **Implement Changes**
   - Create/modify files as specified
   - Use exact code from Complete Code sections
   - Apply code standards consistently
   - Complete all imports and type annotations

3. **Verify Implementation**
   ${commands}

4. **Document & Commit**
   - Write completion notes in DEVELOPMENT_PLAN.md
   - Use semantic commit: \`feat(scope): description\`
   - Reference subtask ID in commit message
   - Push to feature branch (not main)

### File Modification Rules

- Create new files with complete, working content
- Modify existing files minimally (only necessary changes)
- Preserve formatting and style of existing code
- Don't remove unrelated code
- Always include necessary imports
- Update related tests when modifying functionality

### Testing Rules

- All new code must have corresponding tests
- Tests must pass before any subtask is marked complete
- Don't skip tests or disable quality checks
- Include both success and failure cases
- Use descriptive test names`;
	}

	/**
	 * Build testing rules section.
	 */
	private buildTestingRules(testCoverage: number): string {
		return `## Testing Rules

### Coverage Requirement: ${testCoverage}%

### Test Strategy

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test how modules work together
- **Regression Tests**: Verify fixes don't break existing features
- **File Organization**: One test file per source file

### Test Quality

- Descriptive names that explain what's being tested
- Test both success paths and error cases
- Mock external dependencies appropriately
- Keep tests independent and repeatable
- Avoid testing implementation details
- Provide clear assertion messages

### Test Execution Checklist

Before marking any subtask complete:

- [ ] Run full test suite
- [ ] Check coverage meets target (${testCoverage}%)
- [ ] All new code has tests
- [ ] No skipped tests or pending test cases
- [ ] Tests pass consistently (not flaky)`;
	}

	/**
	 * Build communication rules section.
	 */
	private buildCommunicationRules(): string {
		return `## Communication & Progress Rules

### Tracking Progress

- Mark deliverables with [x] as you complete them
- Add completion notes explaining what was done
- Update DEVELOPMENT_PLAN.md only for progress tracking
- Reference issue numbers where applicable

### Commit Message Format

Use semantic commits for clear history:

\`\`\`
feat(scope): short description

Longer explanation if needed.

Resolves #issue-number
\`\`\`

**Scopes**: generators, adapters, templates, tests, docs

Examples:
- \`feat(generators): add parseProjectBrief function\`
- \`test(adapters): add tests for GenericAdapter\`
- \`fix(templates): correct phase numbering\`

### Handoff Communication

When a subtask is complete, document:

- **What was implemented**: Brief summary of changes
- **Files modified/created**: List of changed files
- **Tests added**: New test files or test cases
- **Breaking changes**: Any API changes or incompatibilities
- **Related issues**: References to issues addressed

### Error Reporting

If blocked or unable to complete:

1. Document the blocker in completion notes
2. Explain what was attempted
3. Show error messages or logs
4. Request specific clarification needed
5. Don't commit incomplete or broken code`;
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
	private getVerificationCommands(language: string): string {
		const commands: Record<string, string> = {
			typescript: `- [ ] \`npx tsc --noEmit\` (type checking)
   - [ ] \`npm test\` (unit tests)
   - [ ] \`npm run lint\` (linting)
   - [ ] \`npm run format\` (code formatting)
   - [ ] \`npm run build\` (production build, if applicable)`,

			python: `- [ ] \`mypy .\` (type checking)
   - [ ] \`pytest\` (unit tests)
   - [ ] \`flake8\` or \`pylint\` (linting)
   - [ ] \`black .\` (code formatting)`,

			javascript: `- [ ] \`npm test\` (unit tests)
   - [ ] \`npm run lint\` (linting)
   - [ ] \`npm run format\` (formatting)
   - [ ] \`npm run build\` (build, if applicable)`,

			rust: `- [ ] \`cargo check\` (compilation check)
   - [ ] \`cargo test\` (unit tests)
   - [ ] \`cargo clippy\` (linting)
   - [ ] \`cargo fmt\` (code formatting)`,

			go: `- [ ] \`go build ./...\` (compilation check)
   - [ ] \`go test ./...\` (unit tests)
   - [ ] \`golangci-lint run\` (linting)
   - [ ] \`go fmt ./...\` (code formatting)`,
		};

		return commands[language] || "- [ ] All project-specific verification commands pass";
	}
}

/** Singleton instance of WindsurfAdapter */
export const windsurfAdapter = new WindsurfAdapter();
