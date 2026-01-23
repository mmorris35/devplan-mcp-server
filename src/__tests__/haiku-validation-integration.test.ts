import { describe, it, expect } from "vitest";
import { validateHaikuExecutable } from "../generators";

// ============================================
// Integration Test Fixtures
// ============================================

const REAL_WORLD_VALID_PLAN = `# My Feature - Development Plan

## How to Use This Plan

**For Claude Code**: Read this plan, find the subtask ID, complete ALL checkboxes.

---

## Progress Tracking

### Phase 0: Setup
- [ ] 0.1.1: Create module

**Current**: Phase 0
**Next**: 0.1.1

---

## Phase 0: Setup

**Goal**: Initialize the feature
**Duration**: 1 day

### Task 0.1: Module Creation

**Git**: Create branch \`feature/0-1-setup\`

**Subtask 0.1.1: Create module (Single Session)**

**Prerequisites**:
- None (first subtask)

**Deliverables**:
- [ ] Create the module file
- [ ] Add exports
- [ ] Verify compilation

**Complete Code**:

Create file \`src/my-module.ts\` with this exact content:
\`\`\`typescript
/**
 * My module description.
 */

import { z } from "zod";

export interface ModuleConfig {
	enabled: boolean;
	threshold: number;
}

export const ConfigSchema = z.object({
	enabled: z.boolean(),
	threshold: z.number().min(0).max(100),
});

export function processConfig(config: ModuleConfig): boolean {
	if (!config.enabled) {
		return false;
	}
	return config.threshold > 50;
}

export function validateConfig(input: unknown): ModuleConfig | null {
	const result = ConfigSchema.safeParse(input);
	if (result.success) {
		return result.data;
	}
	return null;
}
\`\`\`

**Success Criteria**:
- [ ] \`npx tsc --noEmit\` passes
- [ ] File exists at \`src/my-module.ts\`

**Verification**:
\`\`\`bash
npx tsc --noEmit
# Expected: No output (success)
\`\`\`

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: src/my-module.ts
- **Files Modified**: None
- **Tests**: N/A
- **Build**: tsc: pass/fail
- **Branch**: feature/0-1-setup
- **Notes**: (any additional context)
`;

const REAL_WORLD_INVALID_PLAN = `# My Feature - Development Plan

## Phase 0: Setup

### Task 0.1: Module Creation

**Subtask 0.1.1: Create module (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Update the module

**Complete Code**:

Add the following to \`src/existing.ts\`:
\`\`\`typescript
export function newFunction() {
	// TODO: implement
	return null;
}
\`\`\`

Then add to the init() method:
\`\`\`typescript
this.registerFunction(newFunction);
\`\`\`

**Success Criteria**:
- [ ] Works
`;

// ============================================
// Integration Tests
// ============================================

describe("Haiku validation integration", () => {
	it("should validate a real-world compliant plan", () => {
		const result = validateHaikuExecutable(REAL_WORLD_VALID_PLAN);

		expect(result.isHaikuExecutable).toBe(true);
		expect(result.errors).toHaveLength(0);
		expect(result.stats.subtasksChecked).toBeGreaterThan(0);
		expect(result.stats.codeBlocksChecked).toBeGreaterThan(0);
	});

	it("should catch multiple issues in a real-world non-compliant plan", () => {
		const result = validateHaikuExecutable(REAL_WORLD_INVALID_PLAN);

		expect(result.isHaikuExecutable).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);

		// Should catch "Add to" instruction
		const addToError = result.errors.find((e) => e.type === "add_to_instruction");
		expect(addToError).toBeDefined();

		// Should catch TODO placeholder
		const placeholderError = result.errors.find((e) => e.type === "incomplete_code");
		expect(placeholderError).toBeDefined();

		// Should catch ambiguous "add to init()" instruction
		const ambiguousError = result.errors.find((e) => e.type === "ambiguous_modification");
		expect(ambiguousError).toBeDefined();
	});

	it("should provide actionable fix instructions", () => {
		const result = validateHaikuExecutable(REAL_WORLD_INVALID_PLAN);

		for (const error of result.errors) {
			// Every error should have a non-empty fix
			expect(error.fix).toBeTruthy();
			expect(error.fix.length).toBeGreaterThan(10);

			// Fix should be actionable (contain action words)
			const hasActionWord =
				error.fix.includes("Replace") ||
				error.fix.includes("Add") ||
				error.fix.includes("Include") ||
				error.fix.includes("Show") ||
				error.fix.includes("Provide");
			expect(hasActionWord).toBe(true);
		}
	});

	it("should identify the correct subtask for each error", () => {
		const result = validateHaikuExecutable(REAL_WORLD_INVALID_PLAN);

		for (const error of result.errors) {
			// Every error should have a valid subtask ID
			expect(error.subtaskId).toMatch(/^\d+\.\d+\.\d+$/);
		}
	});

	it("should handle a plan with mixed valid and invalid subtasks", () => {
		const mixedPlan = `# Mixed Plan - Development Plan

## Phase 0: Setup

### Task 0.1: Setup

**Subtask 0.1.1: Valid subtask (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Create file

**Complete Code**:

Create file \`src/valid.ts\` with this exact content:
\`\`\`typescript
import { z } from "zod";

export const schema = z.string();
\`\`\`

---

**Subtask 0.1.2: Invalid subtask (Single Session)**

**Prerequisites**:
- [x] 0.1.1: Valid subtask

**Deliverables**:
- [ ] Update file

**Complete Code**:

Add to \`src/valid.ts\`:
\`\`\`typescript
// TODO: add more
\`\`\`
`;

		const result = validateHaikuExecutable(mixedPlan);

		expect(result.isHaikuExecutable).toBe(false);
		expect(result.stats.subtasksChecked).toBe(2);

		// Errors should only be for subtask 0.1.2
		const errorSubtasks = new Set(result.errors.map((e) => e.subtaskId));
		expect(errorSubtasks.has("0.1.2")).toBe(true);
		expect(errorSubtasks.has("0.1.1")).toBe(false);
	});
});
