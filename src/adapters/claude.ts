/**
 * Claude Code adapter - generates CLAUDE.md and agent files.
 * This is the default adapter and reference implementation.
 *
 * This adapter wraps the existing generation functions to maintain
 * backward compatibility while enabling the adapter pattern.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile, AdapterTarget } from "./types";
import { generateClaudeMd, generateExecutorAgent, generateVerifierAgent } from "../generators";

/**
 * Claude Code adapter implementation.
 * Wraps existing generation functions to provide OutputAdapter interface.
 */
export class ClaudeAdapter implements OutputAdapter {
	readonly target: AdapterTarget = "claude";
	readonly displayName = "Claude Code";
	readonly agentFileExtension = ".md";
	readonly supportsExecutor = true;
	readonly supportsVerifier = true;

	/**
	 * Generate CLAUDE.md file by wrapping existing generateClaudeMd function.
	 */
	generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
		const content = generateClaudeMd(briefContent, config.language, config.testCoverage);
		return {
			path: "CLAUDE.md",
			content,
			isPrimary: true,
		};
	}

	/**
	 * Generate executor agent file by wrapping existing generateExecutorAgent function.
	 */
	generateExecutorAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
		const result = generateExecutorAgent(briefContent, config.language);
		return {
			path: result.filePath,
			content: result.content,
		};
	}

	/**
	 * Generate verifier agent file by wrapping existing generateVerifierAgent function.
	 */
	generateVerifierAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
		const result = generateVerifierAgent(briefContent, config.language);
		return {
			path: result.filePath,
			content: result.content,
		};
	}

	/**
	 * Claude uses the plan as-is without transformation.
	 */
	transformPhasePlan(planContent: string, _config: AdapterConfig): string {
		return planContent;
	}

	/**
	 * Get Claude Code-specific instructions for development plans.
	 */
	getPlanInstructions(): string {
		return `**For Claude Code**: Read this plan, find the subtask ID from the prompt, complete ALL checkboxes, update completion notes, commit.

**Prompt Template**:
\`\`\`
Please re-read CLAUDE.md and DEVELOPMENT_PLAN.md, then continue with [X.Y.Z], following all rules.
\`\`\``;
	}
}

/** Singleton instance of ClaudeAdapter */
export const claudeAdapter = new ClaudeAdapter();
