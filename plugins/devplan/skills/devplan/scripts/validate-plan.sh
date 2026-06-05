#!/usr/bin/env bash
# Structural validation for DEVELOPMENT_PLAN.md
# Usage: bash validate-plan.sh [path/to/DEVELOPMENT_PLAN.md]

set -uo pipefail

PLAN="${1:-DEVELOPMENT_PLAN.md}"
ERRORS=0
WARNINGS=0

if [[ ! -f "$PLAN" ]]; then
  echo "FAIL: $PLAN not found"
  exit 1
fi

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  WARN: $1"; WARNINGS=$((WARNINGS + 1)); }

echo "=== Structural Validation: $PLAN ==="
echo ""

# Header checks
echo "--- Header ---"
grep -q '^# DEVELOPMENT_PLAN' "$PLAN" && pass "Plan title present" || fail "Missing plan title"
grep -q 'Haiku-Executable' "$PLAN" && pass "Haiku-executable marker" || warn "Missing Haiku-executable marker"
grep -q '## Project Summary' "$PLAN" && pass "Project Summary section" || fail "Missing Project Summary"
grep -q '## Phase Overview' "$PLAN" && pass "Phase Overview section" || fail "Missing Phase Overview"

echo ""
echo "--- Counts ---"

PHASES=$(grep -c '^# Phase' "$PLAN" 2>/dev/null || echo 0)
TASKS=$(grep -c '^## Task' "$PLAN" 2>/dev/null || echo 0)
SUBTASKS=$(grep -c '^\*\*Subtask [0-9]' "$PLAN" 2>/dev/null || echo 0)
CODE_BLOCKS=$(grep -c '^```' "$PLAN" 2>/dev/null || echo 0)
CODE_BLOCKS=$((CODE_BLOCKS / 2))

echo "  Phases: $PHASES"
echo "  Tasks: $TASKS"
echo "  Subtasks: $SUBTASKS"
echo "  Code blocks: $CODE_BLOCKS"

[[ "$PHASES" -gt 0 ]] && pass "At least one phase" || fail "No phases found"
[[ "$TASKS" -gt 0 ]] && pass "At least one task" || fail "No tasks found"
[[ "$SUBTASKS" -gt 0 ]] && pass "At least one subtask" || fail "No subtasks found (use **Subtask X.Y.Z:** format)"

echo ""
echo "--- Per-Subtask Checks ---"

SUBTASK_IDS=$(grep -oP '(?<=\*\*Subtask )[0-9]+\.[0-9]+\.[0-9]+' "$PLAN" 2>/dev/null || true)

for sid in $SUBTASK_IDS; do
  # Extract subtask block (from **Subtask X.Y.Z to next **Subtask or ## Task or # Phase)
  HAS_DELIVERABLES=$(sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" | grep -c 'Deliverables' 2>/dev/null || echo 0)
  HAS_CODE=$(sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" | grep -c '```' 2>/dev/null || echo 0)
  HAS_VERIFY=$(sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" | grep -c 'Verification' 2>/dev/null || echo 0)
  HAS_SUCCESS=$(sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" | grep -c 'Success Criteria' 2>/dev/null || echo 0)
  HAS_NOTES=$(sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" | grep -c 'Completion Notes' 2>/dev/null || echo 0)

  ISSUES=""
  [[ "$HAS_DELIVERABLES" -eq 0 ]] && ISSUES="$ISSUES deliverables"
  [[ "$HAS_CODE" -lt 2 ]] && ISSUES="$ISSUES code-blocks"
  [[ "$HAS_VERIFY" -eq 0 ]] && ISSUES="$ISSUES verification"
  [[ "$HAS_SUCCESS" -eq 0 ]] && ISSUES="$ISSUES success-criteria"
  [[ "$HAS_NOTES" -eq 0 ]] && ISSUES="$ISSUES completion-notes"

  if [[ -z "$ISSUES" ]]; then
    pass "Subtask $sid: all sections present"
  else
    fail "Subtask $sid: missing:$ISSUES"
  fi
done

echo ""
echo "--- Quality Checks ---"

# Check for TODOs in code blocks
TODOS=$(grep -n 'TODO\|FIXME\|placeholder\|fill in later\|implement this' "$PLAN" 2>/dev/null | grep -v '^#\|Completion Notes\|filled by executor' | wc -l || echo 0)
[[ "$TODOS" -eq 0 ]] && pass "No TODO/placeholder text in code" || warn "Found $TODOS potential TODO/placeholder lines"

# Check for squash merge sections
MERGE_SECTIONS=$(grep -c 'Squash Merge' "$PLAN" 2>/dev/null || echo 0)
[[ "$MERGE_SECTIONS" -ge "$TASKS" ]] && pass "Squash merge sections ($MERGE_SECTIONS >= $TASKS tasks)" || warn "Missing squash merge sections ($MERGE_SECTIONS < $TASKS tasks)"

# Check for project complete checklist
grep -q 'Project Complete' "$PLAN" && pass "Project Complete checklist" || warn "Missing Project Complete checklist"

echo ""
echo "=== Results ==="
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [[ "$ERRORS" -gt 0 ]]; then
  echo "  VERDICT: FAIL"
  exit 1
elif [[ "$WARNINGS" -gt 0 ]]; then
  echo "  VERDICT: PASS (with warnings)"
  exit 0
else
  echo "  VERDICT: PASS"
  exit 0
fi
