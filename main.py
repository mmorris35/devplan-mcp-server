"""DevPlan MCP Server - HTTP entry point for Smithery deployment."""

import os
import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.middleware.cors import CORSMiddleware
from middleware import SmitheryConfigMiddleware

# Initialize MCP server
mcp = FastMCP(name="DevPlan")


@mcp.tool()
def hello(name: str) -> str:
    """Say hello to someone."""
    return f"Hello, {name}!"


def main():
    """Run the server based on TRANSPORT environment variable."""
    transport_mode = os.getenv("TRANSPORT", "stdio")

    if transport_mode == "http":
        # HTTP mode for Smithery deployment
        print("DevPlan MCP Server starting in HTTP mode...")

        # Setup Starlette app with CORS for cross-origin requests
        app = mcp.streamable_http_app()

        # Add CORS middleware for browser-based clients
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
            expose_headers=["mcp-session-id", "mcp-protocol-version"],
            max_age=86400,
        )

        # Apply Smithery config middleware for session config extraction
        app = SmitheryConfigMiddleware(app)

        # Get port from environment variable (Smithery sets PORT)
        port = int(os.environ.get("PORT", 8080))
        print(f"Listening on port {port}")

        uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")

    else:
        # STDIO mode for local development
        print("DevPlan MCP Server starting in stdio mode...")
        mcp.run()


if __name__ == "__main__":
    main()
