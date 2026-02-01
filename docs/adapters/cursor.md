# Cursor Adapter Documentation

## Overview

The Cursor adapter generates `.cursorrules` files for the [Cursor IDE](https://cursor.com/). Cursor is an AI-first code editor that uses `.cursorrules` files to customize AI behavior for specific projects.

## .cursorrules Format

### File Structure

- **Filename**: `.cursorrules` (no extension)
- **Location**: Project root directory
- **Format**: Plain text with sections and rules
- **Encoding**: UTF-8

### Format Specification

The `.cursorrules` file uses a plain text format with these conventions:

```
[Section Name]

Description of the section with rules and guidelines.
- First rule
- Second rule
- Third rule

[Another Section]

More rules and guidelines...
```

### Key Sections

1. **Project Overview** - High-level context about the project
2. **Development Workflow** - How to approach development
3. **Code Style & Standards** - Formatting and conventions
4. **Architecture & Patterns** - System design principles
5. **Testing Requirements** - Test expectations and coverage
6. **Common Tasks** - Frequent operations and workflows

## DevPlan Integration

### Mapping DEVELOPMENT_PLAN.md to .cursorrules

The DevPlan Cursor adapter transforms the development plan into actionable rules:

| Plan Element | .cursorrules Mapping |
|---|---|
| Project context | Project Overview section |
| Phase structure | Development Workflow section |
| Subtask checklist | Task execution rules |
| Deliverables | Concrete implementation guidelines |
| Testing requirements | Testing Requirements section |

### Example Transformation

**Input (DEVELOPMENT_PLAN.md excerpt)**:
```markdown
## Phase 1: Setup

**Subtask 1.1.1: Initialize project**

**Deliverables**:
- [ ] Create src/ directory
- [ ] Create package.json
- [ ] Install dependencies
```

**Output (.cursorrules section)**:
```
[Phase 1: Setup]

When implementing Phase 1, complete these subtasks in order:

Subtask 1.1.1: Initialize project
- Create src/ directory structure
- Set up package.json with dependencies
- Install all required npm packages
```

## Cursor-Specific Features

### Composer Workflows

Cursor's multi-file editing with Composer works well with `.cursorrules`. The rules help Cursor:

1. **Understand context** - What the project is building
2. **Follow conventions** - Consistent code style
3. **Apply patterns** - Architectural principles
4. **Execute tasks** - Step-by-step subtask workflows

### Limitations

The following DevPlan features don't map directly to Cursor:

- **Executor/Verifier agents** - Cursor doesn't have separate tool invocation profiles
- **Agent instructions** - Cursor uses `.cursorrules` for all guidance
- **Task tools integration** - Not applicable to Cursor IDE

As a result, the Cursor adapter:
- Returns `null` for `generateExecutorAgent()` (no separate executor)
- Returns `null` for `generateVerifierAgent()` (no separate verifier)
- Includes executor/verifier guidance in main `.cursorrules` file under special sections

## Implementation Patterns

### Rule Clarity

Write rules that are:
- **Actionable** - Specific steps or guidelines
- **Concise** - Brief, scannable format
- **Complete** - Include context needed for understanding

Good:
```
[Code Generation]

When generating new files:
- Use TypeScript for all .ts files
- Include JSDoc comments on exported functions
- Use const for variable declarations
```

Bad:
```
[Code]

Write good code following standards.
```

### Hierarchy

Use subsections to organize complex guidance:

```
[Architecture]

General principles:
- Use the adapter pattern for multi-model support
- Implement interfaces before creating implementations

TypeScript Guidelines:
- Strict mode enabled (strict: true in tsconfig)
- Use explicit return types on exported functions
- Prefer type imports for type-only imports
```

## Comparison with Other Adapters

| Feature | Cursor | Claude | Aider | Generic |
|---|---|---|---|---|
| Main file format | `.cursorrules` (text) | `CLAUDE.md` (markdown) | `.aider.conf.yml` (YAML) | `AGENTS.md` (markdown) |
| Executor support | No (included in main) | Yes (separate file) | No (architect mode) | Yes (separate files) |
| Verifier support | No (included in main) | Yes (separate file) | No (architect mode) | Yes (separate files) |
| Plan transformation | Yes | No | Yes | No |
| File count | 1 | 3 | 1 | 3-5 |
| IDE integration | Cursor IDE | Claude Code/Terminal | Terminal CLI | Generic |

## Testing .cursorrules Files

### Validation

1. **Syntax check** - File is valid UTF-8 plain text
2. **Format check** - Sections follow `[Name]` pattern
3. **Content check** - Includes required sections

### Manual Testing

1. Create a test project with generated `.cursorrules`
2. Open in Cursor IDE
3. Open Composer and start a task
4. Verify Cursor follows the rules

## Future Enhancements

Potential improvements to the Cursor adapter:

- **Syntax highlighting** - YAML metadata for editor support
- **Cursor Rules Language** - If Cursor introduces formal rule syntax
- **Multi-file support** - Additional `.cursorrules` files in subdirectories
- **Context injection** - Cursor's `@` references to specific files/sections

## References

- [Cursor Official Docs](https://docs.cursor.com)
- [.cursorrules Format Community Guide](https://cursor.directory)
- [DevPlan Multi-Model Support (Issue #113)](https://github.com/anthropics/devplan-mcp-server/issues/113)
