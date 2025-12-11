from mcp.server.fastmcp import FastMCP
from smithery.decorators import smithery


@smithery.server()
def create_server():
    """Create and return a FastMCP server instance."""

    server = FastMCP(name="DevPlan")

    @server.tool()
    def hello(name: str) -> str:
        """Say hello to someone."""
        return f"Hello, {name}!"

    return server
