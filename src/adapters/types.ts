/**
 * Output adapter interface for multi-model support.
 * Each adapter transforms DevPlan methodology into tool-specific formats.
 */

/** Supported target tools for agent generation */
export type AdapterTarget =
	| "claude" // Default - Claude Code with CLAUDE.md
	| "cursor" // Cursor with .cursorrules
	| "aider" // Aider with .aider.conf.yml
	| "cline" // VS Code Cline extension
	| "windsurf" // Codium Windsurf/Cascade
	| "generic"; // Model-agnostic markdown

/** Configuration passed to adapter methods */
export interface AdapterConfig {
	/** Target tool/model */
	target: AdapterTarget;
	/** Project name for file generation */
	projectName: string;
	/** Primary language (typescript, python, etc.) */
	language: string;
	/** Test coverage percentage */
	testCoverage: number;
	/** Custom options per adapter */
	options?: Record<string, unknown>;
}

/** Represents a generated file with path and content */
export interface GeneratedFile {
	/** Relative path from project root */
	path: string;
	/** File content */
	content: string;
	/** Whether this is the main agent file */
	isPrimary?: boolean;
}

/**
 * Interface for output adapters that transform DevPlan output for different tools.
 * Each adapter generates tool-specific agent files while preserving the core methodology.
 */
export interface OutputAdapter {
	/** Adapter identifier matching AdapterTarget */
	readonly target: AdapterTarget;

	/** Human-readable name for display */
	readonly displayName: string;

	/** File extension for agent config (e.g., '.md', '.cursorrules') */
	readonly agentFileExtension: string;

	/** Whether this adapter supports executor agents */
	readonly supportsExecutor: boolean;

	/** Whether this adapter supports verifier agents */
	readonly supportsVerifier: boolean;

	/**
	 * Generate the main agent instruction file (CLAUDE.md, .cursorrules, etc.)
	 * @param briefContent - PROJECT_BRIEF.md content or JSON brief
	 * @param config - Adapter configuration
	 * @returns Generated file with path and content
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile;

	/**
	 * Generate executor agent file if supported.
	 * @param briefContent - PROJECT_BRIEF.md content or JSON brief
	 * @param config - Adapter configuration
	 * @returns Generated file or null if not supported
	 */
	generateExecutorAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null;

	/**
	 * Generate verifier agent file if supported.
	 * @param briefContent - PROJECT_BRIEF.md content or JSON brief
	 * @param config - Adapter configuration
	 * @returns Generated file or null if not supported
	 */
	generateVerifierAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null;

	/**
	 * Transform a phase plan for this target's format.
	 * Most adapters return the plan unchanged; some may adjust formatting.
	 * @param planContent - DEVELOPMENT_PLAN.md content
	 * @param config - Adapter configuration
	 * @returns Transformed plan content
	 */
	transformPhasePlan(planContent: string, config: AdapterConfig): string;

	/**
	 * Get target-specific instructions to include in generated plans.
	 * @returns Markdown string with usage instructions
	 */
	getPlanInstructions(): string;
}
