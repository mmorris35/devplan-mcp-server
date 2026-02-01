import { describe, it, expect } from "vitest";
import {
	getAdapter,
	hasNativeAdapter,
	listTargets,
	listNativeTargets,
	claudeAdapter,
	cursorAdapter,
	aiderAdapter,
	clineAdapter,
	windsurfAdapter,
	genericAdapter,
	type AdapterTarget,
	type AdapterConfig,
} from "../adapters";

describe("adapters", () => {
	describe("ClaudeAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the adapter system |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "claude",
			projectName: "test-project",
			language: "python",
			testCoverage: 80,
		};

		it("should have correct target identifier", () => {
			expect(claudeAdapter.target).toBe("claude");
		});

		it("should have correct display name", () => {
			expect(claudeAdapter.displayName).toBe("Claude Code");
		});

		it("should support executor agents", () => {
			expect(claudeAdapter.supportsExecutor).toBe(true);
		});

		it("should support verifier agents", () => {
			expect(claudeAdapter.supportsVerifier).toBe(true);
		});

		it("should generate agent file with correct path", () => {
			const result = claudeAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe("CLAUDE.md");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("CLAUDE.md");
		});

		it("should generate executor agent", () => {
			const result = claudeAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).not.toBeNull();
			expect(result!.path).toContain("-executor.md");
			expect(result!.content).toContain("Executor");
		});

		it("should generate verifier agent", () => {
			const result = claudeAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).not.toBeNull();
			expect(result!.path).toContain("-verifier.md");
			expect(result!.content).toContain("Verifier");
		});

		it("should return plan unchanged in transformPhasePlan", () => {
			const plan = "# Development Plan\n\nSome content";
			const result = claudeAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toBe(plan);
		});

		it("should provide plan instructions", () => {
			const instructions = claudeAdapter.getPlanInstructions();
			expect(instructions).toContain("Claude Code");
			expect(instructions).toContain("CLAUDE.md");
		});
	});

	describe("CursorAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the cursor adapter |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "cursor",
			projectName: "test-project",
			language: "typescript",
			testCoverage: 80,
		};

		it("should have correct target identifier", () => {
			expect(cursorAdapter.target).toBe("cursor");
		});

		it("should have correct display name", () => {
			expect(cursorAdapter.displayName).toBe("Cursor IDE");
		});

		it("should use .cursorrules file extension", () => {
			expect(cursorAdapter.agentFileExtension).toBe(".cursorrules");
		});

		it("should not support executor agents", () => {
			expect(cursorAdapter.supportsExecutor).toBe(false);
		});

		it("should not support verifier agents", () => {
			expect(cursorAdapter.supportsVerifier).toBe(false);
		});

		it("should generate agent file with .cursorrules path", () => {
			const result = cursorAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe(".cursorrules");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("[");
			expect(result.content).toContain("Project Overview");
		});

		it("should return null for executor agent", () => {
			const result = cursorAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should return null for verifier agent", () => {
			const result = cursorAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should return plan unchanged in transformPhasePlan", () => {
			const plan = "# Development Plan\n\nSome content";
			const result = cursorAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toBeDefined();
			expect(typeof result).toBe("string");
		});

		it("should provide plan instructions", () => {
			const instructions = cursorAdapter.getPlanInstructions();
			expect(instructions).toContain("Cursor");
			expect(instructions).toContain(".cursorrules");
		});

		it("should generate content with required sections", () => {
			const result = cursorAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("[Project Overview]");
			expect(result.content).toContain("[Development Workflow]");
			expect(result.content).toContain("[Code Style & Standards]");
		});
	});

	describe("AiderAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the aider adapter |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "aider",
			projectName: "test-project",
			language: "typescript",
			testCoverage: 80,
		};

		it("should have correct target identifier", () => {
			expect(aiderAdapter.target).toBe("aider");
		});

		it("should have correct display name", () => {
			expect(aiderAdapter.displayName).toBe("Aider AI Pair Programmer");
		});

		it("should use .yml file extension", () => {
			expect(aiderAdapter.agentFileExtension).toBe(".yml");
		});

		it("should not support executor agents", () => {
			expect(aiderAdapter.supportsExecutor).toBe(false);
		});

		it("should not support verifier agents", () => {
			expect(aiderAdapter.supportsVerifier).toBe(false);
		});

		it("should generate agent file with .aider.conf.yml path", () => {
			const result = aiderAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe(".aider.conf.yml");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("architect:");
			expect(result.content).toContain("true");
		});

		it("should include YAML configuration keys", () => {
			const result = aiderAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("architect:");
			expect(result.content).toContain("auto-commits:");
			expect(result.content).toContain("model:");
			expect(result.content).toContain("read-only-files:");
			expect(result.content).toContain("ignore-patterns:");
		});

		it("should return null for executor agent", () => {
			const result = aiderAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should return null for verifier agent", () => {
			const result = aiderAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should include rules section with language-specific guidance", () => {
			const result = aiderAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("rules:");
			expect(result.content).toContain("- Read DEVELOPMENT_PLAN.md");
			// TypeScript specific
			expect(result.content).toContain("strict mode");
		});

		it("should generate Python-specific rules when language is python", () => {
			const pythonConfig = { ...testConfig, language: "python" };
			const result = aiderAdapter.generateAgentFile(testBrief, pythonConfig);
			expect(result.content).toContain("PEP 8");
			expect(result.content).toContain("type hints");
		});

		it("should generate Rust-specific rules when language is rust", () => {
			const rustConfig = { ...testConfig, language: "rust" };
			const result = aiderAdapter.generateAgentFile(testBrief, rustConfig);
			expect(result.content).toContain("Rust naming conventions");
			expect(result.content).toContain("Result");
		});

		it("should transform phase plan to Aider comment format", () => {
			const plan = `## Phase 1: Setup

### Subtask 1.1.1: Initialize project

- [ ] Create src/ directory
- [ ] Create package.json`;
			const result = aiderAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toContain("# Phase 1: Setup");
			expect(result).toContain("# Subtask 1.1.1");
			expect(result).toContain("- Create src/");
		});

		it("should return plan-related instructions", () => {
			const instructions = aiderAdapter.getPlanInstructions();
			expect(instructions).toContain("Aider");
			expect(instructions).toContain(".aider.conf.yml");
			expect(instructions).toContain("/architect");
			expect(instructions).toContain("aider");
		});

		it("should include project information in header", () => {
			const result = aiderAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Project: test-project");
			expect(result.content).toContain("Language: Typescript");
		});

		it("should set correct model in config", () => {
			const result = aiderAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("model: claude-3-5-sonnet-20241022");
		});
	});

	describe("getAdapter", () => {
		it("should return claude adapter by default", () => {
			const adapter = getAdapter();
			expect(adapter.target).toBe("claude");
		});

		it("should return claude adapter for 'claude' target", () => {
			const adapter = getAdapter("claude");
			expect(adapter.target).toBe("claude");
		});

		it("should return cursor adapter for 'cursor' target", () => {
			const adapter = getAdapter("cursor");
			expect(adapter.target).toBe("cursor");
		});

		it("should return aider adapter for 'aider' target", () => {
			const adapter = getAdapter("aider");
			expect(adapter.target).toBe("aider");
		});

		it("should fall back to claude for unimplemented targets", () => {
			const targets: AdapterTarget[] = ["cline", "windsurf", "generic"];
			for (const target of targets) {
				const adapter = getAdapter(target);
				// These fall back to claude
				expect(adapter).toBeDefined();
				expect(adapter.displayName).toBeDefined();
			}
		});
	});

	describe("hasNativeAdapter", () => {
		it("should return true for claude", () => {
			expect(hasNativeAdapter("claude")).toBe(true);
		});

		it("should return true for cursor", () => {
			expect(hasNativeAdapter("cursor")).toBe(true);
		});

		it("should return true for aider", () => {
			expect(hasNativeAdapter("aider")).toBe(true);
		});

		it("should return true for all Phase 8 adapters", () => {
			expect(hasNativeAdapter("cline")).toBe(true);
			expect(hasNativeAdapter("windsurf")).toBe(true);
			expect(hasNativeAdapter("generic")).toBe(true);
		});
	});

	describe("listTargets", () => {
		it("should return all 6 targets", () => {
			const targets = listTargets();
			expect(targets).toHaveLength(6);
			expect(targets).toContain("claude");
			expect(targets).toContain("cursor");
			expect(targets).toContain("aider");
			expect(targets).toContain("cline");
			expect(targets).toContain("windsurf");
			expect(targets).toContain("generic");
		});
	});

	describe("listNativeTargets", () => {
		it("should return all native targets after Phase 8", () => {
			const native = listNativeTargets();
			expect(native).toHaveLength(6);
			expect(native).toContain("claude");
			expect(native).toContain("cursor");
			expect(native).toContain("aider");
			expect(native).toContain("cline");
			expect(native).toContain("windsurf");
			expect(native).toContain("generic");
		});
	});

	describe("ClineAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the cline adapter |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "cline",
			projectName: "test-project",
			language: "typescript",
			testCoverage: 80,
		};

		it("should have correct target identifier", () => {
			expect(clineAdapter.target).toBe("cline");
		});

		it("should have correct display name", () => {
			expect(clineAdapter.displayName).toBe("Cline (VS Code)");
		});

		it("should use .md file extension", () => {
			expect(clineAdapter.agentFileExtension).toBe(".md");
		});

		it("should not support executor agents", () => {
			expect(clineAdapter.supportsExecutor).toBe(false);
		});

		it("should not support verifier agents", () => {
			expect(clineAdapter.supportsVerifier).toBe(false);
		});

		it("should generate agent file with .cline/instructions.md path", () => {
			const result = clineAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe(".cline/instructions.md");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("Cline");
			expect(result.content).toContain("Instructions");
		});

		it("should return null for executor agent", () => {
			const result = clineAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should return null for verifier agent", () => {
			const result = clineAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should include project context in instructions", () => {
			const result = clineAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("test-project");
			expect(result.content).toContain("TypeScript");
		});

		it("should include workflow guidance", () => {
			const result = clineAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Workflow");
			expect(result.content).toContain("Task Understanding");
			expect(result.content).toContain("Implementation");
		});

		it("should include code standards for the language", () => {
			const result = clineAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Code Standards");
			expect(result.content).toContain("TypeScript");
		});

		it("should transform phase plan to action items", () => {
			const plan = `## Phase 1: Setup

- [ ] Create src/ directory
- [ ] Create package.json`;
			const result = clineAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toContain("Phase 1");
			expect(typeof result).toBe("string");
		});

		it("should provide plan instructions", () => {
			const instructions = clineAdapter.getPlanInstructions();
			expect(instructions).toContain("Cline");
			expect(instructions).toContain("VS Code");
		});

		it("should include tools section", () => {
			const result = clineAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Cline Tools");
		});

		it("should generate Python-specific content when language is python", () => {
			const pythonConfig = { ...testConfig, language: "python" };
			const result = clineAdapter.generateAgentFile(testBrief, pythonConfig);
			expect(result.content).toContain("Python");
		});
	});

	describe("WindsurfAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the windsurf adapter |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "windsurf",
			projectName: "test-project",
			language: "rust",
			testCoverage: 85,
		};

		it("should have correct target identifier", () => {
			expect(windsurfAdapter.target).toBe("windsurf");
		});

		it("should have correct display name", () => {
			expect(windsurfAdapter.displayName).toBe("Windsurf (Codium)");
		});

		it("should use .md file extension", () => {
			expect(windsurfAdapter.agentFileExtension).toBe(".md");
		});

		it("should not support executor agents", () => {
			expect(windsurfAdapter.supportsExecutor).toBe(false);
		});

		it("should not support verifier agents", () => {
			expect(windsurfAdapter.supportsVerifier).toBe(false);
		});

		it("should generate agent file with .windsurf/rules.md path", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe(".windsurf/rules.md");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("Windsurf");
			expect(result.content).toContain("Rules");
		});

		it("should return null for executor agent", () => {
			const result = windsurfAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should return null for verifier agent", () => {
			const result = windsurfAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).toBeNull();
		});

		it("should include cascade reasoning guidance", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Cascade");
			expect(result.content).toContain("Reasoning");
		});

		it("should include development philosophy", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Philosophy");
			expect(result.content).toContain("Correctness");
		});

		it("should include language-specific code standards", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Rust");
			expect(result.content).toContain("Result");
		});

		it("should transform phase plan for clarity", () => {
			const plan = `## Phase 1: Setup

### Subtask 1.1.1
- [ ] Create directory
- [ ] Initialize`;
			const result = windsurfAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toContain("Phase 1");
			expect(typeof result).toBe("string");
		});

		it("should provide plan instructions", () => {
			const instructions = windsurfAdapter.getPlanInstructions();
			expect(instructions).toContain("Windsurf");
			expect(instructions).toContain("Cascade");
		});

		it("should include workflow rules", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Workflow");
			expect(result.content).toContain("Task Execution");
		});

		it("should include testing rules with coverage target", () => {
			const result = windsurfAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Testing");
			expect(result.content).toContain("85%");
		});
	});

	describe("GenericAdapter", () => {
		const testBrief = `# Project Brief: Test Project

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | test-project |
| **Project Type** | cli |
| **Goal** | Test the generic adapter |
| **Timeline** | 1 week |

## Target Users

- Developers

## Features

### Must-Have (MVP)

1. **Test Feature** - A test feature
`;

		const testConfig: AdapterConfig = {
			target: "generic",
			projectName: "test-project",
			language: "python",
			testCoverage: 75,
		};

		it("should have correct target identifier", () => {
			expect(genericAdapter.target).toBe("generic");
		});

		it("should have correct display name", () => {
			expect(genericAdapter.displayName).toBe("Generic (Model-Agnostic)");
		});

		it("should use .md file extension", () => {
			expect(genericAdapter.agentFileExtension).toBe(".md");
		});

		it("should support executor agents", () => {
			expect(genericAdapter.supportsExecutor).toBe(true);
		});

		it("should support verifier agents", () => {
			expect(genericAdapter.supportsVerifier).toBe(true);
		});

		it("should generate agent file with AGENTS.md path", () => {
			const result = genericAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.path).toBe("AGENTS.md");
			expect(result.isPrimary).toBe(true);
			expect(result.content).toContain("Agent Instructions");
		});

		it("should generate executor agent with EXECUTOR.md path", () => {
			const result = genericAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result).not.toBeNull();
			expect(result!.path).toBe("EXECUTOR.md");
			expect(result!.content).toContain("Executor");
		});

		it("should generate verifier agent with VERIFIER.md path", () => {
			const result = genericAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result).not.toBeNull();
			expect(result!.path).toBe("VERIFIER.md");
			expect(result!.content).toContain("Verifier");
		});

		it("should include project overview in AGENTS.md", () => {
			const result = genericAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Project Overview");
			expect(result.content).toContain("test-project");
		});

		it("should include development workflow in AGENTS.md", () => {
			const result = genericAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Development Workflow");
			expect(result.content).toContain("Subtask");
		});

		it("should include code standards for python", () => {
			const result = genericAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Python");
			expect(result.content).toContain("PEP 8");
		});

		it("should include testing strategy with coverage target", () => {
			const result = genericAdapter.generateAgentFile(testBrief, testConfig);
			expect(result.content).toContain("Testing Strategy");
			expect(result.content).toContain("75%");
		});

		it("should return plan unchanged in transformPhasePlan", () => {
			const plan = "# Development Plan\n\nSome content";
			const result = genericAdapter.transformPhasePlan(plan, testConfig);
			expect(result).toBe(plan);
		});

		it("should provide plan instructions mentioning all three files", () => {
			const instructions = genericAdapter.getPlanInstructions();
			expect(instructions).toContain("Generic");
			expect(instructions).toContain("AGENTS.md");
			expect(instructions).toContain("EXECUTOR.md");
			expect(instructions).toContain("VERIFIER.md");
		});

		it("executor agent should include execution workflow", () => {
			const result = genericAdapter.generateExecutorAgent(testBrief, testConfig);
			expect(result!.content).toContain("Workflow");
			expect(result!.content).toContain("Preparation");
			expect(result!.content).toContain("Implementation");
		});

		it("verifier agent should include verification focus", () => {
			const result = genericAdapter.generateVerifierAgent(testBrief, testConfig);
			expect(result!.content).toContain("Focus");
			expect(result!.content).toContain("Quality");
			expect(result!.content).toContain("Checklist");
		});

		it("should handle different languages in code standards", () => {
			const rustConfig = { ...testConfig, language: "rust" };
			const result = genericAdapter.generateAgentFile(testBrief, rustConfig);
			expect(result.content).toContain("Rust");
		});
	});

	describe("Registry integration with Phase 8 adapters", () => {
		it("should return cline adapter for 'cline' target", () => {
			const adapter = getAdapter("cline");
			expect(adapter.target).toBe("cline");
			expect(adapter.displayName).toContain("Cline");
		});

		it("should return windsurf adapter for 'windsurf' target", () => {
			const adapter = getAdapter("windsurf");
			expect(adapter.target).toBe("windsurf");
			expect(adapter.displayName).toContain("Windsurf");
		});

		it("should return generic adapter for 'generic' target", () => {
			const adapter = getAdapter("generic");
			expect(adapter.target).toBe("generic");
			expect(adapter.displayName).toContain("Generic");
		});

		it("should have native adapters for all Phase 8 targets", () => {
			expect(hasNativeAdapter("cline")).toBe(true);
			expect(hasNativeAdapter("windsurf")).toBe(true);
			expect(hasNativeAdapter("generic")).toBe(true);
		});
	});
});
