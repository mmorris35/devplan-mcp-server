"""Data models for devplan-mcp server.

This module defines the core data structures used throughout the MCP server,
including ProjectBrief, Phase, Task, Subtask, TechStack, GitStrategy,
and DevelopmentPlan models using Pydantic for validation.

Ported from ClaudeCode-DevPlanBuilder claude_planner.models module.
"""

from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GitStrategy(BaseModel):
    """Represents the git workflow strategy for a task.

    Defines the branching and commit strategy to follow when working on a task.
    All subtasks within the task share the same branch - each subtask commits
    to the branch, and the branch is merged when the entire task is complete.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    branch_name: str = Field(..., description="Name of the branch to create for this task")
    branch_from: str = Field(
        default="main", description="Which branch to create the new branch from"
    )
    commit_prefix: str = Field(
        default="feat", description="Semantic commit prefix (feat, fix, refactor, etc.)"
    )
    merge_strategy: str = Field(
        default="squash", description="How to merge back (merge, squash, rebase)"
    )
    pr_required: bool = Field(default=False, description="Whether a PR is required before merging")


class Subtask(BaseModel):
    """Represents a single subtask in a development plan.

    A subtask is a unit of work that should be completable in a single session.
    Git strategy is inherited from the parent Task.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(..., description="Subtask ID in format 'X.Y.Z' (e.g., '1.2.3')")
    title: str = Field(..., description="Short descriptive title (should include 'Single Session')")
    deliverables: list[str] = Field(default_factory=list, description="List of deliverable items")
    prerequisites: list[str] = Field(
        default_factory=list, description="List of prerequisite subtask IDs"
    )
    files_to_create: list[str] = Field(
        default_factory=list, description="List of files to be created"
    )
    files_to_modify: list[str] = Field(
        default_factory=list, description="List of files to be modified"
    )
    success_criteria: list[str] = Field(
        default_factory=list, description="List of success criteria"
    )
    technology_decisions: list[str] = Field(
        default_factory=list, description="List of technology choices made"
    )
    status: str = Field(default="pending", description="Current status")
    completion_notes: dict[str, str] = Field(
        default_factory=dict, description="Notes added when subtask is completed"
    )

    @field_validator("id")
    @classmethod
    def validate_id_format(cls, v: str) -> str:
        """Validate subtask ID is in format X.Y.Z."""
        if not re.match(r"^\d+\.\d+\.\d+$", v):
            raise ValueError(f"Subtask ID '{v}' must be in format X.Y.Z (e.g., '1.2.3')")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate status is one of the allowed values."""
        valid_statuses = ["pending", "in_progress", "completed", "blocked"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

    def validate_best_practices(self) -> list[str]:
        """Validate the subtask follows best practices (non-fatal warnings).

        Returns:
            List of warning messages. Empty list if all good.
        """
        warnings = []

        # Warn if title doesn't include "(Single Session)"
        if "(Single Session)" not in self.title:
            warnings.append("Subtask title should include '(Single Session)' suffix")

        # Warn about deliverables count (3-7 recommended)
        if len(self.deliverables) < 3:
            warnings.append(
                f"Subtask has {len(self.deliverables)} deliverables, recommended minimum is 3"
            )
        elif len(self.deliverables) > 7:
            warnings.append(
                f"Subtask has {len(self.deliverables)} deliverables, recommended maximum is 7"
            )

        return warnings


class Task(BaseModel):
    """Represents a task in a development plan.

    A task groups related subtasks together and belongs to a phase.
    Each task has its own git strategy - all subtasks within the task
    work on the same branch and commit to it.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(..., description="Task ID in format 'X.Y' (e.g., '1.2')")
    title: str = Field(..., description="Short descriptive title")
    description: str = Field(default="", description="Longer description of the task")
    git_strategy: GitStrategy | None = Field(
        default=None, description="Git workflow strategy for this task"
    )
    subtasks: list[Subtask] = Field(default_factory=list, description="List of subtasks")

    @field_validator("id")
    @classmethod
    def validate_id_format(cls, v: str) -> str:
        """Validate task ID is in format X.Y."""
        if not re.match(r"^\d+\.\d+$", v):
            raise ValueError(f"Task ID '{v}' must be in format X.Y (e.g., '1.2')")
        return v

    def validate_structure(self) -> list[str]:
        """Validate the task structure.

        Returns:
            List of error messages. Empty list if valid.
        """
        errors = []

        # Validate has at least one subtask
        if len(self.subtasks) == 0:
            errors.append(f"Task '{self.id}' must have at least one subtask")

        # Validate all subtasks
        for subtask in self.subtasks:
            subtask_warnings = subtask.validate_best_practices()
            errors.extend([f"Subtask {subtask.id}: {warn}" for warn in subtask_warnings])

        return errors


class Phase(BaseModel):
    """Represents a phase in a development plan.

    A phase groups related tasks together and represents a major milestone.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(..., description="Phase ID (integer as string, e.g., '0', '1')")
    title: str = Field(..., description="Short descriptive title")
    goal: str = Field(..., description="What this phase aims to achieve")
    days: str = Field(default="", description="Estimated number of days")
    description: str = Field(default="", description="Longer description of the phase")
    tasks: list[Task] = Field(default_factory=list, description="List of tasks")

    @field_validator("id")
    @classmethod
    def validate_id_is_numeric(cls, v: str) -> str:
        """Validate phase ID is numeric."""
        if not v.isdigit():
            raise ValueError(f"Phase ID '{v}' must be a number")
        return v

    def validate_structure(self) -> list[str]:
        """Validate the phase structure.

        Returns:
            List of error/warning messages. Empty list if valid.
        """
        errors = []

        # Warn if phase 0 is not "Foundation"
        if self.id == "0" and "Foundation" not in self.title:
            errors.append(f"Phase 0 should be titled 'Foundation', got '{self.title}' (warning)")

        # Validate has at least one task
        if len(self.tasks) == 0:
            errors.append(f"Phase '{self.id}' must have at least one task")

        # Validate all tasks
        for task in self.tasks:
            task_errors = task.validate_structure()
            errors.extend([f"Task {task.id}: {error}" for error in task_errors])

        return errors


class TechStack(BaseModel):
    """Represents the technology stack for a project."""

    model_config = ConfigDict(str_strip_whitespace=True)

    language: str = Field(..., min_length=1, description="Primary programming language")
    framework: str = Field(default="", description="Main framework")
    database: str = Field(default="", description="Database choice")
    testing: str = Field(default="", description="Testing framework")
    linting: str = Field(default="", description="Linting tool")
    type_checking: str = Field(default="", description="Type checking tool")
    deployment: str = Field(default="", description="Deployment target")
    ci_cd: str = Field(default="", description="CI/CD platform")
    additional_tools: dict[str, str] = Field(
        default_factory=dict, description="Additional tools/libraries"
    )

    def to_dict(self) -> dict[str, str]:
        """Convert TechStack to a dictionary for template rendering.

        Returns:
            Dictionary with all non-empty technology choices.
        """
        result = {"language": self.language}

        if self.framework:
            result["framework"] = self.framework
        if self.database:
            result["database"] = self.database
        if self.testing:
            result["testing"] = self.testing
        if self.linting:
            result["linting"] = self.linting
        if self.type_checking:
            result["type_checking"] = self.type_checking
        if self.deployment:
            result["deployment"] = self.deployment
        if self.ci_cd:
            result["ci_cd"] = self.ci_cd

        # Add additional tools
        result.update(self.additional_tools)

        return result


class ProjectBrief(BaseModel):
    """Represents a parsed PROJECT_BRIEF.md file with all project requirements."""

    model_config = ConfigDict(str_strip_whitespace=True)

    # Basic Information (required)
    project_name: str = Field(..., min_length=1, description="The name of the project")
    project_type: str = Field(
        ..., min_length=1, description="Type of project (CLI Tool, Library, Web App, API)"
    )
    primary_goal: str = Field(..., min_length=1, description="The main objective/purpose")
    target_users: str = Field(..., min_length=1, description="Who will use this project")
    timeline: str = Field(..., min_length=1, description="Expected development timeline")
    team_size: str = Field(default="1", description="Number of developers on the team")

    # Functional Requirements
    key_features: list[str] = Field(
        default_factory=list, description="List of must-have features for MVP"
    )
    nice_to_have_features: list[str] = Field(
        default_factory=list, description="List of features for future versions"
    )

    # Technical Constraints
    must_use_tech: list[str] = Field(
        default_factory=list, description="Required technologies/frameworks"
    )
    cannot_use_tech: list[str] = Field(
        default_factory=list, description="Prohibited technologies/frameworks"
    )
    deployment_target: str | None = Field(
        default=None, description="Where the project will be deployed"
    )
    budget_constraints: str | None = Field(default=None, description="Budget limitations")

    # Quality Requirements
    performance_requirements: dict[str, str] = Field(
        default_factory=dict, description="Performance metrics and targets"
    )
    security_requirements: dict[str, str] = Field(
        default_factory=dict, description="Security considerations"
    )
    scalability_requirements: dict[str, str] = Field(
        default_factory=dict, description="Scalability needs"
    )
    availability_requirements: dict[str, str] = Field(
        default_factory=dict, description="Availability/uptime requirements"
    )

    # Team & Resources
    team_composition: str | None = Field(default=None, description="Team structure and skill levels")
    existing_knowledge: list[str] = Field(
        default_factory=list, description="Technologies team already knows"
    )
    learning_budget: str | None = Field(
        default=None, description="Time allocated for learning new technologies"
    )
    infrastructure_access: list[str] = Field(
        default_factory=list, description="Available infrastructure and tools"
    )

    # Success Criteria
    success_criteria: list[str] = Field(
        default_factory=list, description="How success will be measured"
    )

    # Integration Requirements
    external_systems: list[dict[str, str]] = Field(
        default_factory=list, description="List of external systems to integrate with"
    )
    data_sources: list[dict[str, str]] = Field(
        default_factory=list, description="Input data sources"
    )
    data_destinations: list[dict[str, str]] = Field(
        default_factory=list, description="Output data destinations"
    )

    # Known Challenges
    known_challenges: list[str] = Field(
        default_factory=list, description="Identified risks and challenges"
    )

    # Reference Materials
    reference_materials: list[str] = Field(
        default_factory=list, description="Links to documentation and resources"
    )
    questions_and_clarifications: list[str] = Field(
        default_factory=list, description="Open questions and decisions made"
    )

    # Architecture
    architecture_vision: str | None = Field(
        default=None, description="High-level architecture description"
    )
    use_cases: list[str] = Field(default_factory=list, description="Example usage scenarios")
    deliverables: list[str] = Field(default_factory=list, description="Expected project deliverables")


class DevelopmentPlan(BaseModel):
    """Represents a complete development plan with all phases."""

    model_config = ConfigDict(str_strip_whitespace=True)

    project_name: str = Field(..., min_length=1, description="Name of the project")
    phases: list[Phase] = Field(default_factory=list, description="List of phases")
    tech_stack: TechStack | None = Field(
        default=None, description="Technology stack for the project"
    )

    def get_all_subtask_ids(self) -> set[str]:
        """Get all subtask IDs in the plan."""
        subtask_ids = set()
        for phase in self.phases:
            for task in phase.tasks:
                for subtask in task.subtasks:
                    subtask_ids.add(subtask.id)
        return subtask_ids

    def validate_prerequisites(self) -> list[str]:
        """Validate that all prerequisites reference existing subtasks."""
        errors = []
        all_subtask_ids = self.get_all_subtask_ids()

        for phase in self.phases:
            for task in phase.tasks:
                for subtask in task.subtasks:
                    for prereq in subtask.prerequisites:
                        if prereq not in all_subtask_ids:
                            errors.append(
                                f"Subtask {subtask.id}: prerequisite '{prereq}' "
                                "does not exist in the plan"
                            )

        return errors

    def validate_circular_dependencies(self) -> list[str]:
        """Validate that there are no circular dependencies."""
        errors = []

        # Build prerequisite graph
        prereq_graph: dict[str, list[str]] = {}
        for phase in self.phases:
            for task in phase.tasks:
                for subtask in task.subtasks:
                    prereq_graph[subtask.id] = subtask.prerequisites

        # Detect cycles using DFS
        visited: set[str] = set()
        rec_stack: set[str] = set()

        def has_cycle(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)

            for neighbor in prereq_graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        # Check each subtask for cycles
        for subtask_id in prereq_graph:
            if subtask_id not in visited and has_cycle(subtask_id):
                errors.append(f"Circular dependency detected involving subtask {subtask_id}")

        return errors

    def validate_all(self) -> list[str]:
        """Validate the entire development plan.

        Returns:
            List of all validation error messages.
        """
        errors = []

        # Validate has phases
        if len(self.phases) == 0:
            errors.append("Development plan must have at least one phase")

        # Validate each phase
        for phase in self.phases:
            phase_errors = phase.validate_structure()
            errors.extend(phase_errors)

        # Validate tech stack if provided
        # (TechStack Pydantic model handles its own validation)

        # Cross-model validation
        errors.extend(self.validate_prerequisites())
        errors.extend(self.validate_circular_dependencies())

        return errors
