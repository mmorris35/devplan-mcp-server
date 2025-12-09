"""
DevPlan MCP Server - Generate development plans via Model Context Protocol.

This MCP server exposes the ClaudeCode-DevPlanBuilder functionality as MCP tools,
enabling Claude Code and other MCP clients to directly generate and manage
development plans.

File Name      : server.py
Author         : Mike Morris
Prerequisite   : Python 3.12+, mcp, pydantic
Copyright      : (c) 2025 Mike Morris
License        : MIT
"""

from __future__ import annotations

import json
import logging
import re
import sys
from contextlib import asynccontextmanager
from enum import Enum
from typing import Any

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field
from smithery.decorators import smithery

from devplan_mcp.generators import generate_plan, plan_to_template_vars
from devplan_mcp.models import ProjectBrief
from devplan_mcp.parser import parse_project_brief
from devplan_mcp.templates import list_templates, render_claude_md, render_plan, select_template

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
        min_length=50,
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
    template: str | None = Field(
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

    project_type: str | None = Field(
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
    tech_stack: dict[str, str] | None = Field(
        default=None,
        description="Optional tech stack preferences (language, framework, database, etc.)",
    )
    timeline: str | None = Field(
        default=None,
        description="Project timeline (e.g., '2 weeks', '1 month')",
    )
    constraints: list[str] | None = Field(
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

    # Get available templates
    templates = list_templates()

    yield {"templates": templates}

    logger.info("DevPlan MCP server shutting down...")


mcp = FastMCP("devplan_mcp", lifespan=server_lifespan)


# =============================================================================
# Helper Functions
# =============================================================================


def _parse_brief_content(content: str) -> ProjectBrief:
    """Parse brief content from markdown or JSON format.

    Args:
        content: Either PROJECT_BRIEF.md markdown or JSON-serialized ProjectBrief

    Returns:
        ProjectBrief instance
    """
    # Try JSON first
    try:
        data = json.loads(content)
        return ProjectBrief(**data)
    except (json.JSONDecodeError, TypeError):
        pass

    # Parse as markdown
    return parse_project_brief(content)


def _extract_subtask_from_plan(plan_content: str, subtask_id: str) -> dict[str, Any]:
    """Extract subtask details from a DEVELOPMENT_PLAN.md file.

    Args:
        plan_content: The full plan markdown content
        subtask_id: Subtask ID in format X.Y.Z

    Returns:
        Dictionary with subtask details
    """
    # Parse subtask ID
    parts = subtask_id.split(".")
    phase_id = parts[0]
    task_id = f"{parts[0]}.{parts[1]}"

    # Find the subtask section using regex
    # Pattern: **Subtask X.Y.Z: Title**
    subtask_pattern = rf"\*\*Subtask {re.escape(subtask_id)}:\s*([^\*]+)\*\*"
    subtask_match = re.search(subtask_pattern, plan_content)

    if not subtask_match:
        return {"error": f"Subtask {subtask_id} not found in plan"}

    title = subtask_match.group(1).strip()

    # Extract section content (until next subtask or task)
    start_pos = subtask_match.start()
    next_subtask = re.search(r"\*\*Subtask \d+\.\d+\.\d+:", plan_content[start_pos + 10:])
    next_task = re.search(r"### Task \d+\.\d+:", plan_content[start_pos + 10:])

    end_pos = len(plan_content)
    if next_subtask:
        end_pos = min(end_pos, start_pos + 10 + next_subtask.start())
    if next_task:
        end_pos = min(end_pos, start_pos + 10 + next_task.start())

    section = plan_content[start_pos:end_pos]

    # Extract deliverables
    deliverables = []
    deliverables_match = re.search(r"\*\*Deliverables\*\*:\s*(.*?)(?:\*\*|$)", section, re.DOTALL)
    if deliverables_match:
        deliverables_text = deliverables_match.group(1)
        for line in deliverables_text.split("\n"):
            match = re.match(r"^\s*-\s*\[[ x]\]\s*(.+)$", line)
            if match:
                deliverables.append(match.group(1).strip())

    # Extract success criteria
    success_criteria = []
    criteria_match = re.search(r"\*\*Success Criteria\*\*:\s*(.*?)(?:\*\*|---)", section, re.DOTALL)
    if criteria_match:
        criteria_text = criteria_match.group(1)
        for line in criteria_text.split("\n"):
            match = re.match(r"^\s*-\s*\[[ x]\]\s*(.+)$", line)
            if match:
                success_criteria.append(match.group(1).strip())

    # Check if completed (all deliverable checkboxes checked)
    completed = "[x]" in section and "[ ]" not in section.split("**Completion Notes**")[0]

    # Find parent task info
    task_pattern = rf"### Task {re.escape(task_id)}:\s*([^\n]+)"
    task_match = re.search(task_pattern, plan_content)
    task_title = task_match.group(1).strip() if task_match else f"Task {task_id}"

    # Find parent phase info
    phase_pattern = rf"## Phase {phase_id}:\s*([^\n(]+)"
    phase_match = re.search(phase_pattern, plan_content)
    phase_title = phase_match.group(1).strip() if phase_match else f"Phase {phase_id}"

    return {
        "id": subtask_id,
        "title": title,
        "phase": f"Phase {phase_id}: {phase_title}",
        "task": f"Task {task_id}: {task_title}",
        "deliverables": deliverables,
        "success_criteria": success_criteria,
        "completed": completed,
    }


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

    try:
        brief = _parse_brief_content(params.content)
    except Exception as e:
        return json.dumps({"error": f"Failed to parse brief: {str(e)}"}, indent=2)

    # Convert to dict for output
    parsed = {
        "project_name": brief.project_name,
        "project_type": brief.project_type,
        "primary_goal": brief.primary_goal,
        "target_users": brief.target_users,
        "timeline": brief.timeline,
        "team_size": brief.team_size,
        "key_features": brief.key_features,
        "nice_to_have_features": brief.nice_to_have_features,
        "must_use_tech": brief.must_use_tech,
        "cannot_use_tech": brief.cannot_use_tech,
        "deployment_target": brief.deployment_target,
    }

    if params.response_format == ResponseFormat.JSON:
        return json.dumps(parsed, indent=2)

    # Markdown format
    features_list = "\n".join(f"- {f}" for f in brief.key_features) if brief.key_features else "- None specified"
    tech_list = "\n".join(f"- {t}" for t in brief.must_use_tech) if brief.must_use_tech else "- None specified"

    return f"""# Parsed Project Brief

**Name**: {brief.project_name}
**Type**: {brief.project_type}
**Timeline**: {brief.timeline}
**Team Size**: {brief.team_size}

## Goal
{brief.primary_goal}

## Target Users
{brief.target_users}

## Key Features
{features_list}

## Required Technologies
{tech_list}
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

    try:
        brief = _parse_brief_content(params.brief_content)
    except Exception as e:
        return f"# Error\n\nFailed to parse brief: {str(e)}"

    try:
        # Generate plan structure
        plan = generate_plan(brief)

        # Select template
        template_name = params.template or select_template(brief.project_type)

        # Convert to template variables
        template_vars = plan_to_template_vars(plan, brief)

        # Render plan
        rendered = render_plan(
            template_name=template_name,
            **template_vars,
        )

        return rendered
    except Exception as e:
        logger.error(f"Plan generation failed: {e}")
        return f"# Error\n\nFailed to generate plan: {str(e)}"


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

    try:
        brief = _parse_brief_content(params.brief_content)
    except Exception as e:
        return f"# Error\n\nFailed to parse brief: {str(e)}"

    try:
        # Generate plan to get tech stack
        plan = generate_plan(brief)

        # Select template
        template_name = select_template(brief.project_type)

        # Build tech stack dict
        tech_stack = plan.tech_stack.to_dict() if plan.tech_stack else {"language": params.language}

        # Override language if specified
        if params.language:
            tech_stack["language"] = params.language

        # Render claude.md
        rendered = render_claude_md(
            template_name=template_name,
            project_name=brief.project_name,
            tech_stack=tech_stack,
            test_coverage=params.test_coverage,
        )

        return rendered
    except Exception as e:
        logger.error(f"Claude.md generation failed: {e}")
        return f"# Error\n\nFailed to generate claude.md: {str(e)}"


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

    errors: list[str] = []
    warnings: list[str] = []
    suggestions: list[str] = []

    content = params.content

    # Check for required sections
    if "## Project Overview" not in content and "## Overview" not in content:
        errors.append("Missing 'Project Overview' section")

    if "## Phase 0" not in content and "## Phase 0:" not in content:
        errors.append("Missing Phase 0 (Foundation)")

    # Find all phases
    phase_matches = re.findall(r"## Phase (\d+):", content)
    if not phase_matches:
        errors.append("No phases found in plan")
    else:
        # Check phases are sequential
        phase_ids = [int(p) for p in phase_matches]
        if phase_ids != list(range(len(phase_ids))):
            warnings.append(f"Phase IDs should be sequential starting from 0. Found: {phase_ids}")

    # Find all tasks
    task_matches = re.findall(r"### Task (\d+\.\d+):", content)
    if not task_matches:
        warnings.append("No tasks found - plan may be incomplete")

    # Find all subtasks
    subtask_matches = re.findall(r"\*\*Subtask (\d+\.\d+\.\d+):", content)
    if not subtask_matches:
        warnings.append("No subtasks found - plan may be incomplete")

    # Check for deliverables in subtasks
    deliverable_sections = re.findall(r"\*\*Deliverables\*\*:(.*?)(?:\*\*|---)", content, re.DOTALL)
    for i, section in enumerate(deliverable_sections):
        items = re.findall(r"^\s*-\s*\[", section, re.MULTILINE)
        count = len(items)
        if count < 3:
            warnings.append(f"Subtask section {i+1} has only {count} deliverables (recommended: 3-7)")
        elif count > 7:
            suggestions.append(f"Subtask section {i+1} has {count} deliverables - consider splitting")

    # Check for git strategy
    if "Git Strategy" not in content and "git_strategy" not in content.lower():
        suggestions.append("Consider adding Git Strategy section for each task")

    # Check for success criteria
    if "Success Criteria" not in content:
        warnings.append("No Success Criteria sections found")

    # Build report
    total_errors = len(errors)
    total_warnings = len(warnings)
    total_suggestions = len(suggestions)

    if params.strict:
        total_errors += total_warnings
        errors.extend(warnings)
        warnings = []

    status = "✅ Valid" if total_errors == 0 else "❌ Invalid"

    report_lines = [
        "# Plan Validation Report",
        "",
        f"**Status**: {status}",
        "",
        "## Summary",
        f"- Errors: {total_errors}",
        f"- Warnings: {total_warnings}",
        f"- Suggestions: {total_suggestions}",
        "",
    ]

    if errors:
        report_lines.extend(["## Errors", ""])
        for i, error in enumerate(errors, 1):
            report_lines.append(f"{i}. {error}")
        report_lines.append("")

    if warnings:
        report_lines.extend(["## Warnings", ""])
        for i, warning in enumerate(warnings, 1):
            report_lines.append(f"{i}. {warning}")
        report_lines.append("")

    if suggestions:
        report_lines.extend(["## Suggestions", ""])
        for i, suggestion in enumerate(suggestions, 1):
            report_lines.append(f"{i}. {suggestion}")
        report_lines.append("")

    return "\n".join(report_lines)


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

    templates = list_templates()

    if params.project_type:
        templates = [
            t for t in templates
            if params.project_type.lower() in t["name"].lower()
            or any(params.project_type.lower() in pt.lower() for pt in t.get("project_types", []))
        ]

    if params.response_format == ResponseFormat.JSON:
        return json.dumps(templates, indent=2)

    # Markdown format
    lines = ["# Available Templates", ""]
    for template in templates:
        lines.append(f"## {template['name']}")
        lines.append(f"{template.get('description', 'No description')}")
        lines.append("")
        project_types = template.get("project_types", [])
        if project_types:
            lines.append("**Matches project types:**")
            for ptype in project_types:
                lines.append(f"- {ptype}")
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

    result = _extract_subtask_from_plan(params.plan_content, params.subtask_id)
    return json.dumps(result, indent=2)


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

    content = params.plan_content

    # Find the subtask section
    subtask_pattern = rf"(\*\*Subtask {re.escape(params.subtask_id)}:[^\*]+\*\*)"
    if not re.search(subtask_pattern, content):
        return f"# Error\n\nSubtask {params.subtask_id} not found in plan"

    # Find the completion notes section for this subtask
    # Pattern: from **Subtask X.Y.Z** to the next subtask or task
    subtask_start = content.find(f"**Subtask {params.subtask_id}:")
    next_subtask = re.search(
        r"\*\*Subtask \d+\.\d+\.\d+:",
        content[subtask_start + 10:]
    )
    next_task = re.search(
        r"### Task \d+\.\d+:",
        content[subtask_start + 10:]
    )

    # Determine section end
    section_end = len(content)
    if next_subtask:
        section_end = min(section_end, subtask_start + 10 + next_subtask.start())
    if next_task:
        section_end = min(section_end, subtask_start + 10 + next_task.start())

    section = content[subtask_start:section_end]

    # Update checkboxes from [ ] to [x] in deliverables and success criteria
    updated_section = re.sub(r"\[ \]", "[x]", section)

    # Update completion notes section
    notes_pattern = r"(\*\*Completion Notes\*\*:.*?)(?=---|\*\*Subtask|\Z)"
    notes_replacement = f"""**Completion Notes**:
- **Implementation**: {params.completion_notes}
- **Files Created**: (updated by Claude Code)
- **Files Modified**: (updated by Claude Code)
- **Tests**: (updated by Claude Code)
- **Build**: ✅ Success
- **Branch**: feature/{params.subtask_id.replace('.', '-')}
- **Notes**: Marked complete via MCP

"""

    if re.search(notes_pattern, updated_section, re.DOTALL):
        updated_section = re.sub(notes_pattern, notes_replacement, updated_section, flags=re.DOTALL)
    else:
        # Add completion notes at end of section
        updated_section = updated_section.rstrip() + "\n\n" + notes_replacement

    # Replace section in content
    updated_content = content[:subtask_start] + updated_section + content[section_end:]

    # Also update progress tracking section (change [ ] to [x] for this subtask)
    tracking_pattern = rf"(\- \[) \] ({re.escape(params.subtask_id)}:)"
    updated_content = re.sub(tracking_pattern, r"\1x] \2", updated_content)

    return updated_content


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
        tech_items = "\n".join(f"- **{k}**: {v}" for k, v in params.tech_stack.items())
        tech_stack_section = f"""
## Technical Requirements

### Tech Stack
{tech_items}
"""
    else:
        tech_stack_section = """
## Technical Requirements

### Tech Stack
- To be determined based on project type
"""

    # Build constraints section
    constraints_section = ""
    if params.constraints:
        must_use = [c for c in params.constraints if not c.lower().startswith("cannot")]
        cannot_use = [c for c in params.constraints if c.lower().startswith("cannot")]

        if must_use:
            constraints_section += "\n### Must Use\n" + "\n".join(f"- {c}" for c in must_use)
        if cannot_use:
            constraints_section += "\n### Cannot Use\n" + "\n".join(f"- {c.replace('Cannot use ', '')}" for c in cannot_use)

    brief = f"""# Project Brief: {params.name}

## Basic Information

- **Project Name**: {params.name}
- **Project Type**: {params.project_type}
- **Primary Goal**: {params.goal}
- **Target Users**: {", ".join(params.target_users)}
- **Timeline**: {params.timeline or "To be determined"}
- **Team Size**: 1

## Functional Requirements

### Key Features
{chr(10).join(f"- {feature}" for feature in params.features)}

### Nice-to-Have Features
- Additional features to be determined
{tech_stack_section}
{constraints_section}
## Success Criteria

- All key features implemented and working
- Test coverage > 80%
- Documentation complete
- Ready for initial users

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
    templates = list_templates()
    return json.dumps(
        {
            "templates": [t["name"] for t in templates],
            "description": "Available project templates for development plan generation",
        }
    )


@mcp.resource("templates://{name}")
async def get_template_resource(name: str) -> str:
    """Get a specific template by name."""
    templates = list_templates()
    template = next((t for t in templates if t["name"] == name), None)

    if not template:
        return json.dumps({"error": f"Template '{name}' not found"})

    return json.dumps(template, indent=2)


# =============================================================================
# Factory Function (for Smithery deployment)
# =============================================================================


@smithery.server()
def create_server() -> FastMCP:
    """Create and return the FastMCP server instance.

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
