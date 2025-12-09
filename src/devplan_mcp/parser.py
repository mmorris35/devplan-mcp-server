"""Parser for PROJECT_BRIEF.md files.

This module provides functions to parse PROJECT_BRIEF.md content and convert it
to validated ProjectBrief model instances.

Ported from ClaudeCode-DevPlanBuilder claude_planner.generator modules:
- parser.py (markdown parsing utilities)
- brief_extractor.py (field extraction)
- brief_converter.py (model conversion)
- brief_parser.py (main pipeline)
"""

from __future__ import annotations

import re
from typing import Any

from devplan_mcp.models import ProjectBrief

# =============================================================================
# Markdown Parsing Utilities
# =============================================================================


def parse_markdown_content(content: str) -> dict[str, str]:
    """Parse markdown content and extract sections by heading.

    Splits content into sections based on ## headings. Each section includes
    all content until the next heading of the same or higher level.

    Args:
        content: Markdown content as a string

    Returns:
        Dictionary mapping section headings to their content
    """
    sections: dict[str, str] = {}
    lines = content.split("\n")

    current_section: str | None = None
    current_content: list[str] = []

    for line in lines:
        # Check if this is a heading line (## or higher)
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)

        if heading_match:
            # Save previous section if it exists
            if current_section is not None:
                sections[current_section] = "\n".join(current_content).strip()

            # Start new section
            heading_level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()

            # Only track ## level headings and below
            if heading_level >= 2:
                current_section = heading_text
                current_content = []
        elif current_section is not None:
            # Add line to current section content
            current_content.append(line)

    # Save final section
    if current_section is not None:
        sections[current_section] = "\n".join(current_content).strip()

    return sections


def extract_list_items(text: str) -> list[str]:
    """Extract list items from markdown text.

    Handles both unordered (-) and ordered (1.) list formats.
    """
    items: list[str] = []
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Match unordered list item (-, *, +)
        unordered_match = re.match(r"^[-*+]\s+(.+)$", line)
        if unordered_match:
            items.append(unordered_match.group(1).strip())
            continue

        # Match ordered list item (1., 2., etc.)
        ordered_match = re.match(r"^\d+\.\s+(.+)$", line)
        if ordered_match:
            items.append(ordered_match.group(1).strip())
            continue

    return items


def extract_field_value(text: str, field_name: str) -> str:
    """Extract a field value from markdown text.

    Looks for patterns like "- **Field Name**: value" or "**Field Name**: value".
    """
    lines = text.split("\n")

    for line in lines:
        line = line.strip()

        # Pattern: - **Field**: value or **Field**: value
        pattern = rf"^-?\s*\*\*{re.escape(field_name)}\*\*:\s*(.+)$"
        match = re.match(pattern, line, re.IGNORECASE)

        if match:
            value = match.group(1).strip()
            # Remove markdown checkboxes like [x] or [ ]
            value = re.sub(r"^\[[ x]\]\s*", "", value)
            return value

    return ""


def extract_checkbox_fields(text: str) -> dict[str, bool]:
    """Extract checkbox fields from markdown text.

    Looks for patterns like "- [x] Field" or "- [ ] Field".
    """
    fields: dict[str, bool] = {}
    lines = text.split("\n")

    for line in lines:
        line = line.strip()

        # Pattern: - [x] or - [ ]
        checked_match = re.match(r"^-?\s*\[x\]\s+(.+)$", line, re.IGNORECASE)
        if checked_match:
            fields[checked_match.group(1).strip()] = True
            continue

        unchecked_match = re.match(r"^-?\s*\[\s\]\s+(.+)$", line)
        if unchecked_match:
            fields[unchecked_match.group(1).strip()] = False
            continue

    return fields


# =============================================================================
# Field Extraction
# =============================================================================


def extract_basic_info(sections: dict[str, str]) -> dict[str, str | list[str]]:
    """Extract basic project information from markdown sections."""
    basic_info_section = sections.get("Basic Information", "")

    # Extract simple fields
    project_name = extract_field_value(basic_info_section, "Project Name")
    primary_goal = extract_field_value(basic_info_section, "Primary Goal")
    target_users = extract_field_value(basic_info_section, "Target Users")
    timeline = extract_field_value(basic_info_section, "Timeline")
    team_size = extract_field_value(basic_info_section, "Team Size")

    # Extract project type - special case, checkboxes on same line
    project_type: list[str] = []
    project_type_line = extract_field_value(basic_info_section, "Project Type")
    if project_type_line:
        parts = project_type_line.split("+")
        for part in parts:
            part = part.strip()
            if re.match(r"\[x\]", part, re.IGNORECASE):
                clean_part = re.sub(r"\[x\]\s*", "", part, flags=re.IGNORECASE).strip()
                if clean_part:
                    project_type.append(clean_part)
            elif not part.startswith("["):
                if part:
                    project_type.append(part)

    return {
        "project_name": project_name,
        "project_type": project_type,
        "primary_goal": primary_goal,
        "target_users": target_users,
        "timeline": timeline,
        "team_size": team_size,
    }


def extract_requirements(sections: dict[str, str]) -> dict[str, list[str]]:
    """Extract functional requirements from markdown sections."""
    input_items = extract_list_items(sections.get("Input", ""))
    output_items = extract_list_items(sections.get("Output", ""))
    key_features = extract_list_items(sections.get("Key Features", ""))
    nice_to_have = extract_list_items(sections.get("Nice-to-Have Features", ""))

    return {
        "input": input_items,
        "output": output_items,
        "key_features": key_features,
        "nice_to_have": nice_to_have,
    }


def extract_tech_constraints(sections: dict[str, str]) -> dict[str, list[str]]:
    """Extract technical constraints from markdown sections."""
    must_use = extract_list_items(sections.get("Must Use", ""))
    cannot_use = extract_list_items(sections.get("Cannot Use", ""))
    deployment_target = extract_list_items(sections.get("Deployment Target", ""))

    return {
        "must_use": must_use,
        "cannot_use": cannot_use,
        "deployment_target": deployment_target,
    }


def extract_quality_requirements(sections: dict[str, str]) -> dict[str, dict[str, str]]:
    """Extract quality requirements from markdown sections."""
    performance_section = sections.get("Performance", "")
    security_section = sections.get("Security", "")
    scalability_section = sections.get("Scalability", "")

    def extract_key_value_pairs(section: str) -> dict[str, str]:
        result: dict[str, str] = {}
        for line in section.split("\n"):
            if "**" in line and ":" in line:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    field = parts[0].strip().replace("**", "").replace("-", "").strip()
                    value = parts[1].strip()
                    if field and value:
                        result[field] = value
        return result

    return {
        "performance": extract_key_value_pairs(performance_section),
        "security": extract_key_value_pairs(security_section),
        "scalability": extract_key_value_pairs(scalability_section),
    }


def extract_team_info(sections: dict[str, str]) -> dict[str, Any]:
    """Extract team and resources information from markdown sections."""
    team_composition_section = sections.get("Team Composition", "")
    existing_knowledge_section = sections.get("Existing Knowledge", "")
    infrastructure_section = sections.get("Infrastructure Access", "")

    team_composition = extract_checkbox_fields(team_composition_section)
    existing_knowledge = extract_list_items(existing_knowledge_section)
    infrastructure = extract_list_items(infrastructure_section)

    return {
        "team_composition": team_composition,
        "existing_knowledge": existing_knowledge,
        "infrastructure": infrastructure,
    }


# =============================================================================
# Model Conversion
# =============================================================================


def _get_string_field(
    data: dict[str, Any],
    field_name: str,
    required: bool = False,
    default: str = "",
) -> str:
    """Extract a string field from a dictionary."""
    value = data.get(field_name, default)

    if isinstance(value, list):
        value = ", ".join(str(v) for v in value) if value else ""
    else:
        value = str(value) if value is not None else ""

    if required and not value.strip():
        raise ValueError(f"Required field '{field_name}' is missing or empty")

    return value.strip()


def convert_to_project_brief(
    basic_info: dict[str, Any],
    requirements: dict[str, list[str]],
    tech_constraints: dict[str, list[str]],
    quality_requirements: dict[str, dict[str, str]],
    team_info: dict[str, Any],
) -> ProjectBrief:
    """Convert extracted field dictionaries to a ProjectBrief model instance."""
    # Extract required fields
    project_name = _get_string_field(basic_info, "project_name", required=True)
    primary_goal = _get_string_field(basic_info, "primary_goal", required=True)
    target_users = _get_string_field(basic_info, "target_users", required=True)
    timeline = _get_string_field(basic_info, "timeline", required=True)

    # Handle project_type
    project_type_list = basic_info.get("project_type", [])
    if isinstance(project_type_list, list):
        if not project_type_list:
            raise ValueError("Required field 'project_type' is missing or empty")
        project_type = ", ".join(project_type_list)
    else:
        project_type = str(project_type_list)
        if not project_type.strip():
            raise ValueError("Required field 'project_type' is missing or empty")

    # Optional fields
    team_size = _get_string_field(basic_info, "team_size", default="1")
    if not team_size.strip():
        team_size = "1"

    # Functional requirements
    key_features = requirements.get("key_features", [])
    nice_to_have_features = requirements.get("nice_to_have", [])

    # Technical constraints
    must_use_tech = tech_constraints.get("must_use", [])
    cannot_use_tech = tech_constraints.get("cannot_use", [])

    deployment_target_list = tech_constraints.get("deployment_target", [])
    deployment_target = ", ".join(deployment_target_list) if deployment_target_list else None

    # Quality requirements
    performance_requirements = quality_requirements.get("performance", {})
    security_requirements = quality_requirements.get("security", {})
    scalability_requirements = quality_requirements.get("scalability", {})

    # Team information
    existing_knowledge = team_info.get("existing_knowledge", [])
    if not isinstance(existing_knowledge, list):
        existing_knowledge = []

    infrastructure_access = team_info.get("infrastructure", [])
    if not isinstance(infrastructure_access, list):
        infrastructure_access = []

    team_composition_dict = team_info.get("team_composition", {})
    if isinstance(team_composition_dict, dict):
        team_comp_parts = [
            f"{role}: {'Yes' if checked else 'No'}"
            for role, checked in team_composition_dict.items()
        ]
        team_composition = ", ".join(team_comp_parts) if team_comp_parts else None
    else:
        team_composition = None

    # Create ProjectBrief instance
    return ProjectBrief(
        project_name=project_name,
        project_type=project_type,
        primary_goal=primary_goal,
        target_users=target_users,
        timeline=timeline,
        team_size=team_size,
        key_features=key_features,
        nice_to_have_features=nice_to_have_features,
        must_use_tech=must_use_tech,
        cannot_use_tech=cannot_use_tech,
        deployment_target=deployment_target,
        performance_requirements=performance_requirements,
        security_requirements=security_requirements,
        scalability_requirements=scalability_requirements,
        team_composition=team_composition,
        existing_knowledge=existing_knowledge,
        infrastructure_access=infrastructure_access,
    )


# =============================================================================
# Main Parser Pipeline
# =============================================================================


def parse_project_brief(content: str) -> ProjectBrief:
    """Parse PROJECT_BRIEF.md content and return validated ProjectBrief instance.

    This function orchestrates the complete parsing pipeline:
    1. Parse markdown content into sections
    2. Extract fields from each section
    3. Convert extracted fields to ProjectBrief model
    4. Validate using Pydantic

    Args:
        content: The full content of a PROJECT_BRIEF.md file

    Returns:
        Validated ProjectBrief instance with all extracted data

    Raises:
        ValueError: If parsing, extraction, or validation fails
    """
    if not content or not content.strip():
        raise ValueError("Brief content cannot be empty")

    # Stage 1: Parse markdown into sections
    sections = parse_markdown_content(content)

    # Stage 2: Extract fields from sections
    try:
        basic_info = extract_basic_info(sections)
    except Exception as e:
        raise ValueError(f"Failed to extract basic information: {e}") from e

    try:
        requirements = extract_requirements(sections)
    except Exception as e:
        raise ValueError(f"Failed to extract requirements: {e}") from e

    try:
        tech_constraints = extract_tech_constraints(sections)
    except Exception as e:
        raise ValueError(f"Failed to extract technical constraints: {e}") from e

    try:
        quality_requirements = extract_quality_requirements(sections)
    except Exception as e:
        raise ValueError(f"Failed to extract quality requirements: {e}") from e

    try:
        team_info = extract_team_info(sections)
    except Exception as e:
        raise ValueError(f"Failed to extract team information: {e}") from e

    # Stage 3: Convert to ProjectBrief model (Pydantic validates automatically)
    try:
        brief = convert_to_project_brief(
            basic_info,
            requirements,
            tech_constraints,
            quality_requirements,
            team_info,
        )
    except ValueError as e:
        raise ValueError(f"Failed to create ProjectBrief: {e}") from e

    return brief
