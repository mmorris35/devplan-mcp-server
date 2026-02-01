import { describe, it, expect } from "vitest";
import {
	getAdapter,
	hasNativeAdapter,
	listTargets,
	listNativeTargets,
	claudeAdapter,
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

	describe("getAdapter", () => {
		it("should return claude adapter by default", () => {
			const adapter = getAdapter();
			expect(adapter.target).toBe("claude");
		});

		it("should return claude adapter for 'claude' target", () => {
			const adapter = getAdapter("claude");
			expect(adapter.target).toBe("claude");
		});

		it("should fall back to claude for unimplemented targets", () => {
			const targets: AdapterTarget[] = ["cursor", "aider", "cline", "windsurf", "generic"];
			for (const target of targets) {
				const adapter = getAdapter(target);
				// Currently all fall back to claude
				expect(adapter).toBeDefined();
				expect(adapter.displayName).toBeDefined();
			}
		});
	});

	describe("hasNativeAdapter", () => {
		it("should return true for claude", () => {
			expect(hasNativeAdapter("claude")).toBe(true);
		});

		it("should return false for unimplemented adapters", () => {
			expect(hasNativeAdapter("cursor")).toBe(false);
			expect(hasNativeAdapter("aider")).toBe(false);
			expect(hasNativeAdapter("cline")).toBe(false);
			expect(hasNativeAdapter("windsurf")).toBe(false);
			expect(hasNativeAdapter("generic")).toBe(false);
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
		it("should return only claude initially", () => {
			const native = listNativeTargets();
			expect(native).toHaveLength(1);
			expect(native).toContain("claude");
		});
	});
});
