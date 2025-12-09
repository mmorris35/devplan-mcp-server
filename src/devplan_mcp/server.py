"""
DevPlan MCP Server - Generate development plans via Model Context Protocol.

This MCP server exposes the ClaudeCode-DevPlanBuilder functionality as MCP tools,
enabling Claude Code and other MCP clients to directly generate and manage
development plans.

File Name      : server.py
Author         : Mike Morris
Prerequisite   : Python 3.11+, mcp, pydantic
Copyright      : (c) 2025 Mike Morris
License        : MIT
"""

from __future__ import annotations

import json
import logging
import sys
from contextlib import asynccontextmanager
from enum import Enum
from typing import Any, Optional

import smithery
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

# Configure logging to stderr (required for stdio transport)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("devplan_mcp")


class ResponseFormat(str, Enum):
    """Output format for tool responses."""

    MARKDOWN = "markdown"
    JSON = "json"


# =============================================================================
# Input Schemas
# =============================================================================


class ParseBriefInput(BaseModel):
    """Input for parsing a PROJECT_BRIEF.md file."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    content: str = Field(
        ...,
        description="The full content of a PROJECT_BRIEF.md file to parse",
        min_length=100,
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.JSON,
        description="Output format: 'json' for structured data, 'markdown' for human-readable",
    )


class GeneratePlanInput(BaseModel):
    """Input for generating a DEVELOPMENT_PLAN.md from a project brief."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    brief_content: str = Field(
        ...,
        description="PROJECT_BRIEF.md content OR JSON-serialized ProjectBrief",
        min_length=50,
    )
    template: Optional[str] = Field(
        default=None,
        description="Template to use: 'cli', 'web_app', 'api', 'library'. Auto-detected if not specified.",
    )


class GenerateClaudeMdInput(BaseModel):
    """Input for generating a claude.md rules file."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    brief_content: str = Field(
        ...,
        description="PROJECT_BRIEF.md content OR JSON-serialized ProjectBrief",
        min_length=50,
    )
    language: str = Field(
        default="python",
        description="Primary language: 'python', 'typescript', 'go', 'rust'",
    )
    test_coverage: int = Field(
        default=80,
        description="Required test coverage percentage",
        ge=0,
        le=100,
    )


class ValidatePlanInput(BaseModel):
    """Input for validating a DEVELOPMENT_PLAN.md file."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    content: str = Field(
        ...,
        description="The full content of a DEVELOPMENT_PLAN.md file to validate",
        min_length=100,
    )
    strict: bool = Field(
        default=False,
        description="Enable strict validation (warnings become errors)",
    )


class ListTemplatesInput(BaseModel):
    """Input for listing available templates."""

    model_config = ConfigDict(extra="forbid")

    project_type: Optional[str] = Field(
        default=None,
        description="Filter by project type: 'cli', 'web', 'api', 'library'",
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.MARKDOWN,
        description="Output format",
    )


class GetSubtaskInput(BaseModel):
    """Input for retrieving a specific subtask."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    plan_content: str = Field(
        ...,
        description="The DEVELOPMENT_PLAN.md content",
        min_length=100,
    )
    subtask_id: str = Field(
        ...,
        description="Subtask ID in format 'X.Y.Z' (e.g., '1.2.3')",
        pattern=r"^\d+\.\d+\.\d+$",
    )


class UpdateProgressInput(BaseModel):
    """Input for updating subtask completion status."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    plan_content: str = Field(
        ...,
        description="The DEVELOPMENT_PLAN.md content",
        min_length=100,
    )
    subtask_id: str = Field(
        ...,
        description="Subtask ID to mark complete (format: 'X.Y.Z')",
        pattern=r"^\d+\.\d+\.\d+$",
    )
    completion_notes: str = Field(
        ...,
        description="Notes about what was completed, issues encountered, etc.",
        min_length=10,
        max_length=2000,
    )


class CreateBriefInput(BaseModel):
    """Input for creating a PROJECT_BRIEF.md from interview answers."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    name: str = Field(
        ...,
        description="Project name",
        min_length=1,
        max_length=100,
    )
    project_type: str = Field(
        ...,
        description="Project type: 'cli', 'web_app', 'api', or 'library'",
    )
    goal: str = Field(
        ...,
        description="One-sentence description of what the project does",
        min_length=10,
        max_length=500,
    )
    target_users: list[str] = Field(
        ...,
        description="List of target user types",
        min_length=1,
    )
    features: list[str] = Field(
        ...,
        description="List of must-have features for MVP",
        min_length=1,
    )
    tech_stack: Optional[dict[str, str]] = Field(
        default=None,
        description="Optional tech stack preferences (language, framework, database, etc.)",
    )
    timeline: Optional[str] = Field(
        default=None,
        description="Project timeline (e.g., '2 weeks', '1 month')",
    )
    constraints: Optional[list[str]] = Field(
        default=None,
        description="Any constraints or requirements (must-use tech, cannot-use, etc.)",
    )


# =============================================================================
# Server Initialization
# =============================================================================


@asynccontextmanager
async def server_lifespan():
    """Manage server lifecycle - load templates on startup."""
    logger.info("DevPlan MCP server starting up...")

    # TODO: Load templates from package resources
    templates = {
        "cli": "Command-line application template",
        "web_app": "Full-stack web application template",
        "api": "REST/GraphQL API service template",
        "library": "Reusable library/package template",
    }

    yield {"templates": templates}

    logger.info("DevPlan MCP server shutting down...")


mcp = FastMCP("devplan_mcp", lifespan=server_lifespan)


# =============================================================================
# Tool Implementations
# =============================================================================


@mcp.tool(
    name="devplan_parse_brief",
    annotations={
        "title": "Parse Project Brief",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_parse_brief(params: ParseBriefInput) -> str:
    """Parse a PROJECT_BRIEF.md file into structured data.

    Takes the raw markdown content of a project brief and extracts all fields
    into a structured ProjectBrief object. Use this to validate brief content
    or prepare it for plan generation.

    Args:
        params: ParseBriefInput containing:
            - content (str): Full PROJECT_BRIEF.md content
            - response_format (ResponseFormat): 'json' or 'markdown'

    Returns:
        str: Parsed brief as JSON object or formatted markdown summary
    """
    logger.info("Parsing project brief...")

    # TODO: Implement actual parsing from ported parser module
    # For now, return a placeholder showing the expected structure
    parsed = {
        "name": "Extracted project name",
        "type": "cli",
        "goal": "Extracted goal statement",
        "target_users": ["User type 1", "User type 2"],
        "timeline": "2 weeks",
        "tech_stack": {
            "language": "python",
            "framework": None,
            "database": None,
        },
        "features": [
            {"name": "Feature 1", "priority": "must-have"},
            {"name": "Feature 2", "priority": "should-have"},
        ],
    }

    if params.response_format == ResponseFormat.JSON:
        return json.dumps(parsed, indent=2)

    # Markdown format
    return f"""# Parsed Project Brief

**Name**: {parsed["name"]}
**Type**: {parsed["type"]}
**Timeline**: {parsed["timeline"]}

## Goal
{parsed["goal"]}

## Target Users
- {chr(10).join('- ' + u for u in parsed["target_users"])}

## Features
{chr(10).join(f"- [{f['priority']}] {f['name']}" for f in parsed["features"])}
"""


@mcp.tool(
    name="devplan_generate_plan",
    annotations={
        "title": "Generate Development Plan",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_generate_plan(params: GeneratePlanInput) -> str:
    """Generate a complete DEVELOPMENT_PLAN.md from a project brief.

    Creates a comprehensive, paint-by-numbers development plan with:
    - Numbered phases, tasks, and subtasks
    - 3-7 specific deliverables per subtask
    - Prerequisites and success criteria
    - Git workflow guidance (task-level branching)

    Args:
        params: GeneratePlanInput containing:
            - brief_content (str): PROJECT_BRIEF.md or JSON brief
            - template (Optional[str]): Template type or auto-detect

    Returns:
        str: Complete DEVELOPMENT_PLAN.md content ready for use
    """
    logger.info(f"Generating development plan using template: {params.template or 'auto'}")

    # TODO: Implement actual generation from ported generator module
    return """# Development Plan

## Phase 0: Foundation

### Task 0.1: Project Setup
**Branch**: `feature/0-1-setup`
**Commit Prefix**: `[0.1]`

#### Subtask 0.1.1: Initialize Repository
- [ ] Create repository structure
- [ ] Initialize package manager
- [ ] Set up virtual environment
- [ ] Install base dependencies
- [ ] Create .gitignore

**Success Criteria**: `pip install -e .` succeeds

---

*Plan generation placeholder - full implementation pending*
"""


@mcp.tool(
    name="devplan_generate_claude_md",
    annotations={
        "title": "Generate Claude Rules",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_generate_claude_md(params: GenerateClaudeMdInput) -> str:
    """Generate a claude.md rules file for a project.

    Creates project-specific rules defining how Claude Code should work,
    including testing requirements, code quality standards, git workflow,
    and build verification steps.

    Args:
        params: GenerateClaudeMdInput containing:
            - brief_content (str): PROJECT_BRIEF.md or JSON brief
            - language (str): Primary programming language
            - test_coverage (int): Required coverage percentage

    Returns:
        str: Complete claude.md content
    """
    logger.info(f"Generating claude.md for {params.language} project")

    # TODO: Implement actual generation
    return f"""# Claude Rules for Project

## Language & Stack
- Primary: {params.language}
- Test Coverage: {params.test_coverage}%

## Development Rules

### Before Each Subtask
1. Read this file and DEVELOPMENT_PLAN.md
2. Identify the subtask deliverables
3. Check prerequisites are met

### During Development
1. Write tests alongside code
2. Run linting before commits
3. Update completion notes

### After Each Subtask
1. All tests pass
2. Coverage >= {params.test_coverage}%
3. Commit to task branch

---

*Rules generation placeholder - full implementation pending*
"""


@mcp.tool(
    name="devplan_validate_plan",
    annotations={
        "title": "Validate Development Plan",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_validate_plan(params: ValidatePlanInput) -> str:
    """Validate a DEVELOPMENT_PLAN.md for completeness and consistency.

    Checks:
    - All phases have tasks, all tasks have subtasks
    - Subtasks have 3-7 deliverables
    - Prerequisites reference valid subtask IDs
    - Success criteria are defined
    - Git strategy is specified

    Args:
        params: ValidatePlanInput containing:
            - content (str): DEVELOPMENT_PLAN.md content
            - strict (bool): Treat warnings as errors

    Returns:
        str: Validation report with errors, warnings, and suggestions
    """
    logger.info(f"Validating plan (strict={params.strict})")

    # TODO: Implement actual validation
    return """# Plan Validation Report

## Summary
- Errors: 0
- Warnings: 2
- Suggestions: 3

## Warnings
1. Subtask 1.2.3 has 8 deliverables (recommended: 3-7)
2. Phase 3 has no estimated duration

## Suggestions
1. Consider adding more detail to success criteria in Task 2.1
2. Subtask 0.1.1 could be split into smaller pieces
3. Add completion notes template to all subtasks

---

*Validation placeholder - full implementation pending*
"""


@mcp.tool(
    name="devplan_list_templates",
    annotations={
        "title": "List Available Templates",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_list_templates(params: ListTemplatesInput) -> str:
    """List available project templates.

    Returns templates for different project types (CLI, web app, API, library)
    with descriptions and typical use cases.

    Args:
        params: ListTemplatesInput containing:
            - project_type (Optional[str]): Filter by type
            - response_format (ResponseFormat): Output format

    Returns:
        str: List of templates with descriptions
    """
    logger.info(f"Listing templates (filter={params.project_type})")

    templates = [
        {
            "name": "cli",
            "description": "Command-line application",
            "use_cases": ["Developer tools", "Automation scripts", "System utilities"],
        },
        {
            "name": "web_app",
            "description": "Full-stack web application",
            "use_cases": ["SaaS products", "Internal tools", "Customer portals"],
        },
        {
            "name": "api",
            "description": "REST or GraphQL API service",
            "use_cases": ["Backend services", "Microservices", "Data APIs"],
        },
        {
            "name": "library",
            "description": "Reusable library or package",
            "use_cases": ["SDK development", "Shared utilities", "Open source packages"],
        },
    ]

    if params.project_type:
        templates = [t for t in templates if t["name"] == params.project_type]

    if params.response_format == ResponseFormat.JSON:
        return json.dumps(templates, indent=2)

    # Markdown format
    lines = ["# Available Templates", ""]
    for template in templates:
        lines.append(f"## {template['name']}")
        lines.append(f"{template['description']}")
        lines.append("")
        lines.append("**Use Cases:**")
        for use_case in template["use_cases"]:
            lines.append(f"- {use_case}")
        lines.append("")

    return "\n".join(lines)


@mcp.tool(
    name="devplan_get_subtask",
    annotations={
        "title": "Get Subtask Details",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_get_subtask(params: GetSubtaskInput) -> str:
    """Get details for a specific subtask by ID.

    Extracts a subtask from the development plan with full context including
    the parent task, phase, prerequisites, deliverables, and success criteria.

    Args:
        params: GetSubtaskInput containing:
            - plan_content (str): DEVELOPMENT_PLAN.md content
            - subtask_id (str): ID in format 'X.Y.Z'

    Returns:
        str: Subtask details in JSON format
    """
    logger.info(f"Getting subtask {params.subtask_id}")

    # TODO: Implement actual subtask extraction
    return json.dumps(
        {
            "id": params.subtask_id,
            "name": "Example Subtask",
            "phase": "Phase 1: Core Features",
            "task": "Task 1.2: User Authentication",
            "branch": "feature/1-2-user-auth",
            "prerequisites": ["1.1.3"],
            "deliverables": [
                "Implement login endpoint",
                "Add password hashing",
                "Create JWT token generation",
                "Write authentication tests",
            ],
            "files": ["src/auth/login.py", "tests/test_auth.py"],
            "success_criteria": "All auth tests pass, coverage > 80%",
            "completed": False,
            "completion_notes": None,
        },
        indent=2,
    )


@mcp.tool(
    name="devplan_update_progress",
    annotations={
        "title": "Update Subtask Progress",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": False,
    },
)
async def devplan_update_progress(params: UpdateProgressInput) -> str:
    """Mark a subtask as complete and add completion notes.

    Updates the DEVELOPMENT_PLAN.md content with:
    - Checkbox marked as complete [x]
    - Completion notes added
    - Timestamp recorded

    Args:
        params: UpdateProgressInput containing:
            - plan_content (str): Current DEVELOPMENT_PLAN.md content
            - subtask_id (str): ID to mark complete
            - completion_notes (str): Notes about completion

    Returns:
        str: Updated DEVELOPMENT_PLAN.md content
    """
    logger.info(f"Marking subtask {params.subtask_id} as complete")

    # TODO: Implement actual plan update
    # This would parse the plan, find the subtask, update checkbox, add notes
    return f"""# Updated Plan

Subtask {params.subtask_id} marked complete.

**Completion Notes:**
{params.completion_notes}

---

*Progress update placeholder - returns modified plan content*
"""


@mcp.tool(
    name="devplan_interview_questions",
    annotations={
        "title": "Get Brief Interview Questions",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_interview_questions() -> str:
    """Get the list of questions needed to create a project brief.

    Returns a structured list of questions that should be asked to gather
    all information needed for a complete PROJECT_BRIEF.md. Use this to
    guide a conversation with the user, then pass the answers to
    devplan_create_brief.

    Returns:
        str: JSON list of questions with IDs, text, and whether required
    """
    logger.info("Returning interview questions for project brief")

    questions = [
        {
            "id": "name",
            "question": "What's your project called?",
            "required": True,
            "example": "My Awesome CLI Tool",
        },
        {
            "id": "project_type",
            "question": "What type of project is this? (cli, web_app, api, or library)",
            "required": True,
            "options": ["cli", "web_app", "api", "library"],
        },
        {
            "id": "goal",
            "question": "In one sentence, what does this project do? What problem does it solve?",
            "required": True,
            "example": "A command-line tool that converts markdown files to PDF with syntax highlighting",
        },
        {
            "id": "target_users",
            "question": "Who will use this? List the types of users.",
            "required": True,
            "example": ["Developers", "Technical writers", "Documentation teams"],
        },
        {
            "id": "features",
            "question": "What are the 3-5 must-have features for the MVP?",
            "required": True,
            "example": [
                "Parse markdown files",
                "Convert to PDF",
                "Support code syntax highlighting",
                "Custom styling options",
            ],
        },
        {
            "id": "tech_stack",
            "question": "Do you have tech stack preferences? (language, framework, database, etc.) Or should I recommend based on project type?",
            "required": False,
            "example": {"language": "Python 3.11+", "framework": "Click", "testing": "pytest"},
        },
        {
            "id": "timeline",
            "question": "What's your timeline? (e.g., '2 weeks', '1 month')",
            "required": False,
            "example": "2 weeks",
        },
        {
            "id": "constraints",
            "question": "Any constraints? Technologies you must use or cannot use? Deployment requirements?",
            "required": False,
            "example": ["Must use PostgreSQL", "Cannot use Docker", "Deploy to AWS Lambda"],
        },
    ]

    return json.dumps({"questions": questions, "total": len(questions)}, indent=2)


@mcp.tool(
    name="devplan_create_brief",
    annotations={
        "title": "Create Project Brief",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    },
)
async def devplan_create_brief(params: CreateBriefInput) -> str:
    """Create a complete PROJECT_BRIEF.md from interview answers.

    Takes the answers collected from the interview questions and generates
    a well-structured PROJECT_BRIEF.md ready for use with devplan_generate_plan.

    Args:
        params: CreateBriefInput containing all project information

    Returns:
        str: Complete PROJECT_BRIEF.md content in markdown format
    """
    logger.info(f"Creating project brief for: {params.name}")

    # Build tech stack section
    tech_stack_section = ""
    if params.tech_stack:
        tech_items = "\n".join(f"  - **{k}**: {v}" for k, v in params.tech_stack.items())
        tech_stack_section = f"""
### Tech Stack
{tech_items}
"""
    else:
        tech_stack_section = """
### Tech Stack
- To be determined based on project type
"""

    # Build constraints section
    constraints_section = ""
    if params.constraints:
        constraint_items = "\n".join(f"- {c}" for c in params.constraints)
        constraints_section = f"""
### Constraints
{constraint_items}
"""

    brief = f"""# Project Brief: {params.name}

## Overview

**Project Name**: {params.name}
**Project Type**: {params.project_type}
**Timeline**: {params.timeline or "To be determined"}

## Goal

{params.goal}

## Target Users

{chr(10).join(f"- {user}" for user in params.target_users)}

## MVP Features

{chr(10).join(f"- [ ] {feature}" for feature in params.features)}
{tech_stack_section}
{constraints_section}
## Success Criteria

- [ ] All MVP features implemented and working
- [ ] Test coverage > 80%
- [ ] Documentation complete
- [ ] Ready for initial users

---

*Generated with DevPlan MCP Server*
"""

    return brief


# =============================================================================
# Resources
# =============================================================================


@mcp.resource("templates://list")
async def list_template_resource() -> str:
    """List all available templates as a resource."""
    return json.dumps(
        {
            "templates": ["cli", "web_app", "api", "library"],
            "description": "Available project templates for development plan generation",
        }
    )


@mcp.resource("templates://{name}")
async def get_template_resource(name: str) -> str:
    """Get a specific template by name."""
    templates = {
        "cli": "CLI application template content...",
        "web_app": "Web application template content...",
        "api": "API service template content...",
        "library": "Library template content...",
    }

    if name not in templates:
        return json.dumps({"error": f"Template '{name}' not found"})

    return templates[name]


# =============================================================================
# Smithery Entry Point
# =============================================================================


@smithery.server()
def create_server() -> FastMCP:
    """Create and return the FastMCP server instance for Smithery deployment.

    This function is called by Smithery to instantiate the server.
    The @smithery.server() decorator handles configuration and lifecycle.

    Returns:
        FastMCP: The configured MCP server instance
    """
    return mcp


# =============================================================================
# CLI Entry Point
# =============================================================================


def main() -> None:
    """Run the DevPlan MCP server (for local/standalone use)."""
    import argparse

    parser = argparse.ArgumentParser(description="DevPlan MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http"],
        default="stdio",
        help="Transport type (default: stdio)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for HTTP transport (default: 8000)",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="devplan-mcp 0.1.0",
    )

    args = parser.parse_args()

    if args.transport == "http":
        mcp.run(transport="streamable_http", port=args.port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
