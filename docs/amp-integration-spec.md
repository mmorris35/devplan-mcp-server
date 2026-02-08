# DevPlan + AMP Integration Specification

## Executive Summary

DevPlan MCP gains persistent agent memory through AMP (Agent Memory Protocol) integration. **Memory is client-side by default** — the Cloudflare Worker remains stateless. Users who want persistence run their own AMP endpoint (Nellie or compatible).

**Cost impact to DevPlan hosting: $0**

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     User's Environment                            │
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐ │
│  │ Claude Code │────▶│ DevPlan MCP │────▶│ Local AMP (Nellie)  │ │
│  │   Agent     │     │  (CF Worker)│     │ localhost:8765      │ │
│  └─────────────┘     └─────────────┘     └─────────────────────┘ │
│                             │                      │              │
│                             │              ┌───────▼───────┐      │
│                             │              │ SQLite/Storage│      │
│                             │              │ (User's disk) │      │
│                             │              └───────────────┘      │
│                             │                                     │
│                    Optional │ MESH Federation                     │
│                             ▼                                     │
│                    ┌─────────────────┐                           │
│                    │ Community AMP   │                           │
│                    │ Relay Nodes     │                           │
│                    └─────────────────┘                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Config Schema

### User Configuration File

Location: `~/.devplan/config.yaml` (or `~/.config/devplan/config.yaml`)

```yaml
# DevPlan Configuration
version: 1

# AMP (Agent Memory Protocol) settings
amp:
  # Enable/disable AMP integration
  enabled: true
  
  # AMP endpoint URL
  # Options:
  #   - "local" (default) → http://localhost:8765
  #   - "http://localhost:8765" → explicit local
  #   - "https://amp.example.com" → remote/community node
  #   - "none" → disable persistence entirely
  endpoint: "local"
  
  # Authentication (if remote endpoint requires it)
  auth:
    # "none" | "bearer" | "api_key"
    type: "none"
    # Token/key value (use env var reference for security)
    token: "${DEVPLAN_AMP_TOKEN}"
  
  # Agent identity for AMP
  agent_id: "devplan"
  
  # What to persist
  persist:
    # Project plans and context
    plans: true
    # Lessons learned during development
    lessons: true
    # Wave execution history
    wave_history: true
    # File dependency graphs (for wave planner)
    file_graphs: true
  
  # Sync settings
  sync:
    # Sync on every operation vs batch
    mode: "immediate"  # "immediate" | "batch"
    # Batch interval (if mode=batch)
    batch_interval_seconds: 30
    # Retry failed syncs
    retry_count: 3
    retry_delay_seconds: 5

# MESH Federation (optional)
mesh:
  # Enable peer discovery
  enabled: false
  
  # Discovery methods
  discovery:
    # mDNS for local network peers
    mdns: true
    # Bootstrap nodes for internet peers
    bootstrap_nodes:
      - "https://mesh.devplanmcp.store/bootstrap"
  
  # What to share with peers
  share:
    # Share anonymous usage patterns (helps community)
    usage_patterns: false
    # Share lessons (opt-in knowledge sharing)
    lessons: false

# Fallback behavior when AMP unavailable
fallback:
  # "error" | "warn" | "silent"
  on_amp_unavailable: "warn"
  # Continue without persistence
  continue_without_amp: true
```

### Environment Variables

```bash
# Override config file settings
export DEVPLAN_AMP_ENDPOINT="http://localhost:8765"
export DEVPLAN_AMP_TOKEN="your-token-here"
export DEVPLAN_AMP_ENABLED="true"

# Quick disable (useful for CI/testing)
export DEVPLAN_AMP_ENABLED="false"
```

---

## AMP Protocol Interface

DevPlan talks to AMP via HTTP REST. Any AMP-compatible server must implement:

### Required Endpoints

```
POST /mcp/invoke
Content-Type: application/json

{
  "name": "<tool_name>",
  "arguments": { ... }
}
```

### Required Tools

| Tool | Purpose | Arguments |
|------|---------|-----------|
| `add_checkpoint` | Save agent state | `agent`, `working_on`, `state` |
| `get_recent_checkpoints` | Retrieve state | `agent`, `limit` |
| `add_lesson` | Record learning | `title`, `content`, `tags`, `severity` |
| `search_lessons` | Find relevant lessons | `query`, `limit` |
| `get_agent_status` | Check agent state | `agent` |

### DevPlan-Specific Tools (Extended AMP)

| Tool | Purpose | Arguments |
|------|---------|-----------|
| `save_plan` | Persist project plan | `project_id`, `plan_yaml`, `metadata` |
| `get_plan` | Retrieve project plan | `project_id` |
| `list_plans` | List all plans | `limit`, `offset` |
| `save_wave_result` | Record wave execution | `project_id`, `wave_id`, `result`, `files_touched` |
| `get_wave_history` | Get execution history | `project_id`, `limit` |
| `save_file_graph` | Store file dependencies | `project_id`, `graph` |
| `get_file_graph` | Retrieve for wave planning | `project_id` |

---

## Nellie Compatibility

Nellie already implements core AMP. For full DevPlan support, add:

### New Nellie Tools

```rust
// In nellie-rs/src/tools/devplan.rs

/// Save a DevPlan project plan
pub async fn save_plan(
    project_id: String,
    plan_yaml: String,
    metadata: HashMap<String, Value>,
) -> Result<PlanRecord>;

/// Get a project plan
pub async fn get_plan(project_id: String) -> Result<Option<PlanRecord>>;

/// Save wave execution result
pub async fn save_wave_result(
    project_id: String,
    wave_id: String,
    result: WaveResult,
    files_touched: Vec<String>,
) -> Result<WaveRecord>;

/// Get file dependency graph for wave planning
pub async fn get_file_graph(project_id: String) -> Result<Option<FileGraph>>;

/// Save file dependency graph
pub async fn save_file_graph(
    project_id: String,
    graph: FileGraph,
) -> Result<()>;
```

### Database Schema Extensions

```sql
-- Plans table
CREATE TABLE devplan_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    plan_yaml TEXT NOT NULL,
    metadata TEXT,  -- JSON
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Wave execution history
CREATE TABLE devplan_waves (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    wave_id TEXT NOT NULL,
    status TEXT NOT NULL,  -- success/failed/partial
    files_touched TEXT,    -- JSON array
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT
);

-- File dependency graphs
CREATE TABLE devplan_file_graphs (
    project_id TEXT PRIMARY KEY,
    graph TEXT NOT NULL,   -- JSON
    updated_at TEXT NOT NULL
);

-- Index for queries
CREATE INDEX idx_plans_project ON devplan_plans(project_id);
CREATE INDEX idx_waves_project ON devplan_waves(project_id);
```

---

## DevPlan MCP Worker Changes

### Initialization Flow

```typescript
// In CF Worker startup
async function initializeAmp(config: DevPlanConfig): Promise<AmpClient | null> {
  if (!config.amp.enabled) {
    console.log("AMP disabled, running stateless");
    return null;
  }

  const endpoint = resolveEndpoint(config.amp.endpoint);
  
  try {
    const client = new AmpClient(endpoint, config.amp.auth);
    await client.healthCheck();
    console.log(`AMP connected: ${endpoint}`);
    return client;
  } catch (error) {
    if (config.fallback.continue_without_amp) {
      console.warn(`AMP unavailable (${endpoint}), continuing stateless`);
      return null;
    }
    throw new Error(`AMP required but unavailable: ${error}`);
  }
}

function resolveEndpoint(endpoint: string): string {
  if (endpoint === "local") return "http://localhost:8765";
  if (endpoint === "none") return null;
  return endpoint;
}
```

### Tool Wrappers

```typescript
// Wrap DevPlan tools with AMP persistence
class DevPlanWithAmp {
  constructor(private amp: AmpClient | null) {}

  async analyzePlan(projectPath: string): Promise<PlanAnalysis> {
    const analysis = await coreAnalyzePlan(projectPath);
    
    // Persist if AMP available
    if (this.amp) {
      await this.amp.invoke("save_plan", {
        project_id: analysis.projectId,
        plan_yaml: analysis.planYaml,
        metadata: { analyzed_at: new Date().toISOString() }
      });
    }
    
    return analysis;
  }

  async generateWaves(plan: Plan): Promise<WavePlan> {
    // Check for cached file graph
    let fileGraph = null;
    if (this.amp) {
      fileGraph = await this.amp.invoke("get_file_graph", {
        project_id: plan.projectId
      });
    }

    const waves = await coreGenerateWaves(plan, fileGraph);
    
    // Persist updated file graph
    if (this.amp && waves.fileGraph) {
      await this.amp.invoke("save_file_graph", {
        project_id: plan.projectId,
        graph: waves.fileGraph
      });
    }
    
    return waves;
  }

  async recordWaveResult(result: WaveResult): Promise<void> {
    if (this.amp) {
      await this.amp.invoke("save_wave_result", {
        project_id: result.projectId,
        wave_id: result.waveId,
        result: result.status,
        files_touched: result.filesTouched
      });
      
      // Also record as checkpoint
      await this.amp.invoke("add_checkpoint", {
        agent: "devplan",
        working_on: `Wave ${result.waveId}: ${result.status}`,
        state: { wave: result }
      });
    }
  }

  async searchRelevantLessons(query: string): Promise<Lesson[]> {
    if (!this.amp) return [];
    
    const result = await this.amp.invoke("search_lessons", {
      query,
      limit: 5
    });
    
    return result.lessons || [];
  }

  async recordLesson(lesson: Lesson): Promise<void> {
    if (this.amp) {
      await this.amp.invoke("add_lesson", {
        title: lesson.title,
        content: lesson.content,
        tags: [...lesson.tags, "devplan"],
        severity: lesson.severity || "info"
      });
    }
  }
}
```

---

## User Experience

### First Run (No AMP)

```
$ devplan analyze ./my-project

⚠️  AMP not configured. DevPlan will run without persistence.
    For persistent memory across sessions, run:
    
    # Install Nellie (local AMP)
    cargo install nellie
    nellie serve &
    
    # Configure DevPlan
    devplan config set amp.endpoint local

Analyzing project...
```

### With Local AMP

```
$ nellie serve &
[nellie] Listening on http://localhost:8765

$ devplan analyze ./my-project

✓ Connected to AMP (localhost:8765)
✓ Found 3 relevant lessons from previous projects
✓ Loaded file graph from last session

Analyzing project...
[Lesson applied: "Always check for merge conflicts in shared files"]
```

### With Community AMP

```
$ devplan config set amp.endpoint https://amp.community-node.org
$ devplan config set amp.auth.type bearer
$ devplan config set amp.auth.token ${COMMUNITY_AMP_TOKEN}

$ devplan analyze ./my-project

✓ Connected to AMP (amp.community-node.org)
✓ Syncing with 12 federated peers...
```

---

## CLI Commands

```bash
# Configuration
devplan config get amp                    # Show AMP config
devplan config set amp.endpoint local     # Set endpoint
devplan config set amp.enabled false      # Disable AMP

# AMP status
devplan amp status                        # Check AMP connection
devplan amp sync                          # Force sync
devplan amp export ./backup.json          # Export all data
devplan amp import ./backup.json          # Import data

# Lessons
devplan lessons list                      # Show recorded lessons
devplan lessons search "merge conflicts"  # Search lessons
devplan lessons add "title" "content"     # Add manually

# Plans
devplan plans list                        # List saved plans
devplan plans show <project_id>           # Show specific plan
devplan plans delete <project_id>         # Delete plan
```

---

## Migration Path

### Phase 1: Config Schema (Week 1)
- [ ] Add config file loading to DevPlan
- [ ] Support environment variable overrides
- [ ] Add `devplan config` CLI commands

### Phase 2: AMP Client (Week 2)
- [ ] Implement AmpClient with retry logic
- [ ] Add health check and connection status
- [ ] Graceful fallback when unavailable

### Phase 3: Nellie Extensions (Week 2-3)
- [ ] Add DevPlan-specific tools to Nellie
- [ ] Create database schema migrations
- [ ] Test compatibility

### Phase 4: Tool Integration (Week 3-4)
- [ ] Wrap analyze_plan with persistence
- [ ] Wrap generate_waves with file graph
- [ ] Add lesson search to methodology
- [ ] Add wave result recording

### Phase 5: Documentation & Release (Week 4)
- [ ] Update README with AMP setup
- [ ] Create "5-minute quickstart" guide
- [ ] Publish Nellie installation instructions
- [ ] Announce on devplanmcp.store

---

## Community AMP Nodes (Future)

For users who won't self-host:

### Volunteer-Run Nodes

```yaml
# Community node registry (mesh.devplanmcp.store/nodes.yaml)
nodes:
  - name: "DevPlan Community West"
    endpoint: "https://amp-west.devplan.community"
    region: "us-west"
    maintainer: "volunteer@example.com"
    trust_level: "community"
    
  - name: "DevPlan Community EU"
    endpoint: "https://amp-eu.devplan.community"
    region: "eu-central"
    maintainer: "volunteer2@example.com"
    trust_level: "community"
```

### Trust Levels

| Level | Meaning | Data Handling |
|-------|---------|---------------|
| `local` | User's own machine | Full trust |
| `verified` | Known operator, audited | Encrypted at rest |
| `community` | Volunteer-run | Encrypted, no guarantees |
| `public` | Open relay | Ephemeral only |

---

## Security Considerations

1. **Local-first by default** — Sensitive project data never leaves user's machine unless explicitly configured

2. **Token-based auth** — Remote endpoints require authentication; tokens stored in env vars, not config files

3. **Encryption** — AMP protocol should support TLS; Nellie can encrypt SQLite at rest

4. **Data minimization** — Only persist what's needed; lessons are anonymized before sharing

5. **User consent** — Federation/sharing is opt-in, disabled by default

---

*Spec version: 1.0*
*Author: Radar + Mike*
*Date: 2026-02-07*
