import { describe, it, expect } from "vitest";
import { parsePlanToStructure } from "../workflow-export";

// ============================================
// Test Fixtures - Sample Plan Content
// ============================================

const SAMPLE_PLAN = `# Test Project - Development Plan

## Project Overview

**Project Name**: test-project
**Goal**: Test the plan parser
**Timeline**: 1 week

## Progress Tracking

Phase 0: Foundation
- [x] 0.1.1: Create types
- [ ] 0.1.2: Create parser

Phase 1: Implementation
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
});
