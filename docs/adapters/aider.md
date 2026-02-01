# Aider Adapter Documentation

## Overview

The Aider adapter generates `.aider.conf.yml` configuration files for [Aider](https://aider.chat/), an AI pair programming tool that works with Claude or other LLMs. Aider includes powerful multi-file editing and architect mode for strategic planning.

## .aider.conf.yml Format

### File Structure

- **Filename**: `.aider.conf.yml`
- **Location**: Project root directory
- **Format**: YAML configuration file
- **Encoding**: UTF-8

### Format Specification

The `.aider.conf.yml` file uses YAML syntax with these conventions:

```yaml
# Architect mode configuration for DevPlan-based development
architect: true
auto-commits: true

# Aider-specific rules and conventions
rules:
  - Rule describing code style
  - Rule describing development process
  - Rule describing architecture

# Model configuration
model: claude-3-5-sonnet-20241022

# Read-only files to reference but not modify
read-only-files:
  - package.json
  - tsconfig.json

# Files to always exclude
ignore-patterns:
  - node_modules
  - dist
  - build
```

### Key Configuration Options

1. **architect** - When `true`, Aider uses architect mode for strategic planning
2. **auto-commits** - Automatically commit changes after each edit
3. **model** - LLM model to use (claude-3-5-sonnet, gpt-4, etc.)
4. **rules** - Development guidelines and conventions
5. **read-only-files** - Files to reference without modifying
6. **ignore-patterns** - Patterns for files to exclude

## DevPlan Integration

### Mapping DEVELOPMENT_PLAN.md to .aider.conf.yml

The DevPlan Aider adapter transforms the development plan into Aider-compatible configuration:

| Plan Element | .aider.conf.yml Mapping |
|---|---|
| Project context | YAML comments and rules |
| Phase structure | Rules for phase workflow |
| Subtask checklist | Architect mode guidance |
| Deliverables | Concrete implementation rules |
| Testing requirements | Testing rules |

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

**Output (.aider.conf.yml)**:
```yaml
# Phase 1: Setup
# When implementing Phase 1, complete these subtasks in order:

# Subtask 1.1.1: Initialize project
# - Create src/ directory structure
# - Set up package.json with dependencies
# - Install all required npm packages

architect: true
auto-commits: true

rules:
  - Initialize project with proper directory structure
  - Create and configure package.json with required dependencies
  - Install npm packages before proceeding to implementation
```

## Aider-Specific Features

### Architect Mode

Aider's architect mode is designed for strategic planning:

1. **Multi-file planning** - See all related files before making changes
2. **Dependency analysis** - Understand how changes affect the system
3. **Strategic editing** - Make coordinated changes across files
4. **Iterative refinement** - Plan first, implement incrementally

DevPlan phases naturally align with architect mode:
- Each phase is a strategic planning unit
- Subtasks are implementation steps
- Deliverables are concrete milestones

### Workflow with Aider CLI

```bash
# Start Aider with DevPlan-aware configuration
aider --config .aider.conf.yml

# In the Aider REPL:
/architect  # Enable architect mode for planning
/read DEVELOPMENT_PLAN.md  # Load plan as context
# Now discuss phase objectives with the AI

/code  # Switch to normal mode for implementation
# Implement the subtasks discussed in architect mode
```

### Limitations

The following DevPlan features don't map directly to Aider:

- **Executor/Verifier agents** - Aider doesn't have separate tool invocation profiles like Claude Code
- **Separate agent instructions** - Aider uses single configuration with architect mode
- **Task tools integration** - Not applicable to Aider CLI

As a result, the Aider adapter:
- Returns `null` for `generateExecutorAgent()` (no separate executor in Aider)
- Returns `null` for `generateVerifierAgent()` (no separate verifier in Aider)
- Includes all guidance in main `.aider.conf.yml` file under rules section
- Adds architect mode instructions to facilitate strategic planning

## Implementation Patterns

### Rule Clarity

Write rules that are:
- **Actionable** - Specific steps or guidelines
- **Concise** - Fit within YAML style
- **Complete** - Include context needed for understanding

Good:
```yaml
rules:
  - Use TypeScript for all .ts files
  - Include JSDoc comments on exported functions
  - Use const for variable declarations
  - Run tests after each implementation
```

Bad:
```yaml
rules:
  - Write good code
  - Follow standards
```

### YAML Best Practices

Use proper YAML formatting:

```yaml
# Comments provide structure
architect: true
auto-commits: true

# Multi-line values use pipe (|) for preservation or > for folding
rules:
  - |
    When implementing TypeScript features:
    - Use strict mode
    - Add explicit return types
    - Include JSDoc comments

# Keep read-only lists clean
read-only-files:
  - package.json
  - tsconfig.json
  - wrangler.toml
```

## Comparison with Other Adapters

| Feature | Aider | Claude | Cursor | Generic |
|---|---|---|---|---|
| Main file format | `.aider.conf.yml` (YAML) | `CLAUDE.md` (markdown) | `.cursorrules` (text) | `AGENTS.md` (markdown) |
| Executor support | No (architect mode) | Yes (separate file) | No (included in main) | Yes (separate files) |
| Verifier support | No (architect mode) | Yes (separate file) | No (included in main) | Yes (separate files) |
| Plan transformation | Yes | No | Yes | No |
| File count | 1 | 3 | 1 | 3-5 |
| CLI integration | Aider CLI tool | Claude Code/Terminal | Cursor IDE | Generic |
| Architect support | Yes | No | No | No |
| YAML config | Yes | No | No | No |

## Testing .aider.conf.yml Files

### Validation

1. **YAML syntax check** - File is valid YAML
2. **Configuration check** - Required keys are present
3. **Format check** - Rules follow pattern

### Manual Testing

```bash
# Validate YAML syntax
aider --config .aider.conf.yml --lint

# Test with actual project
aider --config .aider.conf.yml

# Verify architect mode
/help architect  # In Aider REPL
```

## Aider Architect Mode Workflow

The Aider adapter is optimized for architect mode usage:

### Phase 1: Understanding
1. Load DEVELOPMENT_PLAN.md with `/read DEVELOPMENT_PLAN.md`
2. Load PROJECT_BRIEF.md with `/read PROJECT_BRIEF.md`
3. Use `/architect` to enter strategic planning mode

### Phase 2: Planning
1. Discuss the current phase with the AI
2. Identify all files that will be affected
3. Plan the sequence of changes
4. Review the architect's suggested approach

### Phase 3: Implementation
1. Switch to `/code` mode
2. Implement subtasks one at a time
3. Verify each subtask with tests
4. Commit after each subtask (auto-commits enabled)

### Phase 4: Verification
1. Run full test suite: `npm test`
2. Type check: `npx tsc --noEmit`
3. Build verification: `wrangler deploy --dry-run`

## Future Enhancements

Potential improvements to the Aider adapter:

- **Architect templates** - Pre-built architect responses for common patterns
- **Model selection** - Different configs for different LLM models
- **Advanced rules** - More sophisticated rule syntax if Aider adds features
- **Codebase indexing** - Automatic index generation for `/read` context

## References

- [Aider Official Docs](https://aider.chat/)
- [Aider Configuration Guide](https://aider.chat/docs/config.html)
- [Aider Architect Mode](https://aider.chat/docs/gpt4.html)
- [DevPlan Multi-Model Support (Issue #113)](https://github.com/anthropics/devplan-mcp-server/issues/113)
