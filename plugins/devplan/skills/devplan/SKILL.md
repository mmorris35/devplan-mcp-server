---
name: devplan
description: >-
  Use this skill when the user asks to "plan a project", "create a development plan",
  "start a new project", "build a dev plan", "generate a plan", "interview me for a project",
  "create a brief", "make a project brief", or mentions devplan, development planning,
  Haiku-executable plans, executor agents, or verifier agents. Also use when the user says
  "plan this", "scope this out", or asks for a structured implementation plan for any
  software project. Covers the full lifecycle: interview, brief, plan, agents, verification.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash(ls *)
  - Bash(mkdir *)
  - Bash(grep *)
  - Bash(wc *)
  - Bash(cat *)
---

# /devplan — Development Plan Builder

Build Haiku-executable development plans from interview through verification.
No MCP server required — everything runs locally as skill instructions + templates.

Arguments passed: `$ARGUMENTS`

---

## What This Skill Does

Takes a software project from idea to structured, executable plan:

1. **Interview** — gather requirements through focused questions
2. **Brief** — create PROJECT_BRIEF.md capturing the spec
3. **Plan** — generate DEVELOPMENT_PLAN.md with complete, copy-pasteable code
4. **Agents** — create executor (Haiku) and verifier (Sonnet) agent files
5. **Track** — monitor progress and export visualizations
6. **Verify** — validate the built application against the brief

## Dispatch on Arguments

### No args — start the full workflow

Begin with the interview. Ask questions ONE AT A TIME, waiting for each response:

1. "What's your project name?"
2. "What type of project is this? (CLI tool, web app, API, or library)"
3. "In one sentence, what does it do?"
4. "Who will use it? (e.g., developers, end users, admins)"
5. "What are the 3-5 must-have features for MVP?"
6. "Any technologies you must use or cannot use?"
7. "What's your timeline?"
8. "Any constraints I should know about?"

After gathering answers, proceed to brief creation.

### `brief` — create or parse a brief

If a PROJECT_BRIEF.md exists, read and parse it. Otherwise create one from the
interview answers. See `references/templates.md` for the brief template.

Write the brief to `PROJECT_BRIEF.md` in the project root.

### `plan` — generate the development plan

Requires a PROJECT_BRIEF.md (create one first if missing).

**Critical**: Read `references/templates.md` for the plan structure template,
then read `examples/hello-cli-plan.md` for the gold standard example of what
a finished plan looks like.

Generate the plan following these rules:

1. **Structure**: Phases > Tasks > Subtasks (e.g., 1.1.1, 2.3.2)
2. **Scope**: Each subtask is one session (2-4 hours max)
3. **Completeness**: Every subtask MUST have complete, copy-pasteable code blocks
4. **Verification**: Every subtask MUST have verification commands with expected output
5. **Git workflow**: One branch per TASK (not subtask). Squash merge when task completes.

Read `references/validation.md` for the full Haiku-executability rules and common
pitfalls to avoid.

Write to `DEVELOPMENT_PLAN.md` in the project root.

### `agents` — generate executor and verifier agents

Read `references/agents.md` for the agent templates. Generate:

- `.claude/agents/{project}-executor.md` — Haiku-powered, executes subtasks mechanically
- `.claude/agents/{project}-verifier.md` — Sonnet-powered, validates against brief

### `claude-md` — generate project CLAUDE.md

Generate a CLAUDE.md with project overview, tech stack, directory structure,
commands, coding standards, and session checklists. Tailored to the project type.

### `validate` — check plan quality

Read the DEVELOPMENT_PLAN.md and validate it against the rules in
`references/validation.md`. Check both structural completeness and
Haiku-executability. Report specific issues with fix instructions.

### `progress` — show completion status

Parse DEVELOPMENT_PLAN.md checkbox states to show:
- Overall completion percentage
- Phase-by-phase progress
- Next actionable subtask
- Recently completed work

### `export mermaid` — generate Mermaid diagram

Read `references/workflows.md` for the export format. Parse the plan and
generate a Mermaid flowchart showing phases, tasks, dependencies, and status.

### `export reactflow` — generate ReactFlow JSON

Read `references/workflows.md` for the ReactFlow export format.

### `issue <number>` — convert GitHub issue to remediation task

Fetch the issue with `gh issue view <number> --json number,title,body,labels,comments,url`,
then generate a remediation task with subtasks following the same plan format.
Can be appended to an existing DEVELOPMENT_PLAN.md or written as a standalone
REMEDIATION_PLAN.md.

### `implement` — kickoff the build

Print instructions for using the executor agent to build subtask-by-subtask,
then the verifier agent to validate. Remind the user to run verification
after the executor finishes.

---

## Core Methodology: Haiku-Executable Plans

The defining principle: **every subtask must contain complete, working code that
Claude Haiku can copy-paste and execute without interpretation.**

If you write `{placeholder}`, `// TODO`, or "implement the logic here" — it is
NOT Haiku-executable. Haiku treats each subtask independently and cannot infer
missing details from earlier context.

### What Haiku-Executable Looks Like

```markdown
**Subtask 1.1.1: Create configuration file**

**Complete Code:**

Create file `src/config.py`:
\`\`\`python
import os
from dataclasses import dataclass

@dataclass
class Config:
    api_key: str
    base_url: str = "https://api.example.com"
    timeout: int = 30

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            api_key=os.environ["API_KEY"],
            base_url=os.getenv("BASE_URL", "https://api.example.com"),
            timeout=int(os.getenv("TIMEOUT", "30")),
        )
\`\`\`

**Verification:**
\`\`\`bash
python -c "from config import Config; c = Config(api_key='test'); print(c.base_url)"
# Expected: https://api.example.com
\`\`\`
```

### Critical Rules (From Battle-Tested Experience)

1. **Repeat instructions per-subtask** — Haiku does not carry forward implicit
   instructions from earlier in the document. Include ALL required commands
   (git, verification, completion steps) explicitly in EVERY subtask.

2. **No TODO stubs** — Split large subtasks rather than leaving stubs. Verification
   must grep for TODO/FIXME and fail if any remain.

3. **Complete imports in every file** — Every code block must include all imports.
   Never assume a prior subtask's imports carry over.

4. **Test mocks must match production models** — Use model_construct() or inherit
   from real classes. Never hand-write mock dataclasses for Pydantic models.

5. **Verify integration, not just units** — Every subtask touching app state must
   also verify the wiring (lifespan, middleware, etc.) actually works at runtime.

6. **Large files need chunked strategy** — For files over 500 lines, subtasks must
   use grep to find target sections, read with offset/limit, and edit surgically.

7. **Subtask heading format matters** — Use `**Subtask X.Y.Z: Title**` (bold text),
   not `### Task X.Y` headings. Validators only recognize the bold format.

8. **3-7 deliverables per subtask** — Too few means the subtask is trivial (merge it).
   Too many means it's too large (split it).

---

## Workflow Summary

After planning is complete, explain this to the user:

### Phase 1: Build (Executor Agent)
```
Use the {project}-executor agent to execute subtask [X.Y.Z]
```

### Phase 2: Verify (Don't Skip!)
```
Use the {project}-verifier agent to validate against PROJECT_BRIEF.md
```

### Phase 3: Capture Lessons
Save any issues the verifier found as Nellie lessons for future projects.

---

## Reference Files

Load these as needed — do not load all at once:

- `references/templates.md` — Brief, plan, and CLAUDE.md templates for all 4 project types
- `references/validation.md` — Structural + Haiku-executability validation rules
- `references/agents.md` — Executor and verifier agent generation templates
- `references/workflows.md` — Mermaid and ReactFlow export formats
- `examples/hello-cli-plan.md` — Gold standard example plan (study this before generating any plan)
