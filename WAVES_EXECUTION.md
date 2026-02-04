# EntraAssessor - Parallel Execution Waves

This document defines how to execute the development plan in parallel waves to maximize throughput.

## Execution Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WAVE 1: Foundation (Sequential)                                         │
│ ┌─────────────────┐                                                     │
│ │ Phase 0         │ → Project setup, package structure, dev tools       │
│ └─────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ WAVE 2: Core Infrastructure (Sequential)                                │
│ ┌─────────────────┐                                                     │
│ │ Phase 1         │ → Models, Graph client, auth, database, helpers     │
│ └─────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ WAVE 3: Check Modules + Support (PARALLEL - 9 agents)                   │
│                                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │Phase 2  │ │Phase 3  │ │Phase 4  │ │Phase 5  │ │Phase 6  │            │
│ │Identity │ │Auth     │ │Apps     │ │Devices  │ │Exchange │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐                       │
│ │Phase 7  │ │Phase 8  │ │Phase 9  │ │Phase 10  │                       │
│ │M365     │ │Collab   │ │Reports  │ │Anonymize │                       │
│ └─────────┘ └─────────┘ └─────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ WAVE 4: Integration (Sequential)                                        │
│ ┌─────────────────┐                                                     │
│ │ Phase 11        │ → CLI commands, scanner orchestration, final tests  │
│ └─────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Wave Details

### Wave 1: Foundation (1 agent, ~2 hours)

**Execute sequentially** - creates project structure needed by all other phases.

```bash
# Single agent execution
Use the entra-assessor-executor agent to execute Phase 0
```

**Deliverables**:
- `.gitignore`, `LICENSE`, `README.md`
- Package structure (`entra_assessor/`, `tests/`)
- `pyproject.toml` with all dependencies
- Pre-commit hooks, CI/CD workflow
- CLI skeleton with `--version` and `--help`

**Verification before Wave 2**:
```bash
entra-assessor --version  # Should print 0.1.0
pytest tests/test_cli.py -v  # All tests pass
```

---

### Wave 2: Core Infrastructure (1 agent, ~3 hours)

**Execute sequentially** - creates shared modules used by all checks.

```bash
# Single agent execution
Use the entra-assessor-executor agent to execute Phase 1
```

**Deliverables**:
- `models.py` - Finding, CheckResult, ScanResult, TenantInfo, enums
- `client.py` - GraphClient with pagination, rate limiting
- `graph_helpers.py` - safe_get, parse_datetime utilities
- `auth.py` - MSAL interactive + service principal
- `database.py` - SQLite tenant tracking
- `powershell.py` - PowerShellExecutor for Exchange fallback
- `checks/base.py` - BaseCheck, CheckRegistry, @register_check

**Verification before Wave 3**:
```bash
python -c "from entra_assessor.models import Finding, Severity"
python -c "from entra_assessor.client import GraphClient"
python -c "from entra_assessor.checks.base import BaseCheck, CheckRegistry"
pytest tests/ -v  # All tests pass
```

---

### Wave 3: Parallel Modules (9 agents, ~4 hours total)

**Execute in parallel** - each phase is independent after Phase 1.

Launch all 9 agents simultaneously:

```bash
# Launch all Wave 3 agents in parallel
# Each agent works on one phase independently

# Agent 1: Identity Checks
Use the entra-assessor-executor agent to execute Phase 2 (in background)

# Agent 2: Authentication Checks
Use the entra-assessor-executor agent to execute Phase 3 (in background)

# Agent 3: Application Checks
Use the entra-assessor-executor agent to execute Phase 4 (in background)

# Agent 4: Devices & External Checks
Use the entra-assessor-executor agent to execute Phase 5 (in background)

# Agent 5: Exchange Checks
Use the entra-assessor-executor agent to execute Phase 6 (in background)

# Agent 6: M365 Checks
Use the entra-assessor-executor agent to execute Phase 7 (in background)

# Agent 7: Collaboration Checks
Use the entra-assessor-executor agent to execute Phase 8 (in background)

# Agent 8: Report Generator
Use the entra-assessor-executor agent to execute Phase 9 (in background)

# Agent 9: Anonymizer
Use the entra-assessor-executor agent to execute Phase 10 (in background)
```

#### Wave 3 Agent Assignments

| Agent | Phase | Modules Created | Est. Time |
|-------|-------|-----------------|-----------|
| 1 | Phase 2: Identity | `users.py`, `groups.py`, `roles.py` + tests | 45 min |
| 2 | Phase 3: Auth | `auth_methods.py`, `conditional_access.py`, `identity_protection.py` | 40 min |
| 3 | Phase 4: Apps | `applications.py` (app regs + service principals) | 25 min |
| 4 | Phase 5: Devices | `devices.py`, `external.py` | 25 min |
| 5 | Phase 6: Exchange | `dns.py`, `exchange.py` | 35 min |
| 6 | Phase 7: M365 | `licensing.py`, `audit.py` | 20 min |
| 7 | Phase 8: Collab | `sharepoint.py`, `teams.py` | 20 min |
| 8 | Phase 9: Reports | `generator.py`, `report.html.j2` | 30 min |
| 9 | Phase 10: Anon | `anonymizer.py`, `safety.py` | 25 min |

**Verification after Wave 3** (run after all agents complete):
```bash
# Verify all check modules load
python -c "from entra_assessor.checks import users, groups, roles"
python -c "from entra_assessor.checks import auth_methods, conditional_access"
python -c "from entra_assessor.checks import applications, devices, external"
python -c "from entra_assessor.checks import dns, exchange, licensing, audit"
python -c "from entra_assessor.checks import sharepoint, teams"
python -c "from entra_assessor.reports import ReportGenerator"
python -c "from entra_assessor.anonymizer import Anonymizer"

# Run all tests
pytest tests/ -v

# Check for import conflicts
python -c "from entra_assessor.checks.base import CheckRegistry; print(f'Registered: {len(CheckRegistry._checks)} checks')"
```

---

### Wave 4: Integration (1 agent, ~2 hours)

**Execute sequentially** - ties everything together.

```bash
# Single agent execution
Use the entra-assessor-executor agent to execute Phase 11
```

**Deliverables**:
- `scanner.py` - Orchestrates all checks
- Complete `cli.py` - All commands functional
- `checks/__init__.py` - Imports all check modules
- Integration tests
- Final verification

**Final Verification**:
```bash
# Full test suite
pytest tests/ -v --cov=entra_assessor --cov-report=term-missing

# Lint and type check
ruff check entra_assessor tests
mypy entra_assessor

# CLI smoke tests
entra-assessor --version
entra-assessor --help
entra-assessor scan --help
entra-assessor anonymize --help

# Verify all checks registered
python -c "
from entra_assessor.checks.base import CheckRegistry
from entra_assessor.checks import *  # Trigger registration
checks = CheckRegistry.get_all_checks()
print(f'Total checks: {len(checks)}')
for check in sorted(checks, key=lambda c: c.name):
    print(f'  - {check.name} ({check.category.value})')
"
```

---

## Time Estimates

| Wave | Duration | Parallelism | Cumulative |
|------|----------|-------------|------------|
| Wave 1 | 2 hours | 1 agent | 2 hours |
| Wave 2 | 3 hours | 1 agent | 5 hours |
| Wave 3 | 45 min* | 9 agents | 5.75 hours |
| Wave 4 | 2 hours | 1 agent | 7.75 hours |

*Wave 3 wall-clock time is the longest individual phase (~45 min), not sum of all phases.

**Sequential execution**: ~15 hours
**Parallel execution**: ~8 hours
**Speedup**: ~47% faster

---

## Claude Code Execution Commands

### Option A: Manual Wave Execution

Execute each wave manually, waiting for completion:

```bash
# Wave 1
claude -p "Execute all subtasks in plans/PHASE_0_FOUNDATION.md sequentially"

# Wait for completion, then Wave 2
claude -p "Execute all subtasks in plans/PHASE_1_CORE_INFRASTRUCTURE.md sequentially"

# Wait for completion, then Wave 3 (parallel)
claude -p "Execute phases 2-10 in parallel using background agents"

# Wait for all to complete, then Wave 4
claude -p "Execute all subtasks in plans/PHASE_11_CLI_INTEGRATION.md sequentially"
```

### Option B: Automated Wave Orchestration

Use this prompt to let Claude orchestrate the waves:

```
Execute the EntraAssessor development plan using the waves strategy defined in
plans/WAVES_EXECUTION.md.

For Wave 3, launch all 9 phase agents in parallel using background execution.
Wait for each wave to complete before starting the next.

After each wave, run the verification commands to ensure success before proceeding.
```

---

## Conflict Prevention

Since Wave 3 runs 9 agents in parallel, follow these rules to prevent conflicts:

### File Ownership by Phase

| Phase | Owns These Files (exclusive write access) |
|-------|-------------------------------------------|
| 2 | `checks/users.py`, `checks/groups.py`, `checks/roles.py`, `tests/test_users.py`, `tests/test_groups.py`, `tests/test_roles.py` |
| 3 | `checks/auth_methods.py`, `checks/conditional_access.py`, `checks/identity_protection.py`, `tests/test_auth_methods.py`, `tests/test_ca.py` |
| 4 | `checks/applications.py`, `tests/test_applications.py` |
| 5 | `checks/devices.py`, `checks/external.py`, `tests/test_devices.py`, `tests/test_external.py` |
| 6 | `checks/dns.py`, `checks/exchange.py`, `tests/test_dns.py`, `tests/test_exchange.py` |
| 7 | `checks/licensing.py`, `checks/audit.py`, `tests/test_licensing.py`, `tests/test_audit.py` |
| 8 | `checks/sharepoint.py`, `checks/teams.py`, `tests/test_sharepoint.py`, `tests/test_teams.py` |
| 9 | `reports/generator.py`, `reports/templates/report.html.j2`, `tests/test_reports.py` |
| 10 | `anonymizer.py`, `safety.py`, `tests/test_anonymizer.py`, `tests/test_safety.py` |

### Shared Files (Read-Only in Wave 3)

These files are created in Waves 1-2 and should NOT be modified in Wave 3:
- `models.py`
- `client.py`
- `auth.py`
- `database.py`
- `checks/base.py`
- `graph_helpers.py`

### Wave 4 Consolidation

Phase 11 is responsible for:
- Updating `checks/__init__.py` to import all check modules
- Updating `entra_assessor/__init__.py` with exports
- Creating `scanner.py` that uses all checks
- Final `cli.py` updates

---

## Rollback Strategy

If a Wave 3 agent fails:

1. **Isolate the failure** - Other agents can continue
2. **Review the error** - Check the agent's output
3. **Retry the phase** - Re-run just the failed phase
4. **Continue to Wave 4** - Once all Wave 3 agents succeed

```bash
# Example: Phase 6 (Exchange) failed, retry it
Use the entra-assessor-executor agent to execute Phase 6

# After retry succeeds, continue with Wave 4
Use the entra-assessor-executor agent to execute Phase 11
```

---

## Summary

```
                    ┌─────────────┐
                    │   Wave 1    │  (2 hrs)
                    │   Phase 0   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Wave 2    │  (3 hrs)
                    │   Phase 1   │
                    └──────┬──────┘
                           │
    ┌────┬────┬────┬────┬──▼──┬────┬────┬────┬────┐
    │ P2 │ P3 │ P4 │ P5 │ P6  │ P7 │ P8 │ P9 │P10 │  Wave 3 (45 min)
    └────┴────┴────┴────┴──┬──┴────┴────┴────┴────┘
                           │
                    ┌──────▼──────┐
                    │   Wave 4    │  (2 hrs)
                    │   Phase 11  │
                    └─────────────┘

Total: ~8 hours (vs ~15 hours sequential)
```

---

*Part of [DEVELOPMENT_PLAN.md](/home/mike/github/Sharingiscaring/EntraAssessor/DEVELOPMENT_PLAN.md)*
