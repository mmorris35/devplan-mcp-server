"""Minimal MCP server for testing Smithery deployment."""

from mcp.server.fastmcp import FastMCP
from smithery.decorators import smithery


@smithery.server()
def create_server():
    """Create minimal server."""
    server = FastMCP(name="DevPlan Test")

    @server.tool()
    def hello(name: str) -> str:
        """Say hello."""
        return f"Hello, {name}!"

    return server
