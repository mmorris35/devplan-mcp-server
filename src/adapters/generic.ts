/**
 * Generic adapter - generates model-agnostic markdown documentation.
 * Useful for custom AI models, research, or documentation purposes.
 *
 * The Generic adapter produces three markdown files:
 * - AGENTS.md: Main instructions and project context
 * - EXECUTOR.md: Detailed execution guidance
 * - VERIFIER.md: Verification and testing guidelines
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";

/**
 * Generic model-agnostic adapter implementation.
 * Generates comprehensive markdown documentation suitable for any AI model.
 */
export class GenericAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "generic";
	readonly displayName = "Generic (Model-Agnostic)";
	readonly agentFileExtension = ".md";
	readonly supportsExecutor = true; // Generic supports both
	readonly supportsVerifier = true;

	/**
	 * Generate AGENTS.md file with complete project context.
	 * This is the main agent file for generic models.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = this.buildAgentsMd(briefContent, config);
		return {
			path: "AGENTS.md",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Generate EXECUTOR.md file for execution guidance.
	 * Generic adapters support dedicated executor agents.
	 */
	generateExecutorAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
		const content = this.buildExecutorMd(briefContent, config);
		return {
			path: "EXECUTOR.md",
			content,
		};
	}

	/**
	 * Generate VERIFIER.md file for verification guidance.
	 * Generic adapters support dedicated verifier agents.
	 */
	generateVerifierAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
		const content = this.buildVerifierMd(briefContent, config);
		return {
			path: "VERIFIER.md",
			content,
		};
	}

	/**
	 * Return phase plan unchanged for generic format.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		return planContent;
	}

	/**
	 * Get generic instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Generic Models**: Review AGENTS.md, EXECUTOR.md, and VERIFIER.md for complete context.
Use DEVELOPMENT_PLAN.md to identify current subtask. Follow all guidelines in these files.

**Workflow**:
1. Executor: Read EXECUTOR.md, implement deliverables, run tests
2. Verifier: Read VERIFIER.md, verify implementation, confirm quality
3. Both: Reference AGENTS.md for project context and patterns`;
	}

	/**
	 * Build AGENTS.md content.
	 */
	private buildAgentsMd(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		sections.push(this.buildHeader(config));
		sections.push(this.buildProjectOverview(briefContent, config));
		sections.push(this.buildDevWorkflow());
		sections.push(this.buildCodeStandards(config.language));
		sections.push(this.buildTestingStrategy(config.testCoverage));
		sections.push(this.buildCommunication());

		return sections.join("\n\n");
	}

	/**
	 * Build EXECUTOR.md content.
	 */
	private buildExecutorMd(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		sections.push("# Executor Agent Guidelines\n\n");
		sections.push(`**Project**: ${config.projectName}`);
		sections.push(`**Language**: ${this.formatLanguage(config.language)}`);
		sections.push(`**Test Coverage Target**: ${config.testCoverage}%\n`);

		sections.push(this.buildExecutorWorkflow());
		sections.push(this.buildExecutorChecklist());
		sections.push(this.buildExecutorVerification(config.language));

		return sections.join("\n\n");
	}

	/**
	 * Build VERIFIER.md content.
	 */
	private buildVerifierMd(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		sections.push("# Verifier Agent Guidelines\n\n");
		sections.push(`**Project**: ${config.projectName}`);
		sections.push(`**Language**: ${this.formatLanguage(config.language)}`);
		sections.push(`**Test Coverage Target**: ${config.testCoverage}%\n`);

		sections.push(this.buildVerifierFocus());
		sections.push(this.buildVerifierChecklist());
		sections.push(this.buildQualityCriteria(config.testCoverage));

		return sections.join("\n\n");
	}

	/**
	 * Build header section.
	 */
	private buildHeader(config: AdapterConfig): string {
		return `# ${config.projectName} - Agent Instructions\n\n**Model**: Generic (Model-Agnostic)\n**Language**: ${this.formatLanguage(config.language)}`;
	}

	/**
	 * Build project overview section.
	 */
	private buildProjectOverview(briefContent: string, config: AdapterConfig): string {
		const lines: string[] = ["## Project Overview"];

		// Try to extract key info from brief
		const briefLines = briefContent.split("\n");
		let foundOverview = false;

		for (let i = 0; i < briefLines.length; i++) {
			if (briefLines[i].includes("## Overview") || briefLines[i].includes("## Goal")) {
				foundOverview = true;
				for (let j = i + 1; j < Math.min(i + 10, briefLines.length); j++) {
					const line = briefLines[j].trim();
					if (line.startsWith("#")) break;
					if (line) lines.push(line);
				}
				break;
			}
		}

		if (!foundOverview) {
			lines.push(`- **Project**: ${config.projectName}`);
			lines.push(`- **Language**: ${this.formatLanguage(config.language)}`);
			lines.push(`- **Test Target**: ${config.testCoverage}%`);
		}

		return lines.join("\n");
	}

	/**
	 * Build development workflow section.
	 */
	private buildDevWorkflow(): string {
		return `## Development Workflow

### For Each Subtask

1. **Understand the Task**
   - Read the subtask ID (X.Y.Z format) from DEVELOPMENT_PLAN.md
   - Review all deliverables listed
   - Identify prerequisite subtasks that must be complete

2. **Implement Deliverables**
   - Create/modify files exactly as specified
   - Follow code standards for your language
   - Include complete imports and type hints
   - Add JSDoc/docstring comments

3. **Test Your Changes**
   - Run the full test suite
   - Verify all new code has tests
   - Check type correctness
   - Ensure no breaking changes

4. **Document & Commit**
   - Update completion notes in DEVELOPMENT_PLAN.md
   - Create a semantic commit message
   - Reference the subtask ID in commit

### Semantic Commits

Use this format: \`feat(scope): description\`

- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code structure change
- **test**: Test additions or fixes
- **docs**: Documentation changes
- **chore**: Build/tooling changes`;
	}

	/**
	 * Build code standards section.
	 */
	private buildCodeStandards(language: string): string {
		const baseStandards = `## Code Style & Standards

### General Principles

- Follow the project's existing patterns and conventions
- Prioritize clarity and maintainability over cleverness
- Include comments explaining complex logic
- Keep functions focused on a single responsibility
- Use meaningful variable and function names
- Avoid deep nesting (max 3 levels)

### Imports & Dependencies

- Group imports by: standard lib, external packages, local modules
- Use absolute paths from project root
- Organize imports alphabetically within each group
- Remove unused imports`;

		const languageSpecific: Record<string, string> = {
			typescript: `

### TypeScript-Specific

- Use strict mode: \`"strict": true\` in tsconfig.json
- Add explicit return types to all exported functions
- Use \`const\` by default, \`let\` only if reassignment needed, never use \`var\`
- Prefer \`type\` imports for type-only imports: \`import type { Type }\`
- Use interfaces for object contracts, types for unions/primitives
- Avoid \`any\`; use \`unknown\` if needed and narrow with type guards
- Use enum only for constant sets; use union types for variants`,

			python: `

### Python-Specific

- Follow PEP 8 style guide
- Use type hints on all function signatures
- Use docstrings for modules, classes, and functions
- Use f-strings for string formatting (not % or .format())
- Use context managers (with statements) for resource handling
- Prefer list comprehensions over loops
- Use dataclasses or named tuples for data structures`,

			javascript: `

### JavaScript-Specific

- Use \`const\` by default, \`let\` if rebinding needed, never \`var\`
- Use arrow functions for callbacks: \`const fn = () => {}\`
- Use template literals for interpolation: \`\\\`string \${var}\\\`\`
- Use async/await instead of .then() for Promises
- Add JSDoc comments on exported functions
- Use destructuring for function parameters
- Return early to reduce nesting`,

			rust: `

### Rust-Specific

- Follow Rust naming conventions (snake_case for functions, CamelCase for types)
- Use Result<T, E> for fallible operations (not exceptions)
- Avoid \`unwrap()\` in library code; use \`?:\` operator
- Use borrowing to avoid unnecessary copies
- Document all public APIs with \`///\` comments
- Use iterators over manual loops
- Prefer \`match\` over \`if let\` when exhaustive matching is needed`,

			go: `

### Go-Specific

- Follow Go conventions (CamelCase for exports, snake_case for unexported)
- Check errors immediately after operations
- Use \`errors.Is()\` and \`errors.As()\` for error handling
- Interfaces are satisfied implicitly
- Use \`defer\` for cleanup operations
- Keep packages focused; avoid god packages
- Use comments starting with function name for exported items`,
		};

		return baseStandards + (languageSpecific[language] || "");
	}

	/**
	 * Build testing strategy section.
	 */
	private buildTestingStrategy(testCoverage: number): string {
		return `## Testing Strategy

### Coverage Target: ${testCoverage}%

### Test Structure

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test how components work together
- **Regression Tests**: Verify bug fixes don't resurface
- **One test file per source file** (e.g., \`generators.ts\` → \`generators.test.ts\`)

### Test Quality

- Use descriptive test names that explain what's being tested
- Test both success paths and error cases
- Mock external dependencies
- Keep tests independent (one test shouldn't affect another)
- Avoid testing implementation details; test behavior
- Use appropriate assertion messages

### Test Execution

- Run all tests before committing
- Check coverage for new code
- Fix failing tests immediately
- Don't skip tests (no \`.skip\` or \`.pending\`)`;
	}

	/**
	 * Build communication section.
	 */
	private buildCommunication(): string {
		return `## Communication & Handoff

### Progress Tracking

- Update DEVELOPMENT_PLAN.md as you complete subtasks
- Mark checkboxes with [x] when deliverables are complete
- Add completion notes explaining implementation details
- Reference related issues or discussions

### Executor to Verifier Handoff

The Executor should:
- Provide a clear summary of changes in commit message
- Reference the subtask ID (e.g., "feat(scope): description for 5.1.2")
- Ensure all tests pass

The Verifier should:
- Review the commit and test results
- Verify quality criteria are met
- Check documentation is complete`;
	}

	/**
	 * Build executor workflow section.
	 */
	private buildExecutorWorkflow(): string {
		return `## Executor Workflow

### Phase 1: Preparation

1. Read DEVELOPMENT_PLAN.md and find your subtask
2. Review all deliverables (checklist items)
3. Check prerequisites: ensure all prior subtasks are marked [x] complete
4. Read AGENTS.md for project context and conventions

### Phase 2: Implementation

For each deliverable:

1. **Understand what's needed**
   - Read the complete code in the DEVELOPMENT_PLAN.md
   - Note any file paths or import statements
   - Check for existing patterns to follow

2. **Implement exactly as specified**
   - Create or modify files as shown
   - Use exact code from the plan when provided
   - Complete all imports and type annotations
   - Don't skip or simplify requirements

3. **Update incrementally**
   - Make changes to one deliverable at a time
   - Test after each significant change
   - Verify types compile: \`npx tsc --noEmit\` or equivalent
   - Run tests: \`npm test\` or equivalent

### Phase 3: Verification

Before marking complete:

- [ ] All tests pass
- [ ] No TypeScript/type errors
- [ ] Code follows standards (lint/format passes)
- [ ] All deliverable checkboxes completed
- [ ] Completion notes are filled in`;
	}

	/**
	 * Build executor checklist section.
	 */
	private buildExecutorChecklist(): string {
		return `## Executor Checklist for Each Subtask

- [ ] Prerequisites met (all marked [x] in DEVELOPMENT_PLAN.md)
- [ ] Subtask deliverables understood
- [ ] All files created/modified per specification
- [ ] Code compiles without errors
- [ ] Unit tests pass: \`npm test\`
- [ ] Integration tests pass (if applicable)
- [ ] Code formatted: \`npm run format\` (if available)
- [ ] Linting passes: \`npm run lint\` (if available)
- [ ] Completion notes written in DEVELOPMENT_PLAN.md
- [ ] Changes committed with semantic message`;
	}

	/**
	 * Build executor verification section.
	 */
	private buildExecutorVerification(language: string): string {
		const commands = this.getLanguageCommands(language);

		return `## Verification Commands by Language

### ${this.formatLanguage(language)}

${commands}`;
	}

	/**
	 * Build verifier focus section.
	 */
	private buildVerifierFocus(): string {
		return `## Verifier Focus Areas

### Code Quality

- [ ] Code follows project style and conventions
- [ ] No code smells (duplication, dead code, overly complex logic)
- [ ] Comments explain "why", not "what"
- [ ] Function signatures are clear and well-documented
- [ ] Error handling is appropriate

### Testing Quality

- [ ] All new code has corresponding tests
- [ ] Test coverage meets or exceeds target
- [ ] Tests are independent and repeatable
- [ ] Edge cases are covered
- [ ] Tests have clear, descriptive names

### Functionality

- [ ] Implementation matches requirements
- [ ] Deliverables checklist is complete
- [ ] No regressions in existing functionality
- [ ] Performance is acceptable
- [ ] Security concerns are addressed`;
	}

	/**
	 * Build verifier checklist section.
	 */
	private buildVerifierChecklist(): string {
		return `## Verifier Checklist

Before approving a subtask:

- [ ] Read the subtask in DEVELOPMENT_PLAN.md
- [ ] Review the commit message and changes
- [ ] All tests pass: \`npm test\` or equivalent
- [ ] TypeScript/type checking passes
- [ ] Code review quality checks pass
- [ ] Coverage meets target (${80}% default)
- [ ] Documentation is complete
- [ ] Completion notes are informative
- [ ] Ready for next subtask (mark [x] in plan)`;
	}

	/**
	 * Build quality criteria section.
	 */
	private buildQualityCriteria(testCoverage: number): string {
		return `## Quality Criteria

### Test Coverage
- Minimum coverage: ${testCoverage}%
- All new code must have tests
- Both success and failure paths tested

### Code Coverage Tools

- **JavaScript/TypeScript**: \`npx vitest run --coverage\`
- **Python**: \`coverage run -m pytest && coverage report\`
- **Rust**: \`cargo tarpaulin\`
- **Go**: \`go test -cover ./...\`

### Performance
- No significant regressions in performance
- Large operations complete in reasonable time
- Memory usage is appropriate

### Documentation
- All public APIs documented
- Complex logic explained with comments
- Examples provided where helpful

### Maintainability
- Code is easy to understand
- Changes are isolated and focused
- Dependencies are minimized
- No unnecessary complexity`;
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
	private getLanguageCommands(language: string): string {
		const commands: Record<string, string> = {
			typescript: `\`\`\`bash
# Type checking
npx tsc --noEmit

# Run tests
npm test
# or
npx vitest run

# Check coverage
npx vitest run --coverage

# Format code
npm run format

# Lint
npm run lint
\`\`\``,

			python: `\`\`\`bash
# Type checking
mypy src/

# Run tests
pytest

# Check coverage
coverage run -m pytest
coverage report

# Format code
black .

# Lint
pylint src/ or flake8 src/
\`\`\``,

			javascript: `\`\`\`bash
# Run tests
npm test

# Check coverage
npm test -- --coverage

# Format code
npm run format

# Lint
npm run lint
\`\`\``,

			rust: `\`\`\`bash
# Check compilation
cargo check

# Run tests
cargo test

# Check coverage
cargo tarpaulin

# Format
cargo fmt

# Lint
cargo clippy
\`\`\``,

			go: `\`\`\`bash
# Check compilation
go build ./...

# Run tests
go test ./...

# Check coverage
go test -cover ./...

# Format
go fmt ./...

# Lint
golangci-lint run
\`\`\``,
		};

		return commands[language] || "See your language's testing framework documentation.";
	}
}

/** Singleton instance of GenericAdapter */
export const genericAdapter = new GenericAdapter();
