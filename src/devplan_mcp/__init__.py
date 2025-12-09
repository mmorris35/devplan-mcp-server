"""
DevPlan MCP Server - Generate development plans via Model Context Protocol.

This package exposes the ClaudeCode-DevPlanBuilder functionality as MCP tools.
"""

__version__ = "0.1.0"
__author__ = "Mike Morris"

from devplan_mcp.server import create_server, mcp

__all__ = ["mcp", "create_server"]
