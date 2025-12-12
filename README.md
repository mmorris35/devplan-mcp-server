# DevPlan MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-purple.svg)](https://modelcontextprotocol.io)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

MCP server that helps Claude Code generate development plans using the [ClaudeCode-DevPlanBuilder](https://github.com/mmorris35/ClaudeCode-DevPlanBuilder) methodology.

## Install

```bash
claude mcp add devplan --transport sse https://devplan-mcp-server.mike-c63.workers.dev/sse
```

Or add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "devplan": {
      "type": "sse",
      "url": "https://devplan-mcp-server.mike-c63.workers.dev/sse"
    }
  }
}
```

## Usage

Tell Claude Code: "Use devplan to help me build [your project idea]"

The server provides scaffolding tools and references the original [ClaudeCode-DevPlanBuilder](https://github.com/mmorris35/ClaudeCode-DevPlanBuilder) repo for guidance, so plans stay up-to-date with the methodology.

## Tools

| Tool | Purpose |
|------|---------|
| `devplan_start` | Main entry point - guides Claude through the methodology |
| `devplan_interview_questions` | Get questions to gather project requirements |
| `devplan_create_brief` | Generate PROJECT_BRIEF.md |
| `devplan_generate_plan` | Generate DEVELOPMENT_PLAN.md scaffold |
| `devplan_generate_claude_md` | Generate CLAUDE.md scaffold |
| `devplan_parse_brief` | Parse existing brief into structured data |
| `devplan_list_templates` | List project templates (cli, web_app, api, library) |
| `devplan_validate_plan` | Check plan completeness |
| `devplan_get_subtask` | Get specific subtask details |
| `devplan_update_progress` | Mark subtasks complete |

## Development

```bash
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare Workers
```

## License

MIT
