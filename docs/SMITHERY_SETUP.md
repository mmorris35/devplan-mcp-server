# Smithery Python MCP Server Setup Guide

This document captures all the requirements from official Smithery documentation for deploying a Python MCP server.

## smithery.yaml

Minimal configuration in repository root:

```yaml
runtime: "python"
```

## pyproject.toml Requirements

### Build System
```toml
[build-system]
requires = ["uv_build>=0.8.15,<0.9.0"]
build-backend = "uv_build"
```

### Project Metadata
```toml
[project]
name = "my_server"
version = "0.1.0"
description = "My MCP server"
readme = "README.md"
requires-python = ">=3.12"
```

### Required Dependencies
```toml
dependencies = [
    "mcp>=1.15.0",
    "smithery>=0.4.2",
]
```

### Scripts (for local development)
```toml
[project.scripts]
dev = "smithery.cli.dev:main"
playground = "smithery.cli.playground:main"
```

### Smithery Server Configuration
```toml
[tool.smithery]
server = "my_server.server:create_server"
```

## Required Directory Structure

```
my-mcp-server/
├── smithery.yaml
├── pyproject.toml
├── README.md
└── src/
    └── my_server/
        ├── __init__.py
        └── server.py
```

## Server Function Requirements

The server function in `server.py` must:
1. Be decorated with `@smithery.server()`
2. Return a FastMCP server instance
3. Match the path specified in `[tool.smithery] server = ...`

### Minimal server.py Example

```python
from mcp.server.fastmcp import FastMCP
from smithery.decorators import smithery

@smithery.server()
def create_server():
    """Create and return a FastMCP server instance."""
    server = FastMCP(name="My Server")

    @server.tool()
    def my_tool(param: str) -> str:
        """Tool description."""
        return f"Result: {param}"

    return server
```

## Optional: Config Schema for Session Configuration

```python
from pydantic import BaseModel

class Config(BaseModel):
    api_key: str

@smithery.server(config_schema=Config)
def create_server(config: Config):
    server = FastMCP(name="My Server")
    # Use config.api_key
    return server
```

## Version Requirements

- Python: 3.12+
- mcp: >=1.15.0
- smithery: >=0.4.2
- uv_build: >=0.8.15,<0.9.0

## Quality Score Tips

Based on observed patterns from high-scoring servers:
- Reliability/uptime is a major factor
- Response time (P95) matters
- Having tools, prompts, and resources defined helps
- Complete documentation (README) likely helps

---

*Captured from official Smithery docs: https://smithery.ai/docs/build/deployments/python*
