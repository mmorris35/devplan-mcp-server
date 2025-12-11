# MCP Server Deployment Guide: Cloudflare Workers + GitHub Registry

This document provides step-by-step instructions for deploying an MCP server to Cloudflare Workers and listing it on the GitHub MCP Registry. Follow these instructions exactly - do not skip steps or improvise.

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- A Cloudflare account (free tier works)
- A GitHub account
- `wrangler` CLI authenticated with Cloudflare
- Your MCP server code ready (Python or TypeScript)

## Part 1: Deploy to Cloudflare Workers

### Option A: New MCP Server (Recommended for Quick Start)

If starting fresh or converting an existing server:

```bash
# Create new MCP server from Cloudflare template (authless version for simplicity)
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless

cd my-mcp-server
```

This creates a working MCP server structure. Your server will be available at:
`https://my-mcp-server.<your-account>.workers.dev/sse`

### Option B: Convert Existing MCP Server to Cloudflare Workers

If you have an existing stdio-based MCP server, you need to convert it to the Workers format.

#### For TypeScript/JavaScript servers:

1. Install dependencies:
```bash
npm install @modelcontextprotocol/sdk hono
npm install -D wrangler @cloudflare/workers-types
```

2. Create `wrangler.toml`:
```toml
name = "your-mcp-server-name"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]
```

3. Convert your server to this structure in `src/index.ts`:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// For Cloudflare Workers, use this pattern:
import { McpAgent } from "agents/mcp";

export class MyMCPServer extends McpAgent {
  server = new McpServer({
    name: "your-server-name",
    version: "1.0.0",
  });

  async init() {
    // Register your tools here
    this.server.tool(
      "your_tool_name",
      "Description of what this tool does",
      {
        // Zod schema for parameters
        param1: z.string().describe("Parameter description"),
      },
      async ({ param1 }) => {
        // Tool implementation
        return {
          content: [{ type: "text", text: "Result here" }],
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    if (url.pathname === "/sse" || url.pathname === "/mcp") {
      return MyMCPServer.serveSSE("/sse").fetch(request, env, ctx);
    }
    
    if (url.pathname === "/mcp/message") {
      return MyMCPServer.serveSSE("/sse").fetch(request, env, ctx);
    }
    
    return new Response("MCP Server Running", { status: 200 });
  },
};
```

#### For Python servers:

Cloudflare Workers now supports Python. Create `src/index.py`:

```python
from js import Response
from mcp.server import Server
from mcp.types import Tool, TextContent

server = Server("your-server-name")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="your_tool_name",
            description="What this tool does",
            inputSchema={
                "type": "object",
                "properties": {
                    "param1": {"type": "string", "description": "Parameter description"}
                },
                "required": ["param1"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "your_tool_name":
        result = f"Processed: {arguments.get('param1')}"
        return [TextContent(type="text", text=result)]
    raise ValueError(f"Unknown tool: {name}")

async def on_fetch(request, env):
    # Handle MCP requests
    return Response.new("MCP Server Running")
```

### Step 2: Deploy to Cloudflare

```bash
# Login to Cloudflare (if not already)
npx wrangler login

# Deploy
npx wrangler deploy
```

Your server URL will be displayed, typically:
`https://your-server-name.<account>.workers.dev`

### Step 3: Test Your Deployment

Test with curl:
```bash
curl -I https://your-server-name.your-account.workers.dev/sse
# Should return 200 OK
```

Test with MCP Inspector:
```bash
npx @anthropic/mcp-inspector https://your-server-name.your-account.workers.dev/sse
```

### Step 4: Connect GitHub Repository for Auto-Deploy

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Go to Settings > Builds & Deployments
4. Click "Connect to Git"
5. Select your GitHub repository
6. Configure branch (usually `main`)

Now every push to main auto-deploys your MCP server.

## Part 2: List on GitHub MCP Registry

### Step 1: Install the MCP Publisher CLI

```bash
# macOS/Linux
curl -fsSL \
  "https://github.com/modelcontextprotocol/registry/releases/download/latest/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | tar xz mcp-publisher

sudo mv mcp-publisher /usr/local/bin/
```

### Step 2: Create server.json in Your Repository

In the root of your MCP server repository, create `server.json`:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
  "name": "io.github.YOUR_USERNAME/YOUR_SERVER_NAME",
  "title": "Your Server Display Name",
  "description": "A clear description of what your MCP server does",
  "version": "1.0.0",
  "license": "MIT",
  "repository": "https://github.com/YOUR_USERNAME/YOUR_REPO",
  "remotes": [
    {
      "type": "streamable-http",
      "url": "https://your-server-name.your-account.workers.dev/mcp"
    }
  ],
  "packages": [
    {
      "registryType": "npm",
      "identifier": "your-npm-package-name",
      "version": "1.0.0",
      "transport": {
        "type": "stdio"
      }
    }
  ],
  "tools": [
    {
      "name": "your_tool_name",
      "description": "What this tool does"
    }
  ],
  "tags": ["category1", "category2"]
}
```

Important fields:
- `name`: Must be `io.github.USERNAME/SERVERNAME` for GitHub-based auth
- `remotes`: Your Cloudflare Workers URL with `/mcp` endpoint
- `packages`: Optional, include if you also publish to npm

### Step 3: Initialize and Publish

```bash
cd /path/to/your/mcp-server-repo

# Initialize (creates/updates server.json)
mcp-publisher init

# Validate your server.json
mcp-publisher validate

# Publish to the registry
mcp-publisher publish
```

### Step 4: Verify Publication

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.YOUR_USERNAME/YOUR_SERVER_NAME"
```

### Step 5: Request Official Listing (Optional)

For prominent placement in the GitHub MCP Registry:
1. Ensure your server.json is complete and valid
2. Email partnerships@github.com requesting inclusion
3. Include your server name and repository URL

## Part 3: Client Configuration Examples

### Claude Desktop (via mcp-remote proxy)

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "your-server-name": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-server-name.your-account.workers.dev/sse"
      ]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "your-server-name": {
      "type": "http",
      "url": "https://your-server-name.your-account.workers.dev/mcp"
    }
  }
}
```

### Cursor

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "your-server-name": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-server-name.your-account.workers.dev/sse"
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors during deploy**
   - Run `npm install` before `wrangler deploy`
   - Check `wrangler.toml` has correct `main` path

2. **SSE endpoint returns 404**
   - Verify your fetch handler routes `/sse` correctly
   - Check Cloudflare dashboard logs for errors

3. **mcp-publisher fails authentication**
   - Ensure you're using `io.github.USERNAME/...` namespace
   - Run `gh auth login` if using GitHub CLI

4. **Tools not appearing in client**
   - Verify tools are registered in `init()` method
   - Check tool schemas are valid Zod/JSON Schema
   - Restart your MCP client after config changes

### Useful Commands

```bash
# View deployment logs
wrangler tail

# Test locally before deploy
wrangler dev

# Check worker status
wrangler deployments list
```

## Quick Reference

| What | URL/Command |
|------|-------------|
| Cloudflare Dashboard | https://dash.cloudflare.com |
| GitHub MCP Registry | https://github.com/modelcontextprotocol/registry |
| MCP Inspector | `npx @anthropic/mcp-inspector <url>` |
| Cloudflare AI Playground | https://playground.ai.cloudflare.com |
| Your deployed server | `https://<name>.<account>.workers.dev/sse` |

## File Checklist

Before publishing, ensure your repository has:

- [ ] `wrangler.toml` - Cloudflare Worker config
- [ ] `src/index.ts` or `src/index.py` - Server implementation
- [ ] `package.json` - Dependencies (for TS/JS)
- [ ] `server.json` - MCP Registry metadata
- [ ] `README.md` - Documentation for users
- [ ] `.github/workflows/deploy.yml` - Optional: CI/CD workflow

## Example GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy MCP Server

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Add `CLOUDFLARE_API_TOKEN` to your repository secrets (Settings > Secrets > Actions).
