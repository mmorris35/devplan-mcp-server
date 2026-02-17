import { describe, it, expect } from "vitest";
import {
	generateWorktreeSetupScript,
	generateWorktreeAgentInstructions,
	generateMultiAgentClaudeMdSection,
	DEFAULT_WORKTREE_CONFIG,
} from "../worktree";

const SAMPLE_BRIEF = `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: my-api
- **Project Type**: api
- **Primary Goal**: Build a REST API
- **Target Users**: Developers
- **Timeline**: 2 weeks
- **Team Size**: 1

## Functional Requirements

### Key Features (MVP)

- User authentication
- CRUD endpoints

### Nice-to-Have Features (v2)

- WebSocket support

## Technical Constraints

### Must Use

- TypeScript
- Express
- PostgreSQL

### Cannot Use

- (none specified)

## Success Criteria

- All endpoints working
`;

describe("worktree", () => {
	describe("generateWorktreeSetupScript", () => {
		it("generates a bash script with project name", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF);
			expect(result.filePath).toBe("scripts/setup-worktrees.sh");
			expect(result.content).toContain("#!/usr/bin/env bash");
			expect(result.content).toContain("my-api");
		});

		it("includes setup, teardown, and status commands", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF);
			expect(result.content).toContain("cmd_setup");
			expect(result.content).toContain("cmd_teardown");
			expect(result.content).toContain("cmd_status");
		});

		it("respects custom config", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF, {
				maxParallel: 5,
				basePort: 8000,
				portStride: 100,
			});
			expect(result.content).toContain("MAX_PARALLEL=5");
			expect(result.content).toContain("BASE_PORT=8000");
			expect(result.content).toContain("PORT_STRIDE=100");
		});

		it("includes npm install for TypeScript projects", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF);
			expect(result.content).toContain("npm install");
		});

		it("includes lock helpers", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF);
			expect(result.content).toContain("acquire_lock");
			expect(result.content).toContain("release_lock");
		});

		it("generates .env.agent for each worktree", () => {
			const result = generateWorktreeSetupScript(SAMPLE_BRIEF);
			expect(result.content).toContain("AGENT_ID=executor-");
			expect(result.content).toContain("AGENT_PORT=");
			expect(result.content).toContain("AGENT_WORKTREE=true");
		});
	});

	describe("generateWorktreeAgentInstructions", () => {
		it("includes environment detection", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF);
			expect(instructions).toContain(".env.agent");
			expect(instructions).toContain("AGENT_PORT");
		});

		it("includes port isolation guidance", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF);
			expect(instructions).toContain("Port Isolation");
			expect(instructions).toContain("address already in use");
		});

		it("includes branch discipline", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF);
			expect(instructions).toContain("wt/executor-N");
			expect(instructions).toContain("DO NOT");
		});

		it("includes shared resource locking", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF);
			expect(instructions).toContain("acquire_lock");
			expect(instructions).toContain("database-migration");
		});

		it("includes database isolation when enabled", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF, {
				isolateDatabase: true,
			});
			expect(instructions).toContain("AGENT_DB_SUFFIX");
		});

		it("uses locking when database isolation disabled", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF, {
				isolateDatabase: false,
			});
			expect(instructions).toContain("locking for migration ordering");
		});

		it("lists files that must not be modified in worktrees", () => {
			const instructions = generateWorktreeAgentInstructions(SAMPLE_BRIEF);
			expect(instructions).toContain("package-lock.json");
			expect(instructions).toContain("Cargo.lock");
		});
	});

	describe("generateMultiAgentClaudeMdSection", () => {
		it("includes architecture diagram", () => {
			const section = generateMultiAgentClaudeMdSection(SAMPLE_BRIEF);
			expect(section).toContain("executor-0");
			expect(section).toContain("executor-1");
			expect(section).toContain("executor-2");
		});

		it("includes launch commands", () => {
			const section = generateMultiAgentClaudeMdSection(SAMPLE_BRIEF);
			expect(section).toContain("claude");
			expect(section).toContain("execute subtask");
		});

		it("includes merge strategy", () => {
			const section = generateMultiAgentClaudeMdSection(SAMPLE_BRIEF);
			expect(section).toContain("--squash");
			expect(section).toContain("wt/executor-0");
		});

		it("documents edge cases", () => {
			const section = generateMultiAgentClaudeMdSection(SAMPLE_BRIEF);
			expect(section).toContain("Port conflicts");
			expect(section).toContain("Lock file conflicts");
			expect(section).toContain("DB migration ordering");
		});

		it("respects custom port config", () => {
			const section = generateMultiAgentClaudeMdSection(SAMPLE_BRIEF, {
				basePort: 8080,
				portStride: 100,
			});
			expect(section).toContain("8080");
			expect(section).toContain("8180"); // 8080 + 100
		});
	});

	describe("DEFAULT_WORKTREE_CONFIG", () => {
		it("has sensible defaults", () => {
			expect(DEFAULT_WORKTREE_CONFIG.maxParallel).toBe(3);
			expect(DEFAULT_WORKTREE_CONFIG.basePort).toBe(3000);
			expect(DEFAULT_WORKTREE_CONFIG.portStride).toBe(10);
			expect(DEFAULT_WORKTREE_CONFIG.isolateDatabase).toBe(true);
			expect(DEFAULT_WORKTREE_CONFIG.lockStrategy).toBe("advisory");
		});
	});
});
