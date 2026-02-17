# DevPlan Worktree Mode — Design Document

## Summary

Add a `gitWorkflow: "worktree"` option to DevPlan that generates worktree-based
instructions instead of branch-checkout instructions. This enables true parallel
execution where multiple Claude Code agents each work in their own directory
simultaneously.

## Motivation

The current git workflow uses `git checkout -b feature/X-Y-desc` for each task.
This means:
- Only one agent can work at a time (checkout switches the whole working dir)
- Agents must serialize on task boundaries
- No parallelism across independent tasks

With `git worktree`, each task gets its own directory:

```
repo/                          ← main (stable, don't touch)
repo-worktrees/
├── 1-1-core-module/           ← Agent A
├── 2-1-data-parser/           ← Agent B
└── 3-1-api-layer/             ← Agent C
```

All three agents run simultaneously in separate terminals.

## Configuration

### Brief-level option

Add to `ProjectBrief` model:

```typescript
gitWorkflow?: "branch" | "worktree";  // default: "branch"
```

When `"worktree"`:
- All generated git instructions use worktree commands
- CLAUDE.md includes worktree coordination rules
- Executor agent includes worktree-awareness section
- Setup script is generated alongside the plan

### How it flows

```
PROJECT_BRIEF.md
  └─ gitWorkflow: "worktree"
       ├─ generators.ts  →  git instructions become worktree-based
       ├─ CLAUDE.md      →  includes worktree layout/rules section
       ├─ executor.md    →  worktree-scoped agent behavior
       └─ setup script   →  scripts/setup-worktrees.sh
```

## Implementation Plan

### 1. Model changes (`models.ts`)

```typescript
// Add to ProjectBriefSchema
gitWorkflow: z.enum(["branch", "worktree"]).default("branch"),
```

### 2. Brief parsing (`generators.ts` — `parseBrief()`)

Extract `gitWorkflow` from brief content. Support both:
- Explicit field: `- **Git Workflow**: worktree`
- Inferred: presence of `## Worktree Configuration` section

### 3. Git instruction blocks (`generators.ts`)

Every place that currently emits:
```markdown
**Git**: Create branch `feature/X-Y-description`
```

Must conditionally emit:
```markdown
**Git**: Create worktree `../repo-worktrees/X-Y-description` from main
```

Key locations in generators.ts:
- Phase headers ("Git: Create branch...")
- Task squash-merge instructions
- Completion protocol (commit, merge, delete branch → commit, merge worktree, remove)
- Session interruption protocol (WIP commits)

### 4. Worktree-specific content

#### Setup script (`scripts/setup-worktrees.sh`)
Pre-creates all worktrees from the dependency graph:
```bash
# For each task in the plan:
git worktree add ../repo-worktrees/1-1-core-module -b task/1-1-core-module main
git worktree add ../repo-worktrees/2-1-data-parser -b task/2-1-data-parser main
```

#### CLAUDE.md section
- Directory layout diagram
- Rules: never modify main worktree directly
- Merge order: respect dependency graph
- Conflict zones: list files likely to conflict

#### Executor agent addendum
- Detect worktree mode (check if cwd is under `*-worktrees/`)
- Use relative paths for project references
- Port isolation via task-specific `.env.local`
- Don't create sub-branches within worktrees

### 5. Edge Cases

| Scenario | Resolution |
|----------|------------|
| **Shared config files** | Lock mechanism; modify from main worktree only |
| **Lock file conflicts** | Each worktree gets independent `node_modules`/`venv`/`target` |
| **Port conflicts** | Per-task `.env.local` with `PORT=base + task_offset` |
| **DB migration ordering** | Sequential merge order respects dependency graph; per-task test DB |
| **Two tasks touch same file** | Dependency graph should prevent; warn if detected |
| **Worktree branch diverges from main** | Rebase before merge; CI validates on rebase |

### 6. Merge Protocol

When a task completes in its worktree:

```bash
# From the main worktree:
cd repo/
git merge --squash task/1-1-core-module
git commit -m "feat: complete task 1.1 - Core Module"

# Remove the worktree:
git worktree remove ../repo-worktrees/1-1-core-module
git branch -D task/1-1-core-module

# Update downstream worktrees that depend on this task:
cd ../repo-worktrees/2-1-data-parser
git rebase main
```

### 7. OpenClaw/Claude Code Integration

When agents are scoped to worktrees:
- Each Claude Code instance is launched in its worktree directory
- The agent's `CLAUDE.md` and `DEVELOPMENT_PLAN.md` are symlinked or copied
- Agent only sees/modifies files within its worktree
- Completion triggers merge from orchestrator (main session)

```bash
# Launch parallel agents:
cd repo-worktrees/1-1-core-module && claude "execute subtask 1.1.1"
cd repo-worktrees/2-1-data-parser && claude "execute subtask 2.1.1"
```

## Files Touched

- `src/models.ts` — Add `gitWorkflow` to `ProjectBriefSchema`
- `src/generators.ts` — Conditional git instructions throughout
- `src/worktree.ts` — Setup script, agent instructions, CLAUDE.md section (exists)
- `src/__tests__/worktree.test.ts` — Tests (exists, needs expansion)
- `src/adapters/claude.ts` — Pass workflow config through adapter

## Open Questions

1. Should worktree dirs live at `../repo-worktrees/` or `../.worktrees/`?
2. Should we auto-detect parallelizable tasks from the dependency graph?
3. Should the setup script accept a plan file to only create needed worktrees?

---

*Created: 2026-02-16*
*Status: Prototyping*
