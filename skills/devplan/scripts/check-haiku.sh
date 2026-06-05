#!/usr/bin/env bash
# Haiku-executability checker for DEVELOPMENT_PLAN.md
# Checks that every subtask has complete, copy-pasteable code.
# Usage: bash check-haiku.sh [path/to/DEVELOPMENT_PLAN.md]

set -uo pipefail

PLAN="${1:-DEVELOPMENT_PLAN.md}"
ERRORS=0
WARNINGS=0
CHECKED=0
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

if [[ ! -f "$PLAN" ]]; then
  echo "FAIL: $PLAN not found"
  exit 1
fi

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  WARN: $1"; WARNINGS=$((WARNINGS + 1)); }

echo "=== Haiku-Executability Check: $PLAN ==="
echo ""

SUBTASK_IDS=$(grep -oP '(?<=\*\*Subtask )[0-9]+\.[0-9]+\.[0-9]+' "$PLAN" 2>/dev/null || true)

if [[ -z "$SUBTASK_IDS" ]]; then
  fail "No subtasks found (must use **Subtask X.Y.Z:** format, not ### heading format)"
  echo ""
  echo "=== Results ==="
  echo "  Subtasks checked: 0"
  echo "  VERDICT: FAIL (nothing to validate)"
  exit 1
fi

for sid in $SUBTASK_IDS; do
  CHECKED=$((CHECKED + 1))
  echo "--- Subtask $sid ---"

  # Extract subtask block to temp file
  BLOCK_FILE="$TMPDIR/block_$sid"
  sed -n "/\*\*Subtask $sid/,/\(\*\*Subtask [0-9]\|^## Task\|^# Phase\|^# Project\)/p" "$PLAN" > "$BLOCK_FILE" 2>/dev/null || true

  # Check for file path references in deliverables
  FILE_COUNT=$(grep -oP '`[a-zA-Z0-9_./-]+\.[a-zA-Z]+`' "$BLOCK_FILE" 2>/dev/null | sort -u | wc -l | tr -d ' ')

  if [[ "$FILE_COUNT" -gt 0 ]]; then
    pass "$sid: $FILE_COUNT file references found"
  else
    warn "$sid: No file path references in deliverables"
  fi

  # Check for code blocks
  FENCE_COUNT=$(grep -c '```' "$BLOCK_FILE" 2>/dev/null || true)
  FENCE_COUNT=${FENCE_COUNT:-0}
  CODE_BLOCK_COUNT=$((FENCE_COUNT / 2))

  if [[ "$CODE_BLOCK_COUNT" -gt 0 ]]; then
    pass "$sid: $CODE_BLOCK_COUNT code blocks"
  else
    fail "$sid: No code blocks found — NOT Haiku-executable"
  fi

  # Extract code block content to temp file
  CODE_FILE="$TMPDIR/code_$sid"
  sed -n '/^```/,/^```/p' "$BLOCK_FILE" > "$CODE_FILE" 2>/dev/null || true

  # Check for placeholder patterns in code blocks
  PH_COUNT=$(grep -ciE '\{placeholder\}|# ?TODO|// ?TODO|# implement|// implement|\.\.\..*implement' "$CODE_FILE" 2>/dev/null || true)
  PH_COUNT=${PH_COUNT:-0}
  PASS_COUNT=$(grep -cE '^\s*pass\s*$' "$CODE_FILE" 2>/dev/null || true)
  PASS_COUNT=${PASS_COUNT:-0}
  TOTAL_PH=$((PH_COUNT + PASS_COUNT))

  if [[ "$TOTAL_PH" -eq 0 ]]; then
    pass "$sid: No placeholders in code"
  else
    fail "$sid: Found $TOTAL_PH placeholder/TODO patterns in code blocks"
  fi

  # Check for import statements (language-agnostic)
  IMPORT_COUNT=$(grep -ciE '^import |^from .+ import|^const .+ = require|^use |^#include' "$CODE_FILE" 2>/dev/null || true)
  IMPORT_COUNT=${IMPORT_COUNT:-0}

  if [[ "$CODE_BLOCK_COUNT" -gt 0 && "$IMPORT_COUNT" -eq 0 ]]; then
    warn "$sid: Code blocks have no import statements (may be config files — verify manually)"
  fi

  # Check for verification section with expected output
  EXPECTED_COUNT=$(grep -c '# Expected' "$BLOCK_FILE" 2>/dev/null || true)
  EXPECTED_COUNT=${EXPECTED_COUNT:-0}

  if [[ "$EXPECTED_COUNT" -gt 0 ]]; then
    pass "$sid: Verification has expected output ($EXPECTED_COUNT)"
  else
    warn "$sid: Verification commands may be missing expected output comments"
  fi

  echo ""
done

echo "=== Results ==="
echo "  Subtasks checked: $CHECKED"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"

if [[ "$CHECKED" -eq 0 ]]; then
  echo "  VERDICT: FAIL (0 subtasks checked — wrong heading format?)"
  exit 1
elif [[ "$ERRORS" -gt 0 ]]; then
  echo "  VERDICT: FAIL ($ERRORS errors)"
  exit 1
elif [[ "$WARNINGS" -gt 0 ]]; then
  echo "  VERDICT: PASS (with $WARNINGS warnings)"
  exit 0
else
  echo "  VERDICT: PASS"
  exit 0
fi
