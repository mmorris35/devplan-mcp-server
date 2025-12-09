# DevPlan MCP Server

[![smithery badge](https://smithery.ai/badge/@mmorris35/devplan-mcp-server)](https://smithery.ai/server/@mmorris35/devplan-mcp-server)

MCP (Model Context Protocol) server that exposes [ClaudeCode-DevPlanBuilder](https://github.com/mmorris35/ClaudeCode-DevPlanBuilder) functionality as tools for Claude Code and other MCP clients.

## Features

Generate comprehensive, paint-by-numbers development plans directly from Claude Code:

- **devplan_parse_brief** - Parse PROJECT_BRIEF.md into structured data
- **devplan_generate_plan** - Generate complete DEVELOPMENT_PLAN.md
- **devplan_generate_claude_md** - Generate project-specific claude.md rules
- **devplan_validate_plan** - Validate plans for completeness
- **devplan_list_templates** - List available project templates
- **devplan_get_subtask** - Extract specific subtask details
- **devplan_update_progress** - Mark subtasks complete with notes

## Installation

```bash
# Clone and install
git clone https://github.com/mmorris35/devplan-mcp-server.git
cd devplan-mcp-server
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

## Usage with Claude Code

Add to your Claude Code MCP configuration (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "devplan": {
      "command": "devplan-mcp",
      "args": []
    }
  }
}
```

Then in Claude Code:

```
Generate a development plan for my new CLI tool project
```

Claude will use the MCP tools to:
1. Help you create a PROJECT_BRIEF.md
2. Generate DEVELOPMENT_PLAN.md with phases, tasks, subtasks
3. Generate claude.md with project rules

## Standalone Usage

```bash
# Run with stdio transport (default)
devplan-mcp

# Run with HTTP transport for remote access
devplan-mcp --transport http --port 8000
```

## Testing

```bash
# Run tests
pytest

# Type checking
mypy src/

# Linting
ruff check src/
```

## Tools Reference

### devplan_parse_brief

Parse a PROJECT_BRIEF.md file into structured data.

**Input:**
- `content` (str): Full PROJECT_BRIEF.md content
- `response_format` (str): "json" or "markdown"

**Output:** Parsed brief as JSON or markdown summary

### devplan_generate_plan

Generate a DEVELOPMENT_PLAN.md from a project brief.

**Input:**
- `brief_content` (str): PROJECT_BRIEF.md content or JSON brief
- `template` (str, optional): "cli", "web_app", "api", or "library"

**Output:** Complete DEVELOPMENT_PLAN.md content

### devplan_generate_claude_md

Generate a claude.md rules file.

**Input:**
- `brief_content` (str): PROJECT_BRIEF.md content or JSON brief
- `language` (str): "python", "typescript", "go", "rust"
- `test_coverage` (int): Required coverage percentage (0-100)

**Output:** Complete claude.md content

### devplan_validate_plan

Validate a development plan for completeness.

**Input:**
- `content` (str): DEVELOPMENT_PLAN.md content
- `strict` (bool): Treat warnings as errors

**Output:** Validation report with errors, warnings, suggestions

### devplan_list_templates

List available project templates.

**Input:**
- `project_type` (str, optional): Filter by type
- `response_format` (str): "json" or "markdown"

**Output:** List of templates with descriptions

### devplan_get_subtask

Get details for a specific subtask.

**Input:**
- `plan_content` (str): DEVELOPMENT_PLAN.md content
- `subtask_id` (str): ID in format "X.Y.Z"

**Output:** Subtask details as JSON

### devplan_update_progress

Mark a subtask as complete.

**Input:**
- `plan_content` (str): Current DEVELOPMENT_PLAN.md content
- `subtask_id` (str): ID to mark complete
- `completion_notes` (str): Notes about completion

**Output:** Updated DEVELOPMENT_PLAN.md content

## License

MIT License - see LICENSE file

## Author

Mike Morris - [Hella Dynamic](https://helladynamic.com)