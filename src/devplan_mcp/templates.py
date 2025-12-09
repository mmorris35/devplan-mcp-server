"""Template rendering for development plans and claude.md files.

This module provides template selection, loading, and rendering functionality.
Templates are embedded as strings for portability (no filesystem dependencies).

Ported from ClaudeCode-DevPlanBuilder claude_planner.templates and
claude_planner.generator.renderer modules.
"""

from __future__ import annotations

from typing import Any

from jinja2 import BaseLoader, Environment, TemplateNotFound

# =============================================================================
# Template Definitions
# =============================================================================

TEMPLATES: dict[str, dict[str, str]] = {
    "base": {
        "name": "base",
        "description": "Base template with common functionality",
        "project_types": ["default"],
        "plan.md.j2": '''# {{ project_name }} - Development Plan

## 🎯 How to Use This Plan

**For Claude Code**: Read this plan, find the subtask ID from the prompt, complete ALL checkboxes, update completion notes, commit.

**For You**: Use this prompt (change only the subtask ID):
```
please re-read claude.md and DEVELOPMENT_PLAN.md (the entire documents, for context, I know it will eat tokens and take time), then continue with [X.Y.Z], following all of the development plan and claude.md rules.
```

---

## Project Overview

**Project Name**: {{ project_name }}

**Goal**: {{ goal }}

**Target Users**: {{ target_users }}

**Timeline**: {{ timeline }}

{% if mvp_scope -%}
**MVP Scope**:
{% for item in mvp_scope -%}
- {{ item }}
{% endfor %}
{%- endif %}

---

## Technology Stack

{% for category, technology in tech_stack.items() -%}
**{{ category }}**: {{ technology }}
{% endfor %}

{% if key_libraries -%}
**Key Libraries**: {{ key_libraries | join(', ') }}
{%- endif %}

---

## Progress Tracking

{% for phase in phases %}
### Phase {{ phase.id }}: {{ phase.title }}{% if phase.days %} ({{ phase.days }}){% endif %}

{% if phase.tasks -%}
{% for task in phase.tasks -%}
{% for subtask in task.subtasks -%}
- [{{ 'x' if subtask.status == 'completed' else ' ' }}] {{ subtask.id }}: {{ subtask.title }}
{% endfor %}
{%- endfor %}
{%- endif %}
{% endfor %}

{% if current_phase is not none -%}
**Current**: Phase {{ current_phase }}
{% endif -%}
{% if next_subtask -%}
**Next**: {{ next_subtask }}
{% endif %}

---

{% for phase in phases %}
## Phase {{ phase.id }}: {{ phase.title }}{% if phase.days %} ({{ phase.days }}){% endif %}

**Goal**: {{ phase.goal }}

{% if phase.description -%}
{{ phase.description }}

{% endif -%}
{% if phase.tasks -%}
{% for task in phase.tasks %}
---

### Task {{ task.id }}: {{ task.title }}

{% if task.description -%}
**Goal**: {{ task.description }}

{% endif -%}
**Git Strategy** (for entire task, NOT per subtask):
{% if task.git_strategy -%}
- **Branch**: `{{ task.git_strategy.branch_name }}` (from `{{ task.git_strategy.branch_from }}`)
- **Commit Prefix**: `{{ task.git_strategy.commit_prefix }}`
- **Merge**: {{ task.git_strategy.merge_strategy }}{% if task.git_strategy.pr_required %} (PR required){% endif %}
- All subtasks commit to this branch; merge only when task complete
{%- else -%}
- **Branch**: `feature/{{ task.id | replace('.', '-') }}-<short-description>` (create once for task)
- **Commit Prefix**: `feat` (or `fix`, `refactor`, `test`, `docs` as appropriate)
- **Merge**: squash when task complete (NOT after each subtask)
- All subtasks commit to this branch
{% endif %}

{% for subtask in task.subtasks %}
**Subtask {{ subtask.id }}: {{ subtask.title }}**

**Prerequisites**:
{% if subtask.prerequisites -%}
{% for prereq in subtask.prerequisites -%}
- [ ] {{ prereq }}
{% endfor %}
{%- else -%}
- None
{% endif %}

**Deliverables**:
{% for deliverable in subtask.deliverables -%}
- [{{ 'x' if subtask.status == 'completed' else ' ' }}] {{ deliverable }}
{% endfor %}

{% if subtask.technology_decisions -%}
**Technology Decisions**:
{% for decision in subtask.technology_decisions -%}
- {{ decision }}
{% endfor %}
{% endif %}

{% if subtask.files_to_create -%}
**Files to Create**:
{% for file in subtask.files_to_create -%}
- `{{ file }}`
{% endfor %}
{% endif %}

{% if subtask.files_to_modify -%}
**Files to Modify**:
{% for file in subtask.files_to_modify -%}
- `{{ file }}`
{% endfor %}
{%- endif %}

**Success Criteria**:
{% for criterion in subtask.success_criteria -%}
- [{{ 'x' if subtask.status == 'completed' else ' ' }}] {{ criterion }}
{% endfor %}

---

**Completion Notes**:
{% if subtask.completion_notes -%}
- **Implementation**: {{ subtask.completion_notes.get('implementation', '') }}
- **Files Created**: {{ subtask.completion_notes.get('files_created', '') }}
- **Files Modified**: {{ subtask.completion_notes.get('files_modified', '') }}
- **Tests**: {{ subtask.completion_notes.get('tests', '') }}
- **Build**: {{ subtask.completion_notes.get('build', '') }}
- **Branch**: {{ subtask.completion_notes.get('branch', '') }}
- **Notes**: {{ subtask.completion_notes.get('notes', '') }}
{%- else -%}
- **Implementation**:
- **Files Created**:
- **Files Modified**:
- **Tests**:
- **Build**:
- **Branch**:
- **Notes**:
{% endif %}

---
{% endfor %}
{% endfor %}
{%- endif %}
{% endfor %}

---

_This development plan is a living document. Update completion notes after each subtask._
''',
        "claude.md.j2": '''# Claude Code Development Rules - {{ project_name }}

> This document defines HOW Claude Code should work on the {{ project_name }} project.
> Read at the start of every session to maintain consistency.

## Core Operating Principles

### 1. Single Session Execution
- ✅ Complete the ENTIRE subtask in this session
- ✅ End every session with a git commit
- ❌ If blocked, document why and mark as BLOCKED

### 2. Read Before Acting
**Every session must begin with:**
1. Read DEVELOPMENT_PLAN.md completely
2. Locate the specific subtask ID from the prompt
3. Verify prerequisites are marked `[x]` complete
4. Read completion notes from prerequisites for context

### 3. File Management

**Project Structure:**
```
{{ file_structure | default('project_root/
├── src/
├── tests/
└── README.md') }}
```

**Creating Files:**
- Use exact paths specified in subtask
- Add proper module docstrings
- Include type hints on all functions

**Modifying Files:**
- Only modify files listed in subtask
- Preserve existing functionality
- Update related tests

### 4. Testing Requirements

**Unit Tests:**
- Write tests for EVERY new function/class
- Place in `tests/` with `test_` prefix
- Minimum coverage: {{ test_coverage | default(80) }}% overall
- Test success, failure, and edge cases

**Running Tests:**
```bash
# All tests
{{ test_command | default('pytest tests/') }}

# With coverage report
{{ coverage_command | default('pytest --cov=src tests/') }}
```

**Before Every Commit:**
- [ ] All tests pass
- [ ] Coverage >{{ test_coverage | default(80) }}%
- [ ] Linting passes ({{ linter | default('ruff') }})
- [ ] Type checking passes ({{ type_checker | default('mypy') }})

### 5. Completion Protocol

**When a subtask is complete:**

1. **Update DEVELOPMENT_PLAN.md** with completion notes:
```markdown
**Completion Notes:**
- **Implementation**: Brief description of what was built
- **Files Created**:
  - `path/to/file.py` (234 lines)
- **Files Modified**:
  - `path/to/modified.py` (added new function)
- **Tests**: X unit tests (Y% coverage)
- **Build**: ✅ Success (all tests pass, linting clean)
- **Branch**: feature/subtask-X-Y-Z
- **Notes**: Any deviations, issues, or future work
```

2. **Check all checkboxes** in the subtask (change `[ ]` to `[x]`)

3. **Git commit** with semantic message:
```bash
git add .
git commit -m "{{ commit_prefix | default('feat') }}(component): Brief description

- Detail 1
- Detail 2
- X% coverage on module"
```

4. **Report completion** with summary

### 6. Technology Decisions

**Tech Stack:**
{% for category, tech in tech_stack.items() -%}
- **{{ category }}**: {{ tech }}
{% endfor %}

### 7. Error Handling

**If you encounter an error:**
1. Attempt to fix using project patterns
2. If blocked, update DEVELOPMENT_PLAN.md:
   ```markdown
   **Completion Notes:**
   - **Status**: ❌ BLOCKED
   - **Error**: [Detailed error message]
   - **Attempted**: [What was tried]
   - **Root Cause**: [Analysis]
   - **Suggested Fix**: [What should be done]
   ```
3. Do NOT mark subtask complete if blocked
4. Do NOT commit broken code
5. Report immediately

### 8. Code Quality Standards

**Style:**
- Follow {{ style_guide | default('PEP 8') }}
- Type hints on all functions
- Docstrings on public functions/classes
- Max line length: {{ max_line_length | default(100) }} characters
- Use `{{ linter | default('ruff') }}` for linting
- Use `{{ type_checker | default('mypy') }}` for type checking

### 9. Build Verification

**Before marking subtask complete:**

```bash
# Linting
{{ lint_command | default('ruff check .') }}

# Type checking
{{ type_check_command | default('mypy src/') }}

# Tests
{{ test_command | default('pytest tests/') }}
```

**All must pass with no errors.**

## Checklist: Starting a New Session

- [ ] Read DEVELOPMENT_PLAN.md completely
- [ ] Locate subtask ID from prompt
- [ ] Verify prerequisites marked `[x]`
- [ ] Read prerequisite completion notes
- [ ] Understand success criteria
- [ ] Ready to code!

## Checklist: Ending a Session

- [ ] All subtask checkboxes checked
- [ ] All tests pass
- [ ] Linting clean
- [ ] Type checking clean
- [ ] Completion notes written
- [ ] Git commit with semantic message
- [ ] User notified

---

**Project**: {{ project_name }}
''',
    },
    "cli": {
        "name": "cli",
        "description": "Command-line application template",
        "project_types": ["cli", "cli tool", "command line", "command-line"],
    },
    "web_app": {
        "name": "web_app",
        "description": "Full-stack web application template",
        "project_types": ["web app", "web application", "webapp", "web"],
    },
    "api": {
        "name": "api",
        "description": "REST or GraphQL API service template",
        "project_types": ["api", "rest api", "graphql", "backend", "service"],
    },
    "library": {
        "name": "library",
        "description": "Reusable library or package template",
        "project_types": ["library", "package", "module", "sdk"],
    },
}


# =============================================================================
# Template Loader for Jinja2
# =============================================================================


class EmbeddedLoader(BaseLoader):
    """Jinja2 loader that loads templates from embedded strings."""

    def __init__(self, templates: dict[str, dict[str, str]]) -> None:
        self.templates = templates

    def get_source(
        self, environment: Environment, template: str
    ) -> tuple[str, str | None, Any]:
        """Get template source from embedded templates.

        Args:
            environment: Jinja2 environment
            template: Template name in format "template_name/file.j2"

        Returns:
            Tuple of (source, filename, uptodate_func)
        """
        parts = template.split("/")
        if len(parts) != 2:
            raise TemplateNotFound(template)

        template_name, file_name = parts
        if template_name not in self.templates:
            raise TemplateNotFound(template)

        template_data = self.templates[template_name]
        if file_name not in template_data:
            # Fall back to base template
            if "base" in self.templates and file_name in self.templates["base"]:
                return self.templates["base"][file_name], None, lambda: True
            raise TemplateNotFound(template)

        return template_data[file_name], None, lambda: True


# =============================================================================
# Template Functions
# =============================================================================


def list_templates() -> list[dict[str, Any]]:
    """List all available templates with their metadata.

    Returns:
        List of template info dictionaries with name, description, use_cases
    """
    result = []
    for name, template in TEMPLATES.items():
        result.append({
            "name": name,
            "description": template.get("description", ""),
            "project_types": template.get("project_types", []),
        })
    return result


def select_template(project_type: str) -> str:
    """Select appropriate template based on project type.

    Args:
        project_type: Project type string (e.g., "CLI Tool", "Web App")

    Returns:
        Template name to use
    """
    normalized = project_type.lower().strip()

    for name, template in TEMPLATES.items():
        if name == "base":
            continue
        project_types = template.get("project_types", [])
        for ptype in project_types:
            if normalized == ptype or normalized in ptype or ptype in normalized:
                return name

    return "base"


def render_plan(
    template_name: str,
    project_name: str,
    goal: str,
    target_users: str,
    timeline: str,
    tech_stack: dict[str, str],
    phases: list[dict[str, Any]],
    **extra_vars: Any,
) -> str:
    """Render a DEVELOPMENT_PLAN.md from template.

    Args:
        template_name: Template to use (e.g., "base", "cli")
        project_name: Name of the project
        goal: Primary goal/objective
        target_users: Target user description
        timeline: Project timeline
        tech_stack: Dictionary of tech stack items
        phases: List of phase dictionaries
        **extra_vars: Additional template variables

    Returns:
        Rendered DEVELOPMENT_PLAN.md content
    """
    env = Environment(loader=EmbeddedLoader(TEMPLATES))

    try:
        template = env.get_template(f"{template_name}/plan.md.j2")
    except TemplateNotFound:
        # Fall back to base template
        template = env.get_template("base/plan.md.j2")

    return template.render(
        project_name=project_name,
        goal=goal,
        target_users=target_users,
        timeline=timeline,
        tech_stack=tech_stack,
        phases=phases,
        **extra_vars,
    )


def render_claude_md(
    template_name: str,
    project_name: str,
    tech_stack: dict[str, str],
    test_coverage: int = 80,
    **extra_vars: Any,
) -> str:
    """Render a claude.md rules file from template.

    Args:
        template_name: Template to use (e.g., "base", "cli")
        project_name: Name of the project
        tech_stack: Dictionary of tech stack items
        test_coverage: Required test coverage percentage
        **extra_vars: Additional template variables

    Returns:
        Rendered claude.md content
    """
    env = Environment(loader=EmbeddedLoader(TEMPLATES))

    try:
        template = env.get_template(f"{template_name}/claude.md.j2")
    except TemplateNotFound:
        # Fall back to base template
        template = env.get_template("base/claude.md.j2")

    return template.render(
        project_name=project_name,
        tech_stack=tech_stack,
        test_coverage=test_coverage,
        **extra_vars,
    )
