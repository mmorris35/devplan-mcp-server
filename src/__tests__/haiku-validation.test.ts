import { describe, it, expect } from "vitest";
import { validateHaikuExecutable } from "../generators";

// ============================================
// Test Fixtures
// ============================================

const VALID_HAIKU_PLAN = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Create types (Single Session)**

**Prerequisites**:
- None (first subtask)

**Deliverables**:
- [ ] Create types file

**Complete Code**:

Create file \`src/types.ts\` with this exact content:
\`\`\`typescript
import { z } from "zod";

export interface MyType {
  id: string;
  name: string;
}

export const MySchema = z.object({
  id: z.string(),
  name: z.string(),
});
\`\`\`

**Success Criteria**:
- [ ] TypeScript compiles

---

**Subtask 0.1.2: Add tests (Single Session)**

**Prerequisites**:
- [x] 0.1.1: Create types

**Deliverables**:
- [ ] Create test file

**Complete Code**:

Create file \`src/__tests__/types.test.ts\` with this exact content:
\`\`\`typescript
import { describe, it, expect } from "vitest";
import { MySchema } from "../types";

const TEST_DATA = {
  id: "123",
  name: "Test",
};

describe("MySchema", () => {
  it("should validate correct data", () => {
    const result = MySchema.safeParse(TEST_DATA);
    expect(result.success).toBe(true);
  });
});
\`\`\`

**Success Criteria**:
- [ ] Tests pass
`;

const PLAN_WITH_ADD_TO = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Update types (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Update types file

**Complete Code**:

Add to \`src/types.ts\`:
\`\`\`typescript
export interface NewType {
  value: number;
}
\`\`\`

**Success Criteria**:
- [ ] TypeScript compiles
`;

const PLAN_WITH_MISSING_IMPORTS = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Create tests (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Create test file

**Complete Code**:

Create file \`src/__tests__/example.test.ts\`:
\`\`\`typescript
describe("example", () => {
  it("should work", () => {
    expect(true).toBe(true);
  });

  it("should also work", () => {
    const result = someFunction();
    expect(result).toBeDefined();
  });
});
\`\`\`

**Success Criteria**:
- [ ] Tests pass
`;

const PLAN_WITH_CROSS_SUBTASK_REF = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Create fixtures (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Create fixtures

**Complete Code**:

\`\`\`typescript
const SAMPLE_PLAN = "test plan content";
\`\`\`

---

**Subtask 0.1.2: Use fixtures (Single Session)**

**Prerequisites**:
- [x] 0.1.1: Create fixtures

**Deliverables**:
- [ ] Use the fixtures defined in 0.1.1

**Complete Code**:

\`\`\`typescript
import { describe, it, expect } from "vitest";

describe("test", () => {
  it("should use SAMPLE_PLAN from subtask 0.1.1", () => {
    expect(SAMPLE_PLAN).toBeDefined();
  });
});
\`\`\`

**Success Criteria**:
- [ ] Tests pass
`;

const PLAN_WITH_AMBIGUOUS_MOD = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Update index (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Add new tool

**Complete Code**:

Add this code to the init() method:
\`\`\`typescript
this.server.tool("new_tool", "description", {}, async () => {
  return { content: [{ type: "text", text: "done" }] };
});
\`\`\`

**Success Criteria**:
- [ ] Tool works
`;

const PLAN_WITH_PLACEHOLDERS = `# Test Project - Development Plan

## Phase 0: Foundation

### Task 0.1: Setup

**Subtask 0.1.1: Create module (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Create module

**Complete Code**:

Create file \`src/module.ts\`:
\`\`\`typescript
export function processData(input: string): string {
  // TODO: implement this
  return input;
}

export function helperFunction() {
  // ...
}
\`\`\`

**Success Criteria**:
- [ ] Module exists
`;

// ============================================
// Tests
// ============================================

describe("validateHaikuExecutable", () => {
	describe("valid plans", () => {
		it("should pass validation for a properly formatted plan", () => {
			const result = validateHaikuExecutable(VALID_HAIKU_PLAN);

			expect(result.isHaikuExecutable).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(result.stats.subtasksChecked).toBe(2);
		});
	});

	describe("Add to instruction detection", () => {
		it("should detect 'Add to' instructions without complete file content", () => {
			const result = validateHaikuExecutable(PLAN_WITH_ADD_TO);

			expect(result.isHaikuExecutable).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);

			const addToError = result.errors.find((e) => e.type === "add_to_instruction");
			expect(addToError).toBeDefined();
			expect(addToError?.subtaskId).toBe("0.1.1");
			expect(addToError?.fix).toContain("Replace");
		});
	});

	describe("Missing imports detection", () => {
		it("should detect test code without vitest imports", () => {
			const result = validateHaikuExecutable(PLAN_WITH_MISSING_IMPORTS);

			expect(result.isHaikuExecutable).toBe(false);

			const importError = result.errors.find((e) => e.type === "missing_imports");
			expect(importError).toBeDefined();
			expect(importError?.message).toContain("vitest");
			expect(importError?.fix).toContain("import");
		});
	});

	describe("Cross-subtask reference detection", () => {
		it("should detect references to fixtures from other subtasks", () => {
			const result = validateHaikuExecutable(PLAN_WITH_CROSS_SUBTASK_REF);

			expect(result.isHaikuExecutable).toBe(false);

			const refError = result.errors.find((e) => e.type === "cross_subtask_reference");
			expect(refError).toBeDefined();
			expect(refError?.subtaskId).toBe("0.1.2");
			expect(refError?.message).toContain("SAMPLE_PLAN");
		});
	});

	describe("Ambiguous modification detection", () => {
		it("should detect ambiguous file modification instructions", () => {
			const result = validateHaikuExecutable(PLAN_WITH_AMBIGUOUS_MOD);

			expect(result.isHaikuExecutable).toBe(false);

			const ambigError = result.errors.find((e) => e.type === "ambiguous_modification");
			expect(ambigError).toBeDefined();
			expect(ambigError?.message).toContain("init()");
		});
	});

	describe("Placeholder detection", () => {
		it("should detect placeholder code like TODO and ...", () => {
			const result = validateHaikuExecutable(PLAN_WITH_PLACEHOLDERS);

			expect(result.isHaikuExecutable).toBe(false);

			const placeholderErrors = result.errors.filter((e) => e.type === "incomplete_code");
			expect(placeholderErrors.length).toBeGreaterThan(0);
			expect(placeholderErrors.some((e) => e.message.includes("TODO"))).toBe(true);
		});
	});

	describe("Statistics", () => {
		it("should report correct statistics", () => {
			const result = validateHaikuExecutable(VALID_HAIKU_PLAN);

			expect(result.stats.subtasksChecked).toBe(2);
			expect(result.stats.codeBlocksChecked).toBeGreaterThan(0);
			expect(result.stats.issuesFound).toBe(0);
		});

		it("should count issues found", () => {
			const result = validateHaikuExecutable(PLAN_WITH_PLACEHOLDERS);

			expect(result.stats.issuesFound).toBeGreaterThan(0);
			expect(result.stats.issuesFound).toBe(result.errors.length);
		});
	});

	describe("Edge cases", () => {
		it("should handle empty plan", () => {
			const result = validateHaikuExecutable("");

			expect(result.isHaikuExecutable).toBe(true); // No errors, just warnings
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.stats.subtasksChecked).toBe(0);
		});

		it("should handle plan with no code blocks", () => {
			const planWithoutCode = `# Test Plan

## Phase 0: Research

### Task 0.1: Investigation

**Subtask 0.1.1: Research (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Document findings

**Success Criteria**:
- [ ] Report created
`;
			const result = validateHaikuExecutable(planWithoutCode);

			expect(result.isHaikuExecutable).toBe(true);
			expect(result.warnings.some((w) => w.includes("No TypeScript"))).toBe(true);
		});
	});
});
