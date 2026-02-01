# Contributing New DevPlan Adapters

This guide explains how to create and contribute a new adapter to DevPlan. Adapters allow DevPlan to generate agent files for additional AI tools and models beyond the built-in targets (Claude, Cursor, Aider, Cline, Windsurf, Generic).

## Architecture Overview

DevPlan uses an **adapter pattern** to support multiple output formats. Each adapter implements the `OutputAdapter` interface and transforms the DevPlan methodology into tool-specific formats.

### Core Files

```
src/adapters/
├── types.ts              # OutputAdapter interface (don't modify)
├── index.ts              # Adapter registry (register your adapter here)
├── claude.ts             # Reference implementation (study this)
├── cursor.ts             # Example: single-file format
├── aider.ts              # Example: YAML config format
├── cline.ts              # Example: directory structure
├── windsurf.ts           # Example: rules format
└── generic.ts            # Example: multi-file markdown
```

## Step-by-Step Guide

### Step 1: Understand the OutputAdapter Interface

Study the interface in `src/adapters/types.ts`:

```typescript
export interface OutputAdapter {
  readonly target: AdapterTarget;
  readonly displayName: string;
  readonly agentFileExtension: string;

  generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile;
  generateExecutorAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null;
  generateVerifierAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null;
  transformPhasePlan(planContent: string, config: AdapterConfig): string;
  getPlanInstructions(): string;
}
```

**Key Properties**:
- `target` - Identifier for your tool (e.g., `'myai'`)
- `displayName` - Human-readable name (e.g., `'MyAI Tool'`)
- `agentFileExtension` - File extension (e.g., `'.md'`, `'.json'`)

**Key Methods**:
- `generateAgentFile()` - **Required**: Generate main agent instructions
- `generateExecutorAgent()` - Return `null` if your tool doesn't support separate executor agents
- `generateVerifierAgent()` - Return `null` if your tool doesn't support separate verifier agents
- `transformPhasePlan()` - Return unchanged if no plan transformation needed
- `getPlanInstructions()` - Return tool-specific usage instructions

### Step 2: Create Your Adapter Class

Create `src/adapters/mytool.ts`:

```typescript
/**
 * MyAI adapter - generates configuration for MyAI tool.
 */

import type { OutputAdapter, AdapterConfig, GeneratedFile } from './types';

/**
 * Singleton instance of the MyAI adapter.
 */
export const mytoolAdapter: OutputAdapter = {
  target: 'mytool',
  displayName: 'MyAI Tool',
  agentFileExtension: '.md', // Adjust based on your tool's format

  generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
    const content = buildAgentInstructions(briefContent, config);
    return {
      path: 'MYAI_INSTRUCTIONS.md', // Adjust path for your tool
      content,
      isPrimary: true,
    };
  },

  generateExecutorAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
    // Return null if your tool doesn't support separate executor agents
    // Otherwise, generate executor-specific file:
    const content = buildExecutorInstructions(briefContent, config);
    return {
      path: '.myai/executor.md', // Your tool's executor location
      content,
    };
  },

  generateVerifierAgent(briefContent: string, config: AdapterConfig): GeneratedFile | null {
    // Return null if your tool doesn't support separate verifier agents
    // Otherwise, generate verifier-specific file:
    const content = buildVerifierInstructions(briefContent, config);
    return {
      path: '.myai/verifier.md', // Your tool's verifier location
      content,
    };
  },

  transformPhasePlan(planContent: string, config: AdapterConfig): string {
    // If your tool needs special plan formatting, transform here.
    // Otherwise, return planContent unchanged.
    return planContent; // or return customTransform(planContent);
  },

  getPlanInstructions(): string {
    return `**For MyAI Tool**:
Follow the DEVELOPMENT_PLAN.md phase by phase, updating MYAI_INSTRUCTIONS.md as you progress.

See [docs/adapters/mytool.md](/docs/adapters/mytool.md) for detailed instructions.`;
  },
};

// Helper functions
function buildAgentInstructions(briefContent: string, config: AdapterConfig): string {
  return `# MyAI Instructions for ${config.projectName}

## Context
${briefContent}

## Methodology
Use the DevPlan methodology...

## Workflow
Follow DEVELOPMENT_PLAN.md step by step.

## Progress
Update this file as you complete phases.
`;
}

function buildExecutorInstructions(briefContent: string, config: AdapterConfig): string {
  return `# ${config.projectName} - Executor Instructions

Execute each subtask from DEVELOPMENT_PLAN.md...
`;
}

function buildVerifierInstructions(briefContent: string, config: AdapterConfig): string {
  return `# ${config.projectName} - Verifier Instructions

Verify each phase...
`;
}
```

### Step 3: Register Your Adapter

Update `src/adapters/index.ts`:

1. Add import:
```typescript
import { mytoolAdapter } from './mytool';
```

2. Add to ADAPTERS registry:
```typescript
const ADAPTERS: Record<AdapterTarget, OutputAdapter> = {
  claude: claudeAdapter,
  cursor: cursorAdapter,
  aider: aiderAdapter,
  cline: clineAdapter,
  windsurf: windsurfAdapter,
  generic: genericAdapter,
  mytool: mytoolAdapter,  // Add here
};
```

3. Add to NATIVE_ADAPTERS set:
```typescript
const NATIVE_ADAPTERS = new Set<AdapterTarget>([
  "claude", "cursor", "aider", "cline", "windsurf", "generic",
  "mytool"  // Add here
]);
```

4. Re-export your adapter:
```typescript
export { mytoolAdapter } from './mytool';
```

### Step 4: Update the AdapterTarget Type

Update `src/adapters/types.ts`:

```typescript
export type AdapterTarget =
  | 'claude'
  | 'cursor'
  | 'aider'
  | 'cline'
  | 'windsurf'
  | 'generic'
  | 'mytool';  // Add your target
```

### Step 5: Write Tests

Create `src/__tests__/adapters/mytool.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mytoolAdapter } from '../../adapters/mytool';
import type { AdapterConfig } from '../../adapters/types';

describe('MyToolAdapter', () => {
  const testBrief = `A CLI tool for managing configuration.`;
  const testConfig: AdapterConfig = {
    target: 'mytool',
    projectName: 'my-config-tool',
    language: 'typescript',
  };

  it('should have correct target and displayName', () => {
    expect(mytoolAdapter.target).toBe('mytool');
    expect(mytoolAdapter.displayName).toBe('MyAI Tool');
  });

  it('should generate agent file with correct path', () => {
    const file = mytoolAdapter.generateAgentFile(testBrief, testConfig);
    expect(file.path).toBe('MYAI_INSTRUCTIONS.md');
    expect(file.isPrimary).toBe(true);
    expect(file.content).toContain('my-config-tool');
  });

  it('should include brief content in generated file', () => {
    const file = mytoolAdapter.generateAgentFile(testBrief, testConfig);
    expect(file.content).toContain('CLI tool');
  });

  it('should return executor agent if supported', () => {
    const executor = mytoolAdapter.generateExecutorAgent(testBrief, testConfig);

    if (executor !== null) {
      expect(executor.path).toContain('executor');
      expect(executor.content).toBeTruthy();
    }
  });

  it('should return verifier agent if supported', () => {
    const verifier = mytoolAdapter.generateVerifierAgent(testBrief, testConfig);

    if (verifier !== null) {
      expect(verifier.path).toContain('verifier');
      expect(verifier.content).toBeTruthy();
    }
  });

  it('should transform plan if needed', () => {
    const testPlan = `## Phase 1\n\nSome content`;
    const transformed = mytoolAdapter.transformPhasePlan(testPlan, testConfig);
    expect(transformed).toBeTruthy();
  });

  it('should return plan instructions', () => {
    const instructions = mytoolAdapter.getPlanInstructions();
    expect(instructions).toContain('MyAI');
  });
});
```

### Step 6: Create Adapter Documentation

Create `docs/adapters/mytool.md`:

```markdown
# MyAI Adapter Documentation

## Overview

The MyAI adapter generates configuration files for the MyAI tool.

## Generated Files

| File | Purpose |
|------|---------|
| `MYAI_INSTRUCTIONS.md` | Main agent instructions |
| `.myai/executor.md` (optional) | Executor guidance |
| `.myai/verifier.md` (optional) | Verifier guidance |

## File Format

MyAI uses markdown format for instructions.

## Integration with DevPlan

The adapter transforms DEVELOPMENT_PLAN.md into MyAI-compatible format:
- Phase structure becomes section headings
- Subtasks become ordered task lists
- Deliverables become concrete action items

## Executor/Verifier Support

- **Executor**: Yes/No (specify which)
- **Verifier**: Yes/No (specify which)

If your tool doesn't support separate agents, implementation guidance is included in the main file.

## Usage Example

```
Use devplan_generate_plan with target='mytool'
Then use devplan_generate_claude_md with target='mytool'
```

## Tool-Specific Features

Explain any special features or limitations of MyAI integration.

## References

- [MyAI Official Docs](#)
- [DevPlan Adapter Comparison](/docs/ADAPTERS.md)
```

### Step 7: Run Tests

```bash
# Run all adapter tests
npx vitest run src/__tests__/adapters.test.ts

# Run your specific adapter tests
npx vitest run src/__tests__/adapters/mytool.test.ts

# Type check
npx tsc --noEmit
```

### Step 8: Update README

Add your adapter to the supported targets table in README.md:

```markdown
| `mytool` | MyAI Tool | `MYAI_INSTRUCTIONS.md` | MyAI IDE or CLI | ✅ Native |
```

### Step 9: Submit Pull Request

1. Fork the repository
2. Create a branch: `feature/adapter-mytool`
3. Commit your changes with descriptive messages:
   ```bash
   git commit -m "feat(adapters): add MyAI tool adapter"
   git commit -m "test(adapters): add tests for MyAI adapter"
   git commit -m "docs(adapters): add MyAI adapter documentation"
   ```
4. Push to your fork
5. Open a pull request with:
   - Description of the target tool
   - Links to tool documentation
   - Examples of generated output
   - Test coverage details

## Best Practices

### 1. Study Existing Adapters

Before writing your own, study existing adapters:
- **Claude** - Reference implementation with full features
- **Cursor** - Single-file rules format
- **Aider** - YAML configuration
- **Generic** - Multi-file markdown

### 2. Use Consistent Naming

- Adapter file: `src/adapters/mytool.ts`
- Export name: `mytoolAdapter`
- Test file: `src/__tests__/adapters/mytool.test.ts`
- Doc file: `docs/adapters/mytool.md`

### 3. Follow DevPlan Methodology

Adapters should preserve the DevPlan methodology:
- Phases with numbered subtasks
- Deliverables with checkboxes
- Success criteria
- Completion notes section
- Executor and verifier roles (if tool supports)

### 4. Handle Missing Features Gracefully

If your tool doesn't support something, return `null`:
```typescript
generateExecutorAgent(): GeneratedFile | null {
  // Tool doesn't have separate executor concept
  return null;
}
```

Include that guidance in the main file instead.

### 5. Test Edge Cases

Test with:
- Projects with special characters in names
- Long project descriptions
- Multiple phases
- Complex tech stacks

### 6. Document Tool Requirements

In your adapter docs, explain:
- Where to install the tool
- How to set up configuration
- Any prerequisites or dependencies
- Limitations or workarounds

## Example: Adding Support for "CodeAssistant"

Here's a complete example of adding a new adapter:

### File: `src/adapters/codeassistant.ts`

```typescript
import type { OutputAdapter, AdapterConfig, GeneratedFile } from './types';

export const codeassistantAdapter: OutputAdapter = {
  target: 'codeassistant',
  displayName: 'CodeAssistant',
  agentFileExtension: '.yaml',

  generateAgentFile(briefContent: string, config: AdapterConfig): GeneratedFile {
    return {
      path: '.codeassistant/config.yaml',
      content: `project: ${config.projectName}\nlanguage: ${config.language}\n\ninstructions: |\n  ${briefContent}`,
      isPrimary: true,
    };
  },

  generateExecutorAgent(): GeneratedFile | null {
    return null; // CodeAssistant uses single config file
  },

  generateVerifierAgent(): GeneratedFile | null {
    return null; // CodeAssistant uses single config file
  },

  transformPhasePlan(planContent: string): string {
    return planContent; // No transformation needed
  },

  getPlanInstructions(): string {
    return `**For CodeAssistant**: Read the plan and update .codeassistant/config.yaml as you progress.`;
  },
};
```

### Update: `src/adapters/types.ts`

```typescript
export type AdapterTarget =
  | 'claude'
  | 'cursor'
  | 'aider'
  | 'cline'
  | 'windsurf'
  | 'generic'
  | 'codeassistant';  // Add this
```

### Update: `src/adapters/index.ts`

```typescript
import { codeassistantAdapter } from './codeassistant';

const ADAPTERS: Record<AdapterTarget, OutputAdapter> = {
  // ... existing adapters ...
  codeassistant: codeassistantAdapter,
};

const NATIVE_ADAPTERS = new Set<AdapterTarget>([
  // ... existing adapters ...
  "codeassistant"
]);

export { codeassistantAdapter } from './codeassistant';
```

## Testing Your Adapter

### Unit Tests

```typescript
it('should generate valid YAML config', () => {
  const file = codeassistantAdapter.generateAgentFile(brief, config);
  expect(file.content).toMatch(/^project:/m);
});
```

### Integration Tests

```typescript
it('should work with devplan_generate_plan tool', async () => {
  const result = await callMcpTool('devplan_generate_plan', {
    brief_content: testBrief,
    target: 'codeassistant'
  });
  expect(result).toContain('codeassistant');
});
```

### Manual Testing

1. Generate files with your adapter:
   ```
   Use devplan_generate_plan with target='codeassistant'
   ```

2. Validate the output format matches your tool's expectations

3. Test with your actual tool if possible

## Common Patterns

### Pattern: Class-Based Adapter

Some adapters might use a class for more complex logic:

```typescript
class MyAdapterClass implements OutputAdapter {
  readonly target = 'mytool' as const;
  readonly displayName = 'MyTool';
  readonly agentFileExtension = '.md';

  generateAgentFile(brief: string, config: AdapterConfig): GeneratedFile {
    // Implementation
  }

  // ... other methods
}

export const mytoolAdapter = new MyAdapterClass();
```

### Pattern: Format-Specific Builders

For complex formats, create helper classes:

```typescript
class YAMLBuilder {
  private data: Record<string, unknown> = {};

  addSection(name: string, content: string): this {
    this.data[name] = content;
    return this;
  }

  build(): string {
    return YAML.stringify(this.data);
  }
}
```

### Pattern: Shared Utilities

Extract common logic to `adapters/utils.ts`:

```typescript
export function slugifyProjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function formatPhaseList(plan: string): string {
  // Extract phases and format them
}
```

## Troubleshooting

### TypeScript Errors

**Error**: `Type 'mytool' is not assignable to type 'AdapterTarget'`

**Solution**: Update `src/adapters/types.ts` to include your target in the `AdapterTarget` union.

### Adapter Not Found

**Error**: `Cannot find module './mytool'`

**Solution**:
1. Make sure file exists at `src/adapters/mytool.ts`
2. Check export name matches import: `export const mytoolAdapter`
3. Register in `src/adapters/index.ts`

### Tests Failing

**Issue**: Tests pass locally but fail in CI

**Solution**:
1. Ensure all imports are relative paths
2. Check file paths use forward slashes
3. Verify Node.js version matches CI environment

## Contributing Guidelines

1. **Code Quality**
   - Use TypeScript strict mode
   - Add JSDoc comments
   - Follow existing code style
   - >80% test coverage

2. **Documentation**
   - Include adapter-specific docs
   - Add examples
   - Document limitations
   - Link to tool's official docs

3. **Testing**
   - Unit tests for all methods
   - Integration test with devplan tools
   - Edge case tests
   - Manual testing confirmation

4. **Commit Messages**
   - Use semantic commits: `feat(adapters): add mytool adapter`
   - Separate concerns: code, tests, docs in different commits
   - Reference issues: `fixes #123`

## Support

For questions or issues:

1. Check existing adapter implementations
2. Review the `OutputAdapter` interface
3. Open an issue on GitHub
4. Join the DevPlan community discussions

---

*Happy adapter building! Your contributions help make DevPlan available to more developers.*
