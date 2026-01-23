import { describe, it, expect } from "vitest";
import { exportWorkflow } from "../workflow-export";

// ============================================
// Integration Test Fixtures
// ============================================

const INTEGRATION_PLAN = `# Integration Test - Development Plan

## Project Overview

**Project Name**: integration-test
**Goal**: Test the export workflow integration
**Timeline**: 1 day

## Progress Tracking

### Phase 0: Setup
- [x] 0.1.1: First subtask
- [ ] 0.1.2: Second subtask

**Current**: Phase 0
**Next**: 0.1.2

---

## Phase 0: Setup

**Goal**: Set up the project
**Duration**: 1 day

### Task 0.1: Initial Setup

**Git**: Create branch \`feature/0-1-setup\`

**Subtask 0.1.1: First subtask (Single Session)**

**Prerequisites**:
- None (first subtask)

**Deliverables**:
- [x] Create first file

**Success Criteria**:
- [x] File exists

---

**Subtask 0.1.2: Second subtask (Single Session)**

**Prerequisites**:
- [x] 0.1.1: First subtask

**Deliverables**:
- [ ] Create second file

**Success Criteria**:
- [ ] File exists
`;

// ============================================
// Integration Tests
// ============================================

describe("workflow export integration", () => {
	it("should export a complete workflow with nodes and edges", () => {
		const result = exportWorkflow(INTEGRATION_PLAN);

		expect(result.success).toBe(true);
		if (!result.success) return;

		const { workflow } = result;

		// Verify structure
		expect(workflow.nodes).toBeDefined();
		expect(workflow.edges).toBeDefined();
		expect(workflow.metadata).toBeDefined();
		expect(workflow.viewport).toBeDefined();

		// Verify node types
		const nodeTypes = new Set(workflow.nodes.map((n) => n.type));
		expect(nodeTypes.has("phase")).toBe(true);
		expect(nodeTypes.has("task")).toBe(true);
		expect(nodeTypes.has("subtask")).toBe(true);

		// Verify metadata
		expect(workflow.metadata.planName).toBe("Integration Test");
		expect(workflow.metadata.nodeCount).toBe(workflow.nodes.length);
		expect(workflow.metadata.edgeCount).toBe(workflow.edges.length);
	});

	it("should create dependency edges from prerequisites", () => {
		const result = exportWorkflow(INTEGRATION_PLAN);

		if (!result.success) return;

		const dependencyEdge = result.workflow.edges.find(
			(e) => e.source === "subtask-0.1.1" && e.target === "subtask-0.1.2"
		);

		expect(dependencyEdge).toBeDefined();
	});

	it("should mark completed subtasks correctly", () => {
		const result = exportWorkflow(INTEGRATION_PLAN);

		if (!result.success) return;

		const subtask1 = result.workflow.nodes.find((n) => n.id === "subtask-0.1.1");
		const subtask2 = result.workflow.nodes.find((n) => n.id === "subtask-0.1.2");

		expect(subtask1?.data.status).toBe("completed");
		expect(subtask2?.data.status).toBe("pending");
	});

	it("should filter completed subtasks when option set", () => {
		const result = exportWorkflow(INTEGRATION_PLAN, { includeCompleted: false });

		if (!result.success) return;

		const subtaskIds = result.workflow.nodes
			.filter((n) => n.type === "subtask")
			.map((n) => n.id);

		expect(subtaskIds).not.toContain("subtask-0.1.1");
		expect(subtaskIds).toContain("subtask-0.1.2");
	});

	it("should set correct platform in metadata", () => {
		const result = exportWorkflow(INTEGRATION_PLAN, { platform: "sim" });

		if (!result.success) return;

		expect(result.workflow.metadata.platform).toBe("sim");
	});

	it("should produce valid JSON that can be serialized", () => {
		const result = exportWorkflow(INTEGRATION_PLAN);

		if (!result.success) return;

		// Verify it can be serialized and deserialized
		const json = JSON.stringify(result.workflow);
		const parsed = JSON.parse(json);

		expect(parsed.nodes).toHaveLength(result.workflow.nodes.length);
		expect(parsed.edges).toHaveLength(result.workflow.edges.length);
	});

	it("should position nodes with valid coordinates", () => {
		const result = exportWorkflow(INTEGRATION_PLAN);

		if (!result.success) return;

		for (const node of result.workflow.nodes) {
			expect(typeof node.position.x).toBe("number");
			expect(typeof node.position.y).toBe("number");
			expect(node.position.x).toBeGreaterThanOrEqual(0);
			expect(node.position.y).toBeGreaterThanOrEqual(0);
		}
	});

	it("should handle empty plan gracefully", () => {
		const result = exportWorkflow("");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeDefined();
		}
	});

	it("should handle plan without proper structure", () => {
		const result = exportWorkflow("# Just a heading\n\nNo phases here.");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain("No phases found");
		}
	});
});
