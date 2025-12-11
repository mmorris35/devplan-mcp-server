# Claude Session Checkpoint - Smithery 502 Debug

## Problem
Deploying this MCP server to Smithery results in 502 Bad Gateway errors on the `/mcp` endpoint.
The `.well-known/mcp-config` endpoint responds (proving container runs), but POST to `/mcp` fails.

## Current Quality Score: 38/100
Goal: 100/100

## What's Been Tried
1. `runtime: "python"` - 502
2. `runtime: "container"` with Dockerfile - 502
3. Various pyproject.toml configs (hatchling, uv_build, none) - 502
4. Fixed missing uv.lock (was in .gitignore) - 502
5. Matched cookbook dependency versions - 502
6. Added TRANSPORT=http env var - 502

## Current Configuration
- `smithery.yaml`: runtime: "container", type: "http"
- `Dockerfile`: uv:python3.12-alpine, PORT=8080, TRANSPORT=http
- `main.py`: FastMCP with streamable_http_app(), CORS middleware, uvicorn
- `pyproject.toml`: minimal, just mcp[cli]>=1.12.4

## Working Reference
The cookbook example works: `@smithery-ai/cookbook-py-custom-container` (59/100 score)
Local copy at: `/tmp/smithery-cookbook/servers/python/migrate_stdio_to_http/`

Key differences from our code:
1. Cookbook has `middleware.py` with SmitheryConfigMiddleware
2. Cookbook main.py checks TRANSPORT env before running HTTP mode
3. Cookbook runs `python src/main.py` (we run `python main.py`)

## Server Runs Locally
```bash
uv sync --no-dev && uv run python main.py
# Starts successfully, binds to 0.0.0.0:8080
```

## Scan Output Pattern
```
.well-known/mcp-config → responds with schema ✓
POST /mcp → 502 Bad Gateway ✗
```

## Next Steps to Try
1. Check if MCP library version 1.23.3 has breaking changes
2. Try adding the SmitheryConfigMiddleware from cookbook
3. Check if there's something about how FastMCP handles POST to /mcp
4. Contact Smithery support if nothing else works

## Files to Read First
- main.py (the server code)
- Dockerfile
- smithery.yaml
- pyproject.toml
