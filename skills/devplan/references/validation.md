# DevPlan Validation Rules

Two levels of validation: **structural** (does the plan have the right sections?)
and **Haiku-executable** (can Haiku execute it mechanically?).

---

## Structural Validation

Check that the plan contains all required sections. Report each as PASS/FAIL.

### Required Sections

| Section | Check |
|---------|-------|
| Project Summary | Has name, goal, phase/task/subtask counts |
| Phase Overview | Table with phase names, task counts, status |
| At least one Phase | `# Phase N:` heading exists |
| At least one Task | `## Task N.N:` heading exists |
| At least one Subtask | `**Subtask N.N.N:` bold marker exists |
| Git workflow | Squash merge instructions per task |
| Project Complete | Final checklist at end |

### Per-Subtask Required Sections

Each `**Subtask X.Y.Z:**` must contain:

| Section | Check |
|---------|-------|
| Prerequisites | Lists prior subtask dependencies |
| Deliverables | Checkboxed list of file paths |
| Complete Code | At least one fenced code block |
| Verification | Bash commands with expected output |
| Success Criteria | Checkboxed list of testable conditions |
| Completion Notes | Template fields for executor to fill |

### Per-Task Required Sections

Each `## Task X.Y:` must contain:

| Section | Check |
|---------|-------|
| Branch name | `**Branch:** \`feature/X-Y-name\`` |
| Squash merge | Commands for merge, commit, branch delete |
| Task checklist | All subtasks listed + verification + merge checks |

### Structural Validation Script

To validate structure, grep for these markers:

```bash
# Phase count
grep -c '^# Phase' DEVELOPMENT_PLAN.md

# Task count
grep -c '^## Task' DEVELOPMENT_PLAN.md

# Subtask count (bold format only — headings don't count!)
grep -c '^\*\*Subtask [0-9]' DEVELOPMENT_PLAN.md

# Check each subtask has required sections
for id in $(grep -oP '(?<=\*\*Subtask )[0-9]+\.[0-9]+\.[0-9]+' DEVELOPMENT_PLAN.md); do
  echo "=== Subtask $id ==="
  # These should all return matches:
  grep -c "Prerequisites" DEVELOPMENT_PLAN.md
  grep -c "Deliverables" DEVELOPMENT_PLAN.md
  grep -c "Verification" DEVELOPMENT_PLAN.md
  grep -c "Success Criteria" DEVELOPMENT_PLAN.md
  grep -c "Completion Notes" DEVELOPMENT_PLAN.md
done
```

---

## Haiku-Executability Validation

The harder check. A plan is Haiku-executable when Claude Haiku can implement
every subtask by mechanically following the instructions — no inference, no
context from other subtasks, no domain knowledge required.

### Code Block Rules

1. **Every deliverable file MUST have a complete code block**
   - FAIL: "Create `src/config.py` with the configuration class"
   - PASS: "Create `src/config.py`:" followed by complete code in a fenced block

2. **All imports must be present in every code block**
   - FAIL: Code that assumes imports from a previous subtask
   - PASS: Every file's code block starts with all necessary imports

3. **No placeholders or TODOs**
   - FAIL: `{placeholder}`, `// TODO`, `# implement this`, `pass  # fill in later`
   - PASS: Working code that does what it claims
   - Verification: `grep -rn 'TODO\|FIXME\|placeholder\|fill in\|implement this'`

4. **No "Add to existing file" without context**
   - FAIL: "Add this method to `src/app.py`"
   - PASS: Either show the complete file, OR show the exact insertion point with
     surrounding lines for context (before/after blocks)

5. **File paths must be explicit**
   - FAIL: "Create the model file"
   - PASS: "Create file `src/models/user.py`:"

### Verification Rules

1. **Every subtask has verification commands**
   - Must be bash commands that can be copy-pasted
   - Must include expected output as comments

2. **Verification must prove the code works, not just exists**
   - FAIL: `ls src/config.py` (proves file exists, not that it works)
   - PASS: `python -c "from config import Config; print(Config().base_url)"` + expected output

3. **Test verification must show pass count**
   - FAIL: `pytest` (no expected output)
   - PASS: `pytest tests/ -v` + `# Expected: X passed`

### Self-Containment Rules

1. **Each subtask is independently executable**
   - Haiku will not remember instructions from the plan header or other subtasks
   - If a subtask needs git commands, include them explicitly
   - If a subtask needs to run tests, include the full command

2. **Test files must be self-contained**
   - All fixtures defined in the test file or conftest.py (which must be a deliverable)
   - No references to external test data without creating it
   - Mock objects must match production interfaces exactly

3. **Dependencies between subtasks use prerequisites only**
   - Prerequisites list which subtasks must be done first
   - But the subtask itself must not require reading the prior subtask's code blocks

---

## Battle-Tested Rules (From Production Failures)

These rules come from real failures in production plan execution. Each one caused
a plan to fail when executed by Haiku. Treat them as hard requirements.

### CRITICAL: Implicit Instructions Not Repeated Per-Subtask

**Failure**: Haiku agent does not remember instructions from earlier in the
document. A plan said "always run tests after each subtask" in the header,
but Haiku only read the individual subtask and never saw that instruction.

**Rule**: Include ALL required commands (git, checkpoints, verification)
explicitly in EVERY task completion section. Never say "do X" once at the
top and expect it to be remembered.

### CRITICAL: Large File Editing Without Chunked Strategy

**Failure**: Executor tried to read a 17,000-line file into context, exceeded
the context window, and couldn't make targeted edits.

**Rule**: For files over 500 lines, subtasks must include a Large File Protocol:
1. NEVER read the entire file — use grep to find target sections
2. Read with offset/limit to view 50-100 line chunks
3. Edit for surgical changes only
4. Verify edits with targeted grep after each change
5. For bulk changes, process in batches of 5-10 matches

### CRITICAL: App State Contract Mismatch

**Failure**: Auth middleware read `app.state` attributes that were never set
in `lifespan()`, causing every authenticated request to crash at runtime.

**Rule**: Every subtask that reads shared state (app.state, context, globals)
must also verify/update the initialization code. Add an integration test that
actually starts the app and hits the endpoint.

### CRITICAL: TODO Stubs in Critical Code

**Failure**: Pipeline orchestrator left TODO stubs for audit logging, redaction,
and response DLP — the three most critical features. Tests passed because they
only checked the skeleton.

**Rule**: Split large subtasks rather than leaving stubs. Verification MUST
include `grep -rn 'TODO\|FIXME' src/` and fail if any remain.

### WARNING: Test Mock Interface Drift

**Failure**: Test mocks used different field names than production Pydantic
models. Tests passed with wrong assertions while production code would crash.

**Rule**: Test mocks must either inherit from the real model class or use
`model_construct()`. Never hand-write mock dataclasses for Pydantic models.

### WARNING: Haiku Validator 0-Subtask Pass

**Failure**: Validator reported PASS but "Subtasks Checked: 0" because the
plan used `### Task X.Y` headings instead of `**Subtask X.Y.Z:**` bold markers.

**Rule**: Always use `**Subtask X.Y.Z: Title**` format (bold, three-level ID).
After validation, confirm the subtask count is > 0. A pass with 0 checks is
a false positive.

### WARNING: Generic Scaffold Shipped as Plan

**Failure**: A scaffold with placeholder text and empty code blocks was treated
as a finished plan. Haiku executed it and produced empty files.

**Rule**: The scaffold from `devplan plan` is a starting point only. You MUST
enhance it with complete, project-specific code before it's Haiku-executable.
Study the HelloCLI example in `examples/hello-cli-plan.md` for the quality bar.

### WARNING: Python Scaffold for Non-Python Project

**Failure**: Plan generated Python/Click patterns for a project that specified
PowerShell as the primary language.

**Rule**: Match the tech stack to what the brief specifies. If the brief says
PowerShell, use .ps1/.psm1/Pester. If it says Rust, use Cargo/clippy. Never
default to Python.

---

## Validation Checklist (Copy-Paste for Quick Check)

```markdown
## Plan Validation Results

### Structural
- [ ] Project Summary table present
- [ ] Phase Overview table present
- [ ] Subtask count matches plan: expected {N}, found {N}
- [ ] All subtasks have Prerequisites section
- [ ] All subtasks have Deliverables section
- [ ] All subtasks have Complete Code section
- [ ] All subtasks have Verification section
- [ ] All subtasks have Success Criteria section
- [ ] All subtasks have Completion Notes template
- [ ] All tasks have Branch name
- [ ] All tasks have Squash Merge section
- [ ] Project Complete checklist present

### Haiku-Executability
- [ ] All deliverable files have complete code blocks
- [ ] All code blocks include imports
- [ ] No TODO/FIXME/placeholder text found
- [ ] All verification commands have expected output
- [ ] Each subtask is self-contained (no implicit dependencies)
- [ ] Test files are self-contained (fixtures included)
- [ ] Large file edits use chunked strategy
- [ ] Subtask headings use **Subtask X.Y.Z:** format
- [ ] Tech stack matches what brief specifies

### Counts
- Phases: {N}
- Tasks: {N}
- Subtasks: {N}
- Code blocks: {N}
- Verification blocks: {N}
```
