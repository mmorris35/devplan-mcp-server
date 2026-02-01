/**
 * Aider IDE adapter - generates .aider.conf.yml configuration files.
 * Aider is an AI pair programming tool that works with Claude or other LLMs.
 *
 * .aider.conf.yml uses YAML format with architect mode for strategic planning.
 * Unlike Claude/Cursor, Aider doesn't have separate executor/verifier agents.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";

/**
 * Aider IDE adapter implementation.
 * Generates .aider.conf.yml files with YAML configuration for AI pair programming.
 */
export class AiderAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "aider";
	readonly displayName = "Aider AI Pair Programmer";
	readonly agentFileExtension = ".yml";
	readonly supportsExecutor = false; // Aider uses architect mode instead
	readonly supportsVerifier = false; // Aider uses architect mode instead

	/**
	 * Generate .aider.conf.yml file for Aider.
	 * Uses YAML format with architect mode enabled for strategic planning.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = this.buildAiderConfig(briefContent, config);
		return {
			path: ".aider.conf.yml",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Aider does not support separate executor agents.
	 * All guidance is in the main .aider.conf.yml with architect mode.
	 */
	generateExecutorAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Aider does not support separate verifier agents.
	 * All guidance is in the main .aider.conf.yml with architect mode.
	 */
	generateVerifierAgent(_briefContent: string, _config: AdapterConfig): GeneratedFile | null {
		return null;
	}

	/**
	 * Transform phase plan for Aider format.
	 * Converts markdown task list to Aider-compatible rules.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		// Extract task structure and convert to Aider rules format
		const lines = planContent.split("\n");
		const rules: string[] = [];

		let inPhase = false;

		for (const line of lines) {
			// Detect phase headers (## Phase X: Name)
			if (line.startsWith("##") && line.includes("Phase")) {
				const phaseName = line.replace(/^#+\s*/, "").trim();
				rules.push(`# ${phaseName}`);
				inPhase = true;
				continue;
			}

			// Detect subtask headers (### or **Subtask)
			if ((line.startsWith("###") || line.includes("**Subtask")) && inPhase) {
				const taskName = line.replace(/^#+\s*|\*\*/g, "").trim();
				rules.push(`# ${taskName}`);
				continue;
			}

			// Detect deliverables (- [ ])
			if (line.trim().startsWith("- [ ]")) {
				const task = line.replace(/^-\s*\[\s*\]\s*/, "").trim();
				if (!task.includes("[x]")) {
					rules.push(`  - ${task}`);
				}
			}
		}

		return rules.join("\n");
	}

	/**
	 * Get Aider-specific instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Aider**: Load .aider.conf.yml with project configuration. Use architect mode for planning.

**Workflow with Aider CLI**:
\`\`\`bash
aider --config .aider.conf.yml
\`\`\`

**In Aider REPL**:
1. Enable architect mode: \`/architect\`
2. Load plan context: \`/read DEVELOPMENT_PLAN.md\`
3. Discuss phase objectives with the AI
4. Switch to code mode: \`/code\`
5. Implement each subtask incrementally
6. Verify with tests after each implementation`;
	}

	/**
	 * Build complete .aider.conf.yml content from brief and config.
	 */
	private buildAiderConfig(briefContent: string, config: AdapterConfig): string {
		const sections: string[] = [];

		// Add header comment with project info
		sections.push(this.buildHeaderComment(briefContent, config));

		// Add architect mode configuration
		sections.push(this.buildArchitectSection());

		// Add project rules
		sections.push(this.buildRulesSection(config.language));

		// Add model configuration
		sections.push(this.buildModelSection());

		// Add read-only files
		sections.push(this.buildReadOnlySection());

		// Add ignore patterns
		sections.push(this.buildIgnoreSection());

		return sections.join("\n\n");
	}

	/**
	 * Build header comment with project information.
	 */
	private buildHeaderComment(briefContent: string, config: AdapterConfig): string {
		const lines = [
			"# Aider Configuration for DevPlan-based Development",
			"#",
			`# Project: ${config.projectName}`,
			`# Language: ${config.language.charAt(0).toUpperCase() + config.language.slice(1)}`,
			`# Test Coverage Target: ${config.testCoverage}%`,
			"#",
			"# This file enables Aider's architect mode for strategic planning",
			"# of the development process defined in DEVELOPMENT_PLAN.md",
		];

		// Try to extract goal/overview from brief
		const briefLines = briefContent.split("\n");
		for (let i = 0; i < briefLines.length; i++) {
			if (briefLines[i].includes("## Overview") || briefLines[i].includes("## Goal")) {
				// Capture next few meaningful lines
				for (let j = i + 1; j < Math.min(i + 4, briefLines.length); j++) {
					const line = briefLines[j].trim();
					if (line && !line.startsWith("#") && !line.startsWith("|")) {
						lines.push(`# ${line}`);
						break;
					}
				}
				break;
			}
		}

		return lines.join("\n");
	}

	/**
	 * Build architect mode configuration section.
	 */
	private buildArchitectSection(): string {
		return `# Architect mode enables strategic planning for large changes
# Use /architect in Aider REPL to plan before implementation
architect: true

# Auto-commit changes after each implementation
auto-commits: true

# Include commit hashes in messages for traceability
commit-hashes: true`;
	}

	/**
	 * Build development rules section based on language.
	 */
	private buildRulesSection(language: string): string {
		const baseRules = [
			"rules:",
			"  # DevPlan workflow rules",
			"  - Read DEVELOPMENT_PLAN.md to understand phases and subtasks",
			"  - Complete subtasks in order, checking off deliverables as you go",
			"  - Run tests after each implementation to verify correctness",
			"  - Commit after each completed subtask with semantic message",
			"  - Use architect mode for strategic planning of complex changes",
		];

		const languageRules: Record<string, string[]> = {
			typescript: [
				"",
				"  # TypeScript-specific rules",
				"  - Use strict mode (strict: true in tsconfig.json)",
				"  - Add explicit return types to exported functions",
				"  - Use const for variables (never var)",
				"  - Prefer type imports: import type { Type }",
				"  - Use interfaces for object contracts",
				"  - Avoid any; use unknown if needed",
			],
			python: [
				"",
				"  # Python-specific rules",
				"  - Use type hints on function signatures",
				"  - Follow PEP 8 style guide",
				"  - Use docstrings for modules and functions",
				"  - Use f-strings for string formatting",
				"  - Use context managers (with statements)",
				"  - Prefer list comprehensions over loops",
			],
			javascript: [
				"",
				"  # JavaScript-specific rules",
				"  - Use const by default, let if rebinding needed",
				"  - Use arrow functions for callbacks",
				"  - Use template literals for string interpolation",
				"  - Use async/await instead of promises",
				"  - Add JSDoc comments on exported functions",
			],
			rust: [
				"",
				"  # Rust-specific rules",
				"  - Follow Rust naming conventions (snake_case for functions)",
				"  - Use Result for fallible operations",
				"  - Avoid unwrap() in library code",
				"  - Use borrowing to avoid unnecessary copies",
				"  - Document public APIs with documentation comments",
			],
			go: [
				"",
				"  # Go-specific rules",
				"  - Follow Go conventions (CamelCase for exports)",
				"  - Use errors.Is() for error checking",
				"  - Implement interfaces explicitly",
				"  - Use defer for cleanup operations",
				"  - Keep packages focused and small",
			],
		};

		const allRules = baseRules.concat(languageRules[language] || []);
		return allRules.join("\n");
	}

	/**
	 * Build model configuration section.
	 */
	private buildModelSection(): string {
		return `# Model configuration
# Uses Claude Sonnet 3.5 for high quality pair programming
model: claude-3-5-sonnet-20241022`;
	}

	/**
	 * Build read-only files section.
	 */
	private buildReadOnlySection(): string {
		return `# Read-only files for context without modification
read-only-files:
  - package.json
  - tsconfig.json
  - wrangler.toml
  - DEVELOPMENT_PLAN.md
  - PROJECT_BRIEF.md`;
	}

	/**
	 * Build ignore patterns section.
	 */
	private buildIgnoreSection(): string {
		return `# Patterns for files to exclude from Aider's context
ignore-patterns:
  - node_modules/
  - dist/
  - build/
  - "*.log"
  - ".DS_Store"
  - ".env"
  - ".env.local"`;
	}
}

/** Singleton instance of AiderAdapter */
export const aiderAdapter = new AiderAdapter();
