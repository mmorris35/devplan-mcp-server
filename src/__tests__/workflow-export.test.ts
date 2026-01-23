import { describe, it, expect } from "vitest";
import {
	parsePlanToStructure,
	generateNodes,
	generateEdges,
	applyLayout,
	exportWorkflow,
} from "../workflow-export";
import type { ParsedPlan } from "../workflow-types";

// ============================================
// Test Fixtures - Sample Plan Content
// ============================================

const SAMPLE_PLAN = `# Test Project - Development Plan

## Project Overview

**Project Name**: test-project
**Goal**: Test the plan parser
**Timeline**: 1 week

## Progress Tracking

### Phase 0: Foundation
- [x] 0.1.1: Create types
- [ ] 0.1.2: Create parser

### Phase 1: Implementation
- [ ] 1.1.1: Core feature

**Current**: Phase 0
**Next**: 0.1.2

---

## Phase 0: Foundation

**Goal**: Set up project structure
**Duration**: 1 day

### Task 0.1: Setup

**Git**: Create branch \`feature/0-1-setup\`

**Subtask 0.1.1: Create types (Single Session)**

**Prerequisites**:
- None (first subtask)

**Deliverables**:
- [x] Create types file
- [x] Export interfaces

**Success Criteria**:
- [x] TypeScript compiles

---

**Subtask 0.1.2: Create parser (Single Session)**

**Prerequisites**:
- [x] 0.1.1: Create types

**Deliverables**:
- [ ] Create parser function
- [ ] Add error handling

**Success Criteria**:
- [ ] Parser works correctly

---

## Phase 1: Implementation

**Goal**: Build core features
**Duration**: 2 days

### Task 1.1: Core Feature

**Git**: Create branch \`feature/1-1-core\`

**Subtask 1.1.1: Core feature (Single Session)**

**Prerequisites**:
- [x] 0.1.2: Create parser

**Deliverables**:
- [ ] Implement feature

**Success Criteria**:
- [ ] Feature works
`;

// ============================================
// Sample Parsed Plan for Node/Edge Tests
// ============================================

const SAMPLE_PARSED_PLAN: ParsedPlan = {
	projectName: "Test Project",
	goal: "Test workflow generation",
	phases: [
		{
			number: 0,
			title: "Foundation",
			goal: "Set up project",
			duration: "1 day",
			tasks: [
				{
					id: "0.1",
					title: "Setup",
					gitBranch: "feature/0-1-setup",
					subtasks: [
						{
							id: "0.1.1",
							title: "Create types",
							description: "Create type definitions",
							completed: true,
							prerequisites: [],
							deliverables: ["Create types file"],
							successCriteria: ["TypeScript compiles"],
						},
						{
							id: "0.1.2",
							title: "Create parser",
							description: "Create parser function",
							completed: false,
							prerequisites: ["0.1.1"],
							deliverables: ["Create parser"],
							successCriteria: ["Parser works"],
						},
					],
				},
			],
		},
		{
			number: 1,
			title: "Implementation",
			goal: "Build features",
			tasks: [
				{
					id: "1.1",
					title: "Core",
					subtasks: [
						{
							id: "1.1.1",
							title: "Feature",
							description: "Implement feature",
							completed: false,
							prerequisites: ["0.1.2"],
							deliverables: ["Implement"],
							successCriteria: ["Works"],
						},
					],
				},
			],
		},
	],
	currentPhase: 0,
	nextSubtask: "0.1.2",
};

// ============================================
// Parser Tests
// ============================================

describe("workflow-export", () => {
	describe("parsePlanToStructure", () => {
		it("should parse project name and goal", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			expect(result.success).toBe(true);
			expect(result.plan?.projectName).toBe("Test Project");
			expect(result.plan?.goal).toBe("Test the plan parser");
		});

		it("should parse current phase and next subtask", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			expect(result.plan?.currentPhase).toBe(0);
			expect(result.plan?.nextSubtask).toBe("0.1.2");
		});

		it("should parse all phases", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			expect(result.plan?.phases).toHaveLength(2);
			expect(result.plan?.phases[0].number).toBe(0);
			expect(result.plan?.phases[0].title).toBe("Foundation");
			expect(result.plan?.phases[1].number).toBe(1);
			expect(result.plan?.phases[1].title).toBe("Implementation");
		});

		it("should parse phase goals and durations", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			expect(result.plan?.phases[0].goal).toBe("Set up project structure");
			expect(result.plan?.phases[0].duration).toBe("1 day");
		});

		it("should parse tasks within phases", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			const phase0 = result.plan?.phases[0];
			expect(phase0?.tasks).toHaveLength(1);
			expect(phase0?.tasks[0].id).toBe("0.1");
			expect(phase0?.tasks[0].title).toBe("Setup");
			expect(phase0?.tasks[0].gitBranch).toBe("feature/0-1-setup");
		});

		it("should parse subtasks within tasks", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			const task = result.plan?.phases[0].tasks[0];
			expect(task?.subtasks).toHaveLength(2);
			expect(task?.subtasks[0].id).toBe("0.1.1");
			expect(task?.subtasks[0].title).toBe("Create types (Single Session)");
			expect(task?.subtasks[1].id).toBe("0.1.2");
		});

		it("should detect completion status from checkboxes", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			const subtasks = result.plan?.phases[0].tasks[0].subtasks;
			expect(subtasks?.[0].completed).toBe(true);
			expect(subtasks?.[1].completed).toBe(false);
		});

		it("should parse prerequisites", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			const subtask = result.plan?.phases[0].tasks[0].subtasks[1];
			expect(subtask?.prerequisites).toContain("0.1.1");
		});

		it("should parse deliverables", () => {
			const result = parsePlanToStructure(SAMPLE_PLAN);

			const subtask = result.plan?.phases[0].tasks[0].subtasks[0];
			expect(subtask?.deliverables).toContain("Create types file");
			expect(subtask?.deliverables).toContain("Export interfaces");
		});

		it("should return error for empty content", () => {
			const result = parsePlanToStructure("");

			expect(result.success).toBe(false);
			expect(result.error).toContain("No phases found");
		});

		it("should return error for content without phases", () => {
			const result = parsePlanToStructure("# Some Heading\n\nSome content");

			expect(result.success).toBe(false);
			expect(result.error).toContain("No phases found");
		});
	});

	// ============================================
	// Node Generation Tests
	// ============================================

	describe("generateNodes", () => {
		it("should create nodes for all phases", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);

			const phaseNodes = nodes.filter((n) => n.type === "phase");
			expect(phaseNodes).toHaveLength(2);
			expect(phaseNodes[0].id).toBe("phase-0");
			expect(phaseNodes[1].id).toBe("phase-1");
		});

		it("should create nodes for all tasks", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);

			const taskNodes = nodes.filter((n) => n.type === "task");
			expect(taskNodes).toHaveLength(2);
			expect(taskNodes[0].id).toBe("task-0.1");
			expect(taskNodes[1].id).toBe("task-1.1");
		});

		it("should create nodes for all subtasks", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);

			const subtaskNodes = nodes.filter((n) => n.type === "subtask");
			expect(subtaskNodes).toHaveLength(3);
			expect(subtaskNodes.map((n) => n.id)).toContain("subtask-0.1.1");
			expect(subtaskNodes.map((n) => n.id)).toContain("subtask-0.1.2");
			expect(subtaskNodes.map((n) => n.id)).toContain("subtask-1.1.1");
		});

		it("should set correct status for completed subtasks", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);

			const subtask011 = nodes.find((n) => n.id === "subtask-0.1.1");
			expect(subtask011?.data.status).toBe("completed");

			const subtask012 = nodes.find((n) => n.id === "subtask-0.1.2");
			expect(subtask012?.data.status).toBe("pending");
		});

		it("should calculate phase status from subtasks", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);

			const phase0 = nodes.find((n) => n.id === "phase-0");
			expect(phase0?.data.status).toBe("in_progress");

			const phase1 = nodes.find((n) => n.id === "phase-1");
			expect(phase1?.data.status).toBe("pending");
		});

		it("should filter completed subtasks when option is set", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN, { includeCompleted: false });

			const subtaskNodes = nodes.filter((n) => n.type === "subtask");
			expect(subtaskNodes).toHaveLength(2);
			expect(subtaskNodes.map((n) => n.id)).not.toContain("subtask-0.1.1");
		});

		it("should include success criteria when option is set", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN, { includeSuccessCriteria: true });

			const subtask = nodes.find((n) => n.id === "subtask-0.1.1");
			expect(subtask?.data.successCriteria).toContain("TypeScript compiles");
		});
	});

	// ============================================
	// Edge Generation Tests
	// ============================================

	describe("generateEdges", () => {
		it("should create dependency edges from prerequisites", () => {
			const edges = generateEdges(SAMPLE_PARSED_PLAN);

			const edge012 = edges.find((e) => e.id === "edge-0.1.1-to-0.1.2");
			expect(edge012).toBeDefined();
			expect(edge012?.source).toBe("subtask-0.1.1");
			expect(edge012?.target).toBe("subtask-0.1.2");

			const edge111 = edges.find((e) => e.id === "edge-0.1.2-to-1.1.1");
			expect(edge111).toBeDefined();
		});

		it("should create phase-to-phase edges", () => {
			const edges = generateEdges(SAMPLE_PARSED_PLAN);

			const phaseEdge = edges.find((e) => e.id === "edge-phase-0-to-1");
			expect(phaseEdge).toBeDefined();
			expect(phaseEdge?.source).toBe("phase-0");
			expect(phaseEdge?.target).toBe("phase-1");
		});

		it("should animate edges for incomplete dependencies", () => {
			const edges = generateEdges(SAMPLE_PARSED_PLAN);

			const edge012 = edges.find((e) => e.id === "edge-0.1.1-to-0.1.2");
			expect(edge012?.animated).toBe(false);

			const edge111 = edges.find((e) => e.id === "edge-0.1.2-to-1.1.1");
			expect(edge111?.animated).toBe(true);
		});
	});

	// ============================================
	// Layout Tests
	// ============================================

	describe("applyLayout", () => {
		it("should position phase nodes at x=0", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);
			const edges = generateEdges(SAMPLE_PARSED_PLAN);
			const positioned = applyLayout(nodes, edges);

			const phases = positioned.filter((n) => n.type === "phase");
			for (const phase of phases) {
				expect(phase.position.x).toBe(0);
			}
		});

		it("should indent task nodes", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);
			const edges = generateEdges(SAMPLE_PARSED_PLAN);
			const positioned = applyLayout(nodes, edges);

			const tasks = positioned.filter((n) => n.type === "task");
			for (const task of tasks) {
				expect(task.position.x).toBeGreaterThan(0);
			}
		});

		it("should further indent subtask nodes", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);
			const edges = generateEdges(SAMPLE_PARSED_PLAN);
			const positioned = applyLayout(nodes, edges);

			const tasks = positioned.filter((n) => n.type === "task");
			const subtasks = positioned.filter((n) => n.type === "subtask");

			const taskX = tasks[0].position.x;
			for (const subtask of subtasks) {
				expect(subtask.position.x).toBeGreaterThan(taskX);
			}
		});

		it("should position nodes vertically in order", () => {
			const nodes = generateNodes(SAMPLE_PARSED_PLAN);
			const edges = generateEdges(SAMPLE_PARSED_PLAN);
			const positioned = applyLayout(nodes, edges);

			const phase0 = positioned.find((n) => n.id === "phase-0");
			const phase1 = positioned.find((n) => n.id === "phase-1");

			expect(phase1!.position.y).toBeGreaterThan(phase0!.position.y);
		});
	});

	// ============================================
	// Export Workflow Tests
	// ============================================

	describe("exportWorkflow", () => {
		it("should export valid workflow from plan content", () => {
			const result = exportWorkflow(SAMPLE_PLAN);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.workflow.nodes.length).toBeGreaterThan(0);
				expect(result.workflow.edges.length).toBeGreaterThan(0);
				expect(result.workflow.metadata.planName).toBe("Test Project");
			}
		});

		it("should include metadata", () => {
			const result = exportWorkflow(SAMPLE_PLAN);

			if (result.success) {
				expect(result.workflow.metadata.version).toBe("1.0.0");
				expect(result.workflow.metadata.platform).toBe("reactflow");
				expect(result.workflow.metadata.nodeCount).toBeGreaterThan(0);
				expect(result.workflow.metadata.edgeCount).toBeGreaterThan(0);
				expect(result.workflow.metadata.exportedAt).toBeDefined();
			}
		});

		it("should return error for invalid plan", () => {
			const result = exportWorkflow("invalid content");

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("No phases found");
			}
		});

		it("should respect platform option", () => {
			const result = exportWorkflow(SAMPLE_PLAN, { platform: "sim" });

			if (result.success) {
				expect(result.workflow.metadata.platform).toBe("sim");
			}
		});

		it("should include viewport settings", () => {
			const result = exportWorkflow(SAMPLE_PLAN);

			if (result.success) {
				expect(result.workflow.viewport).toBeDefined();
				expect(result.workflow.viewport?.zoom).toBe(1);
			}
		});

		it("should produce valid JSON", () => {
			const result = exportWorkflow(SAMPLE_PLAN);

			if (result.success) {
				const json = JSON.stringify(result.workflow);
				const parsed = JSON.parse(json);

				expect(parsed.nodes).toHaveLength(result.workflow.nodes.length);
				expect(parsed.edges).toHaveLength(result.workflow.edges.length);
			}
		});

		it("should position nodes with valid coordinates", () => {
			const result = exportWorkflow(SAMPLE_PLAN);

			if (result.success) {
				for (const node of result.workflow.nodes) {
					expect(typeof node.position.x).toBe("number");
					expect(typeof node.position.y).toBe("number");
					expect(node.position.x).toBeGreaterThanOrEqual(0);
					expect(node.position.y).toBeGreaterThanOrEqual(0);
				}
			}
		});
	});
});
