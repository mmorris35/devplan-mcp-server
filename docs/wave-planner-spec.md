# Wave Planner Enhancement Specification

## Problem Statement

When DevPlan generates task breakdowns that get executed by parallel agents within a wave, those agents may modify the same files simultaneously, causing merge conflicts. Currently, wave planning is ad-hoc (Opus generates waves on-the-fly), with no formal analysis of file dependencies or ownership.

**Result:** Parallel agents create merge debt that requires manual conflict resolution, negating the productivity gains of parallelization.

## Proposed Solution

Add a **Wave Planner** capability to DevPlan MCP that:

1. Analyzes task-to-file dependencies
2. Assigns file ownership to prevent parallel contention
3. Generates orchestrated wave plans with explicit constraints

## New MCP Tool: `plan_waves`

### Input Schema

```json
{
  "project_root": "/path/to/project",
  "tasks": [
    {
      "id": "task-1",
      "description": "Implement UCAN types",
      "likely_files": ["src/ucan_types.rs", "src/lib.rs", "Cargo.toml"]
    },
    {
      "id": "task-2", 
      "description": "Implement Session validation",
      "likely_files": ["src/worldspace_manager.rs", "src/lib.rs"]
    }
  ],
  "max_parallel_agents": 4,
  "conflict_strategy": "sequence" | "partition" | "delegate"
}
```

### Output Schema

```json
{
  "waves": [
    {
      "wave_id": "wave-1",
      "parallel_agents": [
        {
          "agent_id": "agent-1a",
          "task_ids": ["task-1"],
          "owned_files": ["src/ucan_types.rs", "Cargo.toml"],
          "shared_files_locked": ["src/lib.rs"]
        }
      ],
      "sequential_agents": [
        {
          "agent_id": "agent-1b",
          "task_ids": ["task-2"],
          "depends_on": ["agent-1a"],
          "reason": "Both touch src/lib.rs"
        }
      ]
    }
  ],
  "file_ownership_map": {
    "src/lib.rs": { "strategy": "sequential", "order": ["agent-1a", "agent-1b"] },
    "src/ucan_types.rs": { "strategy": "exclusive", "owner": "agent-1a" },
    "Cargo.toml": { "strategy": "exclusive", "owner": "agent-1a" }
  },
  "conflict_risks": [
    {
      "files": ["src/lib.rs"],
      "agents": ["agent-1a", "agent-1b"],
      "mitigation": "Sequenced execution"
    }
  ]
}
```

## Conflict Strategies

### 1. `sequence` (Default)
Tasks touching shared files run sequentially, not in parallel. Safest, potentially slower.

### 2. `partition`
Split shared files into sections if possible (e.g., different functions in same module). Requires semantic understanding.

### 3. `delegate`
Flag conflicts and delegate resolution to a human or integration agent. Fastest parallel execution, deferred merge cost.

## Implementation Approach

### Phase 1: Static Analysis
- Parse task descriptions to infer likely file touches
- Use AST analysis or file pattern matching
- Build file dependency graph

### Phase 2: Opus-Assisted Planning
- For ambiguous tasks, call Opus with:
  ```
  Given this task: "{description}"
  And this file tree: {tree}
  Which files will likely be created or modified?
  ```
- Cache results for similar task patterns

### Phase 3: Orchestration Output
- Generate wave plan with explicit file ownership
- Output as structured JSON for agent spawners
- Include human-readable summary

## Integration Points

### DevPlan Workflow
```
devplan.analyze_project()
    → devplan.generate_tasks()
    → devplan.plan_waves(tasks, conflict_strategy="sequence")  # NEW
    → Agent spawner reads wave plan
    → Parallel agents execute with file ownership constraints
```

### MESH Integration (Future)
Wave plans can feed into MESH orchestrator for distributed agent coordination across nodes.

## Success Criteria

1. Zero merge conflicts when following wave plan
2. Parallel execution where file dependencies allow
3. Clear ownership prevents "who changed this?" confusion
4. Audit trail of which agent owns which files

## Open Questions

1. How granular should file ownership be? (file-level vs function-level)
2. Should we support optimistic locking (detect conflicts early) vs pessimistic (prevent parallel access)?
3. How to handle dynamically created files not in initial analysis?

---

*Spec authored: 2026-02-07*
*Related: g-hive Wave 3.4.2 merge conflicts, MESH orchestration design*
