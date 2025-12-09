"""Plan generation pipeline.

This module provides functions to generate development plans, tech stacks,
phases, tasks, and subtasks from project briefs.

Ported from ClaudeCode-DevPlanBuilder claude_planner.generator modules.
"""

from __future__ import annotations

from typing import Any

from devplan_mcp.models import (
    DevelopmentPlan,
    Phase,
    ProjectBrief,
    TechStack,
)
from devplan_mcp.templates import select_template

# =============================================================================
# Default Phase Templates per Project Type
# =============================================================================

DEFAULT_PHASES: dict[str, list[dict[str, str]]] = {
    "base": [
        {"title": "Foundation", "goal": "Set up project infrastructure and development environment"},
        {"title": "Core Features", "goal": "Implement primary functionality"},
        {"title": "Polish & Testing", "goal": "Refine features and ensure quality"},
        {"title": "Documentation & Release", "goal": "Complete documentation and prepare for release"},
    ],
    "cli": [
        {"title": "Foundation", "goal": "Set up CLI project structure and argument parsing"},
        {"title": "Core Commands", "goal": "Implement primary CLI commands"},
        {"title": "Advanced Features", "goal": "Add options, configuration, and error handling"},
        {"title": "Polish & Release", "goal": "Testing, documentation, and PyPI packaging"},
    ],
    "web_app": [
        {"title": "Foundation", "goal": "Set up frontend and backend infrastructure"},
        {"title": "Authentication & Users", "goal": "Implement user management and auth flows"},
        {"title": "Core Features", "goal": "Build primary application features"},
        {"title": "Integration & Polish", "goal": "Connect components, add styling, deploy"},
    ],
    "api": [
        {"title": "Foundation", "goal": "Set up API framework and database connections"},
        {"title": "Core Endpoints", "goal": "Implement primary API endpoints"},
        {"title": "Auth & Security", "goal": "Add authentication, validation, rate limiting"},
        {"title": "Documentation & Deploy", "goal": "API docs, testing, containerization"},
    ],
    "library": [
        {"title": "Foundation", "goal": "Set up package structure and tooling"},
        {"title": "Core API", "goal": "Implement primary library functions/classes"},
        {"title": "Advanced Features", "goal": "Add edge case handling and optimizations"},
        {"title": "Release", "goal": "Documentation, examples, and package publishing"},
    ],
}


# =============================================================================
# Tech Stack Generation
# =============================================================================


def generate_tech_stack(brief: ProjectBrief) -> TechStack:
    """Generate TechStack from ProjectBrief requirements.

    Strategy:
    1. Check for conflicts between must_use and cannot_use
    2. Apply sensible defaults based on project type
    3. Pass through must_use items as additional_tools

    Args:
        brief: ProjectBrief with project requirements and constraints

    Returns:
        TechStack with selected technologies

    Raises:
        ValueError: If must_use and cannot_use constraints conflict
    """
    # Normalize constraints for comparison
    must_use = [tech.lower() for tech in brief.must_use_tech]
    cannot_use = [tech.lower() for tech in brief.cannot_use_tech]

    # Check for conflicts
    conflicts = set(must_use) & set(cannot_use)
    if conflicts:
        raise ValueError(
            f"Conflicting constraints: {conflicts} appears in both "
            "must_use_tech and cannot_use_tech"
        )

    # Determine language from must_use or default
    language = "Python 3.11+"
    for tech in brief.must_use_tech:
        tech_lower = tech.lower()
        if any(lang in tech_lower for lang in ["python", "typescript", "javascript", "go", "rust"]):
            language = tech
            break

    # Set defaults based on language
    is_python = "python" in language.lower()
    is_typescript = "typescript" in language.lower()
    is_javascript = "javascript" in language.lower()

    testing = ""
    linting = ""
    type_checking = ""
    framework = ""

    if is_python:
        testing = "pytest"
        linting = "ruff"
        type_checking = "mypy"
    elif is_typescript or is_javascript:
        testing = "jest"
        linting = "eslint"
        type_checking = "TypeScript" if is_typescript else ""

    # Check project type for framework hints
    project_type_lower = brief.project_type.lower()
    if "cli" in project_type_lower and is_python:
        framework = "Click"
    elif "api" in project_type_lower and is_python:
        framework = "FastAPI"
    elif "web" in project_type_lower:
        if is_python:
            framework = "Flask"
        elif is_typescript or is_javascript:
            framework = "React"

    # Add must_use items to additional_tools
    additional_tools: dict[str, str] = {}
    for i, tech in enumerate(brief.must_use_tech):
        additional_tools[f"required_{i+1}"] = tech

    return TechStack(
        language=language,
        framework=framework,
        database="",
        testing=testing,
        linting=linting,
        type_checking=type_checking,
        deployment=brief.deployment_target or "",
        ci_cd="GitHub Actions",
        additional_tools=additional_tools,
    )


# =============================================================================
# Phase Generation
# =============================================================================


def generate_phases(brief: ProjectBrief) -> list[Phase]:
    """Generate Phase list from ProjectBrief and template defaults.

    Args:
        brief: ProjectBrief with project requirements

    Returns:
        List of Phase objects with basic structure from template
    """
    # Select template based on project type
    template_name = select_template(brief.project_type)

    # Get default phases for template (or use base)
    phase_templates = DEFAULT_PHASES.get(template_name, DEFAULT_PHASES["base"])

    # Create Phase objects
    phases: list[Phase] = []
    for i, phase_template in enumerate(phase_templates):
        phase = Phase(
            id=str(i),
            title=phase_template["title"],
            goal=phase_template["goal"],
            days="",  # Claude will determine timeline distribution
            description="",
            tasks=[],
        )
        phases.append(phase)

    return phases


# =============================================================================
# Plan Generation Pipeline
# =============================================================================


def generate_plan(brief: ProjectBrief) -> DevelopmentPlan:
    """Generate complete development plan from project brief.

    This is the main orchestration function that:
    1. Generates tech stack from brief
    2. Generates phases from brief and template
    3. Assembles into DevelopmentPlan
    4. Validates the plan structure

    Note: Tasks and subtasks are left empty - Claude Code will populate
    them intelligently when using the template.

    Args:
        brief: ProjectBrief with project requirements

    Returns:
        Complete DevelopmentPlan with tech stack and phase structure

    Raises:
        ValueError: If plan validation fails
    """
    # Generate tech stack
    tech_stack = generate_tech_stack(brief)

    # Generate phases
    phases = generate_phases(brief)

    # Assemble the plan
    plan = DevelopmentPlan(
        project_name=brief.project_name,
        phases=phases,
        tech_stack=tech_stack,
    )

    # Validate structure
    errors = _validate_plan_structure(plan)
    if errors:
        error_msg = "\n".join(errors)
        raise ValueError(f"Plan validation failed:\n{error_msg}")

    return plan


def _validate_plan_structure(plan: DevelopmentPlan) -> list[str]:
    """Validate basic plan structure."""
    errors = []

    if not plan.project_name or not plan.project_name.strip():
        errors.append("Project name is required")

    if not plan.phases:
        errors.append("Plan must have at least one phase")

    if plan.phases:
        phase_0 = plan.phases[0]
        if phase_0.id != "0":
            errors.append("First phase must have ID '0'")
        if "Foundation" not in phase_0.title:
            errors.append("Phase 0 should be titled 'Foundation'")

    if not plan.tech_stack:
        errors.append("Plan must have a tech stack")

    return errors


# =============================================================================
# Plan to Template Variables Conversion
# =============================================================================


def plan_to_template_vars(plan: DevelopmentPlan, brief: ProjectBrief) -> dict[str, Any]:
    """Convert DevelopmentPlan to template variables for rendering.

    Args:
        plan: The generated development plan
        brief: The original project brief

    Returns:
        Dictionary of template variables for Jinja2 rendering
    """
    # Convert tech stack to dict
    tech_stack_dict = plan.tech_stack.to_dict() if plan.tech_stack else {}

    # Convert phases to dicts
    phases_list = []
    for phase in plan.phases:
        phase_dict: dict[str, Any] = {
            "id": phase.id,
            "title": phase.title,
            "goal": phase.goal,
            "days": phase.days,
            "description": phase.description,
            "tasks": [],
        }

        for task in phase.tasks:
            task_dict: dict[str, Any] = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "git_strategy": None,
                "subtasks": [],
            }

            if task.git_strategy:
                task_dict["git_strategy"] = {
                    "branch_name": task.git_strategy.branch_name,
                    "branch_from": task.git_strategy.branch_from,
                    "commit_prefix": task.git_strategy.commit_prefix,
                    "merge_strategy": task.git_strategy.merge_strategy,
                    "pr_required": task.git_strategy.pr_required,
                }

            for subtask in task.subtasks:
                subtask_dict = {
                    "id": subtask.id,
                    "title": subtask.title,
                    "deliverables": subtask.deliverables,
                    "prerequisites": subtask.prerequisites,
                    "files_to_create": subtask.files_to_create,
                    "files_to_modify": subtask.files_to_modify,
                    "success_criteria": subtask.success_criteria,
                    "technology_decisions": subtask.technology_decisions,
                    "status": subtask.status,
                    "completion_notes": subtask.completion_notes,
                }
                task_dict["subtasks"].append(subtask_dict)

            phase_dict["tasks"].append(task_dict)

        phases_list.append(phase_dict)

    return {
        "project_name": plan.project_name,
        "goal": brief.primary_goal,
        "target_users": brief.target_users,
        "timeline": brief.timeline,
        "tech_stack": tech_stack_dict,
        "phases": phases_list,
        "mvp_scope": brief.key_features,
        "key_features": brief.key_features,
        "current_phase": 0,
        "next_subtask": "0.1.1" if phases_list else None,
    }
