# DevPlan Adapter Comparison

This document provides a comprehensive comparison of all DevPlan output adapters.

## Quick Reference

| Adapter | Main File | Executor | Verifier | Plan Transform | IDE | Status |
|---------|-----------|----------|----------|-----------------|-----|--------|
| Claude | `CLAUDE.md` | Yes | Yes | No | Claude Code | ✅ Default |
| Cursor | `.cursorrules` | No | No | Yes | Cursor IDE | ✅ Native |
| Aider | `.aider.conf.yml` | No | No | Yes | Terminal | ✅ Native |
| Cline | `.cline/instructions.md` | Yes | Yes | No | VS Code | ✅ Native |
| Windsurf | `.windsurf/rules.md` | No | No | Yes | Windsurf | ✅ Native |
| Generic | `AGENTS.md` | Yes | Yes | No | Any Model | ✅ Native |

## Detailed Comparison

### Claude Adapter

**Target Tool**: Claude Code IDE
**Repository**: https://github.com/anthropics/claude-code

**Main File**:
- **Filename**: `CLAUDE.md`
- **Location**: Project root
- **Format**: Markdown
- **Size**: Typically 2-5 KB

**Generated Files**:
1. `CLAUDE.md` - Main agent instructions
2. `.claude/agents/{project}-executor.md` - Executor agent with Task tool integration
3. `.claude/agents/{project}-verifier.md` - Verifier agent with Task tool integration

**Key Features**:
- ✅ Full executor/verifier support
- ✅ Task tool integration for real-time progress tracking
- ✅ Session checklists and git discipline
- ✅ Can generate specialized agents (executor, verifier)
- ✅ Best for teams using Claude Code

**Limitations**:
- Claude Code specific (not portable to other tools)
- Requires Claude Code IDE or Claude API for optimal use

**Example Usage**:
```
Use devplan_generate_plan to create a plan with target='claude' (default)
Then use devplan_generate_executor and devplan_generate_verifier
```

**When to Use**:
- Primary development with Claude Code
- Need executor/verifier separation and Task tool integration
- Building AI-assisted development teams

---

### Cursor Adapter

**Target Tool**: Cursor IDE
**Website**: https://cursor.com
**Documentation**: https://docs.cursor.com

**Main File**:
- **Filename**: `.cursorrules`
- **Location**: Project root
- **Format**: Plain text
- **Size**: Typically 3-6 KB

**Generated Files**:
1. `.cursorrules` - All guidance in single rules file

**Key Features**:
- ✅ Plain text rules format (no YAML/JSON parsing)
- ✅ Sections for different concern areas
- ✅ Simple, readable format for Cursor Composer
- ✅ Includes executor/verifier guidance in main file
- ✅ Plan transformation adapts structure for Cursor workflow

**Limitations**:
- ❌ No separate executor agent (guidance included in `.cursorrules`)
- ❌ No separate verifier agent (guidance included in `.cursorrules`)
- ❌ No IDE-level task tracking
- ✅ Works well with Cursor Composer multi-file editing

**Format Specification**:
```
[Section Name]

Description and rules...
- First rule
- Second rule

[Another Section]

More guidance...
```

**Example Usage**:
```
Use devplan_generate_plan with target='cursor'
Then use devplan_generate_claude_md with target='cursor'
```

**When to Use**:
- Primary IDE is Cursor
- Need simple, readable `.cursorrules` file
- Prefer single-file guidance format
- Using Cursor Composer for multi-file editing

**Related Documentation**: See [docs/adapters/cursor.md](/docs/adapters/cursor.md) for detailed Cursor adapter documentation.

---

### Aider Adapter

**Target Tool**: Aider CLI
**Website**: https://aider.chat
**Repository**: https://github.com/paul-gauthier/aider

**Main File**:
- **Filename**: `.aider.conf.yml`
- **Location**: Project root
- **Format**: YAML
- **Size**: Typically 2-4 KB

**Generated Files**:
1. `.aider.conf.yml` - Configuration with system prompt

**Key Features**:
- ✅ YAML configuration format (standard Aider format)
- ✅ System prompt includes DevPlan methodology
- ✅ Architect mode support for complex tasks
- ✅ Command integration (`/code`, `/read`, etc.)
- ✅ Plan transformation optimizes for Aider workflow

**Limitations**:
- ❌ No separate executor agent (uses architect mode)
- ❌ No separate verifier agent (uses architect mode)
- ❌ No file-based task tracking
- ✅ Aider's architect mode handles complexity automatically

**Configuration Example**:
```yaml
# DevPlan methodology guidance
system-prompt: |
  You are an Aider agent implementing a DevPlan...

# Phase-by-phase architecture guidance
# Executor/verifier roles embedded in system prompt
```

**Example Usage**:
```
Use devplan_generate_plan with target='aider'
Then use devplan_generate_claude_md with target='aider'
```

**When to Use**:
- Primary tool is Aider CLI
- Working in terminal environment
- Need YAML-based configuration
- Using Aider's architect mode for multi-file changes

**Related Documentation**: See [docs/adapters/aider.md](/docs/adapters/aider.md) for detailed Aider adapter documentation.

---

### Cline Adapter

**Target Tool**: VS Code Cline Extension
**Repository**: https://github.com/cline/cline

**Main File**:
- **Filename**: `.cline/instructions.md`
- **Location**: `.cline/` directory
- **Format**: Markdown
- **Size**: Typically 3-5 KB

**Generated Files**:
1. `.cline/instructions.md` - Main instructions
2. `.cline/executor.md` - Executor instructions (if supported)
3. `.cline/verifier.md` - Verifier instructions (if supported)

**Key Features**:
- ✅ VS Code extension format
- ✅ Executor/verifier support
- ✅ Directory structure for organization
- ✅ Markdown format (readable in editor)
- ✅ Compatible with VS Code extension API

**Limitations**:
- Requires VS Code Cline extension to be installed
- No IDE-level task tracking (unlike Claude Code)

**File Structure**:
```
.cline/
├── instructions.md      # Main agent instructions
├── executor.md          # Executor subtask guidance
└── verifier.md          # Verification procedure guidance
```

**Example Usage**:
```
Use devplan_generate_plan with target='cline'
Then use devplan_generate_executor with target='cline'
```

**When to Use**:
- Primary IDE is VS Code with Cline extension
- Need executor/verifier separation
- Working in team environment with VS Code

---

### Windsurf Adapter

**Target Tool**: Codium Windsurf IDE
**Website**: https://codeium.com/windsurf
**Documentation**: https://docs.codeium.com/windsurf

**Main File**:
- **Filename**: `.windsurf/rules.md`
- **Location**: `.windsurf/` directory
- **Format**: Markdown
- **Size**: Typically 3-6 KB

**Generated Files**:
1. `.windsurf/rules.md` - All guidance in rules format

**Key Features**:
- ✅ Cascade-optimized format for multi-file edits
- ✅ Markdown rules format
- ✅ All guidance in single file
- ✅ Windsurf IDE integration
- ✅ Plan transformation adapts for Cascade workflow

**Limitations**:
- ❌ No separate executor agent (guidance in rules)
- ❌ No separate verifier agent (guidance in rules)
- ✅ Cascade handles multi-file workflows automatically

**Format**:
```markdown
# Windsurf Rules

## Phase 1: Setup

Rules for phase 1...

## Phase 2: Development

Rules for phase 2...

## Executor Guidelines

Guidance for execution...

## Verifier Guidelines

Verification procedures...
```

**Example Usage**:
```
Use devplan_generate_plan with target='windsurf'
Then use devplan_generate_claude_md with target='windsurf'
```

**When to Use**:
- Primary IDE is Windsurf
- Using Cascade for multi-file AI edits
- Prefer single-file rules format

---

### Generic Adapter

**Target Tool**: Any Model/Tool
**Use Case**: Cross-platform, model-agnostic format

**Main Files**:
- **Filename**: `AGENTS.md` (required), `EXECUTOR.md`, `VERIFIER.md`
- **Location**: Project root
- **Format**: Markdown
- **Size**: Typically 4-8 KB total

**Generated Files**:
1. `AGENTS.md` - Main agent instructions
2. `EXECUTOR.md` - Executor agent guidance (if needed)
3. `VERIFIER.md` - Verifier agent guidance (if needed)

**Key Features**:
- ✅ Model-agnostic markdown format
- ✅ Can be used with any AI model or tool
- ✅ Full executor/verifier support
- ✅ No dependencies on specific IDE or tool
- ✅ Portable across different platforms

**Limitations**:
- No tool-specific integrations
- No IDE-level features
- Requires manual setup in new environments

**File Structure**:
```
AGENTS.md           # Main development agent instructions
EXECUTOR.md         # Subtask executor guidance
VERIFIER.md         # Verification and testing guidance
```

**Example Usage**:
```
Use devplan_generate_plan with target='generic'
Then use devplan_generate_executor with target='generic'
And use devplan_generate_verifier with target='generic'
```

**When to Use**:
- Multiple teams using different tools
- Need portable format across environments
- Using custom or emerging AI tools
- Building cross-tool documentation

---

## Adapter Capability Matrix

### File Generation

| Capability | Claude | Cursor | Aider | Cline | Windsurf | Generic |
|-----------|--------|--------|-------|-------|----------|---------|
| Main agent file | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Separate executor | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Separate verifier | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Plan transformation | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| IDE integration | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |

### Feature Support

| Feature | Claude | Cursor | Aider | Cline | Windsurf | Generic |
|---------|--------|--------|-------|-------|----------|---------|
| Task tool integration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Executor role | ✅ | Embedded | Architect | ✅ | Embedded | ✅ |
| Verifier role | ✅ | Embedded | Architect | ✅ | Embedded | ✅ |
| Multi-file editing | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Terminal friendly | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Config file format | Markdown | Plain text | YAML | Markdown | Markdown | Markdown |

---

## Choosing an Adapter

### Decision Tree

**Which IDE/tool are you using?**

- **Claude Code** → Use `claude` adapter
  - Best DevPlan support with Task tools
  - Full executor/verifier agents
  - Real-time progress tracking

- **Cursor IDE** → Use `cursor` adapter
  - Generate `.cursorrules` for Cursor
  - Works with Cursor Composer
  - Single-file guidance format

- **Aider CLI** → Use `aider` adapter
  - Generate `.aider.conf.yml`
  - Works in terminal environment
  - Architect mode for complex tasks

- **VS Code + Cline** → Use `cline` adapter
  - Generate `.cline/instructions.md`
  - Runs in VS Code extension
  - Executor/verifier separation

- **Windsurf IDE** → Use `windsurf` adapter
  - Generate `.windsurf/rules.md`
  - Cascade-optimized format
  - Codium's AI IDE

- **Other tool or multi-team** → Use `generic` adapter
  - Generate portable markdown files
  - Use with any AI tool
  - No tool-specific dependencies

### Recommendation Table

| Scenario | Recommended Adapter | Reason |
|----------|-------------------|--------|
| Solo Claude Code developer | `claude` | Full features, real-time tracking |
| Cursor IDE user | `cursor` | Native .cursorrules support |
| Aider CLI power user | `aider` | YAML config, architect mode |
| VS Code Cline user | `cline` | VS Code extension compatibility |
| Windsurf IDE user | `windsurf` | Cascade optimization |
| Multi-tool team | `generic` | Portable markdown format |
| Building for community | `generic` | No tool dependencies |
| Unknown target audience | `generic` | Works everywhere |

---

## Migration Between Adapters

If you want to switch from one adapter to another, here's the process:

1. **Keep your original plan** - `DEVELOPMENT_PLAN.md` stays the same
2. **Generate new adapter files**:
   ```
   Use devplan_generate_plan with target='new_target'
   Use devplan_generate_claude_md with target='new_target'
   Use devplan_generate_executor with target='new_target' (if supported)
   Use devplan_generate_verifier with target='new_target' (if supported)
   ```
3. **Update tool configuration** - Move agent files to new tool's location
4. **Continue from same point** - Same progress, new tool

**Example**: Migrating from Claude to Cursor
```
# You have CLAUDE.md and DEVELOPMENT_PLAN.md
# Generate Cursor equivalents
Use devplan_generate_claude_md with target='cursor'
# Now you have .cursorrules with same guidance
# Continue execution with Cursor using same DEVELOPMENT_PLAN.md
```

---

## Contributing New Adapters

See [docs/CONTRIBUTING_ADAPTERS.md](/docs/CONTRIBUTING_ADAPTERS.md) for instructions on building and contributing new adapters.

---

## Adapter Implementation Status

- ✅ **Claude** - Fully implemented and production-ready
- ✅ **Cursor** - Fully implemented and production-ready
- ✅ **Aider** - Fully implemented and production-ready
- ✅ **Cline** - Fully implemented and production-ready
- ✅ **Windsurf** - Fully implemented and production-ready
- ✅ **Generic** - Fully implemented and production-ready

All adapters pass comprehensive test suites and are ready for production use.

---

## Testing Adapters

Each adapter is tested with:

1. **Unit tests** - Individual adapter methods
2. **Integration tests** - Full plan generation and transformation
3. **Output validation** - Generated files match expected format
4. **Round-trip tests** - Ensuring consistency across adapters

Run tests with:
```bash
npx vitest run src/__tests__/adapters.test.ts
```

---

## API Reference

See the [OutputAdapter Interface](/src/adapters/types.ts) for the complete API that each adapter implements.

Key methods:
- `generateAgentFile()` - Create main agent instructions
- `generateExecutorAgent()` - Create executor (if supported)
- `generateVerifierAgent()` - Create verifier (if supported)
- `transformPhasePlan()` - Adapt plan for this adapter
- `getPlanInstructions()` - Get target-specific instructions

---

*For more details on a specific adapter, see the documentation in [docs/adapters/](/docs/adapters/)*
