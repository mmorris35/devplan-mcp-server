# DevPlan Templates

Templates for PROJECT_BRIEF.md, DEVELOPMENT_PLAN.md, and CLAUDE.md across all
four project types (CLI, Web App, API, Library).

---

## PROJECT_BRIEF.md Template

```markdown
# Project Brief: {name}

## Overview

| Field | Value |
|-------|-------|
| **Project Name** | {name} |
| **Project Type** | {cli / web_app / api / library} |
| **Goal** | {one sentence} |
| **Timeline** | {timeline} |
| **Team Size** | 1 |

## Target Users

- {user type 1}
- {user type 2}

## Features

### Must-Have (MVP)

1. **{Feature Name}** - {description}
2. **{Feature Name}** - {description}
3. **{Feature Name}** - {description}

### Nice-to-Have (v2)

- {feature}
- {feature}

## Technical Requirements

### Tech Stack

| Component | Technology |
|-----------|------------|
| Language | {language} |
| Framework | {framework} |
| Testing | {test framework} |
| Linting | {linter} |

### Constraints

- {constraint 1}
- {constraint 2}

## Success Criteria

1. {criterion 1}
2. {criterion 2}
3. {criterion 3}

## Out of Scope

- {thing 1}
- {thing 2}
```

---

## DEVELOPMENT_PLAN.md Structure

### Header

```markdown
# DEVELOPMENT_PLAN.md - {ProjectName}

> **Haiku-Executable Plan**: Every subtask contains complete, copy-pasteable
> code. Claude Haiku can execute this mechanically without inference.

## Project Summary

| Field | Value |
|-------|-------|
| **Project** | {name} |
| **Goal** | {one-sentence goal} |
| **Phases** | {count} |
| **Tasks** | {count} |
| **Subtasks** | {count} |

---

## Phase Overview

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 0 | Project Setup | {n} | Pending |
| 1 | Core Implementation | {n} | Pending |
| 2 | Polish & Verify | {n} | Pending |
```

### Subtask Template

Every subtask MUST include ALL of these sections:

```markdown
**Subtask X.Y.Z: {Title}**

**Prerequisites:**
- [x] X.Y.W: {Previous subtask title}

**Deliverables:**
- [ ] `path/to/file.ext` - {what this file does}
- [ ] `path/to/test.ext` - {tests for the above}
- [ ] {3-7 total deliverables}

**Technology Decisions:**
- {library/pattern choice with rationale}

**Complete Code:**

Create file `path/to/file.ext`:
\`\`\`{language}
{COMPLETE, working code — all imports, no placeholders}
\`\`\`

Create file `path/to/test.ext`:
\`\`\`{language}
{COMPLETE test file — all imports, all fixtures, no external deps}
\`\`\`

**Verification:**
\`\`\`bash
{exact command to run}
# Expected: {exact expected output}
\`\`\`

**Success Criteria:**
- [ ] {Testable condition}
- [ ] {Another testable condition}
- [ ] All tests pass

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Files Created**: (filled by executor)
- **Files Modified**: (filled by executor)
- **Tests**: (X tests, Y% coverage)
- **Build**: (pass/fail)
- **Branch**: (branch name)
```

### Task Complete Section

After each task's subtasks:

```markdown
### Task X.Y Complete - Squash Merge

**When all subtasks are complete, execute:**

\`\`\`bash
git push -u origin feature/X-Y-{name}
git checkout main
git pull origin main
git merge --squash feature/X-Y-{name}
git commit -m "{type}({scope}): {description}

- {bullet 1}
- {bullet 2}"
git push origin main
git branch -d feature/X-Y-{name}
git push origin --delete feature/X-Y-{name}
\`\`\`

**Checklist:**
- [ ] All subtasks complete
- [ ] All verification passes
- [ ] Squash merged to main
- [ ] Feature branch deleted
```

### Project Complete Checklist

```markdown
# Project Complete Checklist

- [ ] Phase 0: Setup complete
- [ ] Phase 1: Core complete
- [ ] Phase 2: Polish complete
- [ ] All tests pass
- [ ] Coverage meets target
- [ ] CLI/API/App works end-to-end
- [ ] Clean git history (squash merges only)
```

---

## Project Type Scaffolds

### CLI Tool

**Typical Phase Structure:**
- Phase 0: Project setup (pyproject.toml/package.json, directory structure, tooling)
- Phase 1: Core CLI (argument parsing, main commands, output formatting)
- Phase 2: Testing & polish (edge cases, error handling, end-to-end verification)

**Python CLI Stack:**
| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| CLI Framework | Click |
| Output | Rich |
| Testing | pytest + pytest-cov |
| Linting | ruff |
| Types | mypy (strict) |
| Build | hatchling or setuptools |

**TypeScript CLI Stack:**
| Component | Technology |
|-----------|------------|
| Language | TypeScript 5+ |
| CLI Framework | Commander or yargs |
| Output | chalk + ora |
| Testing | vitest or jest |
| Linting | eslint + prettier |
| Build | tsup or esbuild |

**Directory Structure (Python):**
```
{project}/
├── src/{package}/
│   ├── __init__.py
│   ├── cli.py
│   └── {modules}.py
├── tests/
│   ├── __init__.py
│   └── test_{modules}.py
├── pyproject.toml
├── CLAUDE.md
├── PROJECT_BRIEF.md
└── DEVELOPMENT_PLAN.md
```

**Directory Structure (TypeScript):**
```
{project}/
├── src/
│   ├── index.ts
│   ├── cli.ts
│   └── {modules}.ts
├── tests/
│   └── {modules}.test.ts
├── package.json
├── tsconfig.json
├── CLAUDE.md
├── PROJECT_BRIEF.md
└── DEVELOPMENT_PLAN.md
```

### Web Application

**Typical Phase Structure:**
- Phase 0: Project setup (framework init, DB schema, auth scaffold)
- Phase 1: Backend (API routes, business logic, data layer)
- Phase 2: Frontend (pages, components, forms)
- Phase 3: Integration & polish (E2E tests, error handling, deployment)

**Full-Stack Stack:**
| Component | Technology |
|-----------|------------|
| Frontend | React/Next.js or SvelteKit |
| Backend | Next.js API routes or FastAPI |
| Database | PostgreSQL + Prisma/SQLAlchemy |
| Auth | NextAuth or session-based |
| Testing | vitest + Playwright |
| Styling | Tailwind CSS |

**Directory Structure (Next.js):**
```
{project}/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   ├── components/
│   ├── lib/
│   └── types/
├── tests/
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── CLAUDE.md
```

**Directory Structure (FastAPI + React):**
```
{project}/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── routes/
│   └── tests/
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── CLAUDE.md
```

### REST API

**Typical Phase Structure:**
- Phase 0: Project setup (framework, DB, schema definitions)
- Phase 1: Data models & migrations
- Phase 2: API endpoints (CRUD, auth, validation)
- Phase 3: Testing & documentation (integration tests, OpenAPI docs)

**Python API Stack:**
| Component | Technology |
|-----------|------------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 or SQLModel |
| Database | PostgreSQL or SQLite |
| Validation | Pydantic v2 |
| Testing | pytest + httpx |
| Docs | Auto OpenAPI |

**TypeScript API Stack:**
| Component | Technology |
|-----------|------------|
| Framework | Express or Hono |
| ORM | Prisma or Drizzle |
| Validation | Zod |
| Testing | vitest + supertest |

**Directory Structure (FastAPI):**
```
{project}/
├── src/{package}/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── middleware/
├── tests/
│   ├── conftest.py
│   ├── test_routes/
│   └── test_services/
├── alembic/
├── pyproject.toml
└── CLAUDE.md
```

### Library / Package

**Typical Phase Structure:**
- Phase 0: Project setup (build config, CI, docs scaffold)
- Phase 1: Core API (public interface, main functionality)
- Phase 2: Extended features (edge cases, performance, advanced API)
- Phase 3: Documentation & publishing (README, API docs, examples)

**Python Library Stack:**
| Component | Technology |
|-----------|------------|
| Build | hatchling or setuptools |
| Testing | pytest + hypothesis |
| Docs | mkdocs-material or Sphinx |
| Types | mypy strict + py.typed marker |

**TypeScript Library Stack:**
| Component | Technology |
|-----------|------------|
| Build | tsup (dual CJS/ESM) |
| Testing | vitest |
| Docs | typedoc |
| Types | strict tsconfig |

**Directory Structure (Python):**
```
{project}/
├── src/{package}/
│   ├── __init__.py   (public API exports)
│   ├── py.typed      (PEP 561 marker)
│   └── {modules}.py
├── tests/
├── docs/
├── examples/
├── pyproject.toml
└── CLAUDE.md
```

---

## CLAUDE.md Template

```markdown
# {Project} - Claude Code Rules

## Project Overview
{One paragraph: what it is, what it does, who it's for}

## Quick Reference

| Component | Technology |
|-----------|------------|
| Language | {language} |
| Framework | {framework} |
| Testing | {test framework} |
| Linting | {linter} |

## Directory Structure
\`\`\`
{actual directory tree}
\`\`\`

## Commands

| Command | Purpose |
|---------|---------|
| `{install}` | Install dependencies |
| `{test}` | Run tests |
| `{lint}` | Run linter |
| `{typecheck}` | Type check |
| `{build}` | Build for production |

## Coding Standards

- {Standard 1: e.g., "All functions have type annotations"}
- {Standard 2: e.g., "Test files mirror src structure: src/foo.py → tests/test_foo.py"}
- {Standard 3: e.g., "No default exports in TypeScript"}

## Session Checklist

### Starting a Session
- [ ] Read this file
- [ ] Check DEVELOPMENT_PLAN.md for next subtask
- [ ] Create/checkout correct branch: `git checkout -b feature/X-Y-name`

### Completing a Subtask
- [ ] All deliverables implemented
- [ ] All tests pass: `{test command}`
- [ ] Lint passes: `{lint command}`
- [ ] Types pass: `{typecheck command}`
- [ ] Commit: `git add -A && git commit -m "{type}({scope}): {description}"`
- [ ] Update completion notes in DEVELOPMENT_PLAN.md

### Completing a Task (Squash Merge)
- [ ] All subtasks complete
- [ ] `git checkout main && git merge --squash feature/X-Y-name`
- [ ] `git commit -m "{type}({scope}): {summary}"`
- [ ] `git branch -d feature/X-Y-name`

## Error Recovery

- If tests fail: fix before continuing to next deliverable
- If blocked: document in completion notes, move to next deliverable
- If unclear: check this file for conventions, then PROJECT_BRIEF.md for requirements
```

---

## PowerShell / Non-Python Projects

When the brief specifies PowerShell or another non-Python/non-TypeScript stack,
completely rewrite the scaffold to match:

- **.ps1** scripts and **.psm1** modules instead of .py files
- **Pester** for testing instead of pytest
- **PSScriptAnalyzer** for linting
- **M365/Azure PowerShell modules** where applicable
- Use `Invoke-Pester` for verification commands

Do NOT default to Python when the brief specifies otherwise.
