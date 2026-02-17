import { describe, it, expect } from "vitest";
import {
	generateWorktreeSetupScript,
	generateWorktreeAgentInstructions,
	generateMultiAgentClaudeMdSection,
	DEFAULT_WORKTREE_CONFIG,
} from "../worktree";
import {
	getGitInstructions,
	generatePlan,
	generateExecutorAgent,
	parseBrief,
} from "../generators";

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

// ---------------------------------------------------------------------------
// Integration tests: gitWorkflow option in generators
// ---------------------------------------------------------------------------

describe("getGitInstructions", () => {
	describe("branch mode (default)", () => {
		const git = getGitInstructions("branch");

		it("generates branch-based task header", () => {
			const header = git.taskHeader("1.1", "1-1-core-module");
			expect(header).toContain("Create branch");
			expect(header).toContain("feature/1-1-core-module");
		});

		it("generates branch location ref", () => {
			expect(git.locationRef("1.1", "1-1-core")).toBe("feature/1-1-core");
		});

		it("generates squash merge checklist", () => {
			const checklist = git.mergeChecklist("1.1", "1-1-core-module");
			expect(checklist).toContain("Squash Merge");
			expect(checklist).toContain("git merge --squash");
			expect(checklist).toContain("git branch -d");
		});

		it("generates branch conventions section", () => {
			const section = git.conventionsSection("my-project");
			expect(section).toContain("ONE branch per TASK");
			expect(section).toContain("git checkout -b");
		});
	});

	describe("worktree mode", () => {
		const git = getGitInstructions("worktree");

		it("generates worktree-based task header", () => {
			const header = git.taskHeader("1.1", "1-1-core-module");
			expect(header).toContain("worktree");
			expect(header).toContain("1-1-core-module");
			expect(header).not.toContain("Create branch");
		});

		it("generates worktree location ref", () => {
			const ref = git.locationRef("1.1", "1-1-core");
			expect(ref).toContain("task/1-1-core");
			expect(ref).toContain("worktree");
		});

		it("generates worktree merge checklist", () => {
			const checklist = git.mergeChecklist("1.1", "1-1-core-module");
			expect(checklist).toContain("Merge from Worktree");
			expect(checklist).toContain("git worktree remove");
			expect(checklist).toContain("Rebase any dependent worktrees");
		});

		it("generates worktree conventions section", () => {
			const section = git.conventionsSection("my-project");
			expect(section).toContain("Worktree Mode");
			expect(section).toContain("git worktree add");
			expect(section).toContain("Conflict zones");
			expect(section).toContain("Parallel execution");
			expect(section).not.toContain("git checkout -b");
		});

		it("generates worktree executor workflow", () => {
			const workflow = git.executorWorkflow("my-project");
			expect(workflow).toContain("worktree");
			expect(workflow).toContain("DO NOT");
		});
	});
});

describe("gitWorkflow in parseBrief", () => {
	it("defaults to branch when not specified", () => {
		const brief = parseBrief(SAMPLE_BRIEF);
		expect(brief.gitWorkflow).toBe("branch");
	});

	it("parses worktree workflow from brief", () => {
		const briefWithWorktree = SAMPLE_BRIEF.replace(
			"- **Team Size**: 1",
			"- **Team Size**: 1\n- **Git Workflow**: worktree"
		);
		const brief = parseBrief(briefWithWorktree);
		expect(brief.gitWorkflow).toBe("worktree");
	});
});

describe("generatePlan with worktree", () => {
	const WORKTREE_BRIEF = SAMPLE_BRIEF.replace(
		"- **Team Size**: 1",
		"- **Team Size**: 1\n- **Git Workflow**: worktree"
	);

	it("generates worktree-based git instructions in plan", () => {
		const plan = generatePlan(WORKTREE_BRIEF);
		// Should have worktree instructions, not branch
		expect(plan).toContain("worktree");
		expect(plan).toContain("Worktree Mode");
		expect(plan).toContain("git worktree add");
	});

	it("generates branch-based instructions by default", () => {
		const plan = generatePlan(SAMPLE_BRIEF);
		expect(plan).toContain("ONE branch per TASK");
		expect(plan).not.toContain("Worktree Mode");
	});

	it("includes conflict zone warnings in worktree mode", () => {
		const plan = generatePlan(WORKTREE_BRIEF);
		expect(plan).toContain("Conflict zones");
	});
});

describe("generateExecutorAgent with worktree", () => {
	const WORKTREE_BRIEF = SAMPLE_BRIEF.replace(
		"- **Team Size**: 1",
		"- **Team Size**: 1\n- **Git Workflow**: worktree"
	);

	it("appends worktree addendum when workflow is worktree", () => {
		const result = generateExecutorAgent(WORKTREE_BRIEF, "typescript");
		expect(result.content).toContain("WORKTREE MODE ACTIVE");
		expect(result.content).toContain("DO NOT");
		expect(result.content).toContain("git checkout");
	});

	it("does not append worktree addendum for branch mode", () => {
		const result = generateExecutorAgent(SAMPLE_BRIEF, "typescript");
		expect(result.content).not.toContain("WORKTREE MODE ACTIVE");
	});
});
