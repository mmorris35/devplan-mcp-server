# git-analyzer - Development Plan

## How to Use This Plan

**For Claude Code**: Read this plan, find the subtask ID from the prompt, complete ALL checkboxes, update completion notes, commit.

**For You**: Use this prompt (change only the subtask ID):
```
please re-read claude.md and DEVELOPMENT_PLAN.md (the entire documents, for context), then continue with [X.Y.Z], following all of the development plan and claude.md rules.
```

---

## Project Overview

**Project Name**: git-analyzer
**Goal**: Analyze git repositories to provide insights on code quality, contributor activity, and project health
**Target Users**: developers, engineering managers, open source maintainers
**Timeline**: 3 weeks

**MVP Scope**:
- [ ] Analyze commit frequency and patterns
- [ ] Calculate contributor statistics
- [ ] Detect code churn hotspots
- [ ] Generate markdown reports
- [ ] Support multiple output formats (JSON, CSV, HTML)

---

## Technology Stack

- **Language**: Python 3.11+
- **Framework**: Click or Typer
- **Testing**: pytest
- **Linting**: ruff
- **Type Checking**: mypy
- **Deployment**: PyPI
- **CI/CD**: GitHub Actions

---

## Progress Tracking

### Phase 0: Foundation
- [ ] 0.1.1: Initialize Git Repository
- [ ] 0.1.2: Python Package Structure
- [ ] 0.1.3: Development Dependencies
- [ ] 0.2.1: Pre-commit Hooks
- [ ] 0.2.2: CI/CD Pipeline

### Phase 1: Core Commands
- [ ] 1.1.1: Click CLI Setup
- [ ] 1.1.2: Repository Loading
- [ ] 1.1.3: Repository Validation

### Phase 2: Analyze commit frequency and patterns
- [ ] 2.1.1: Analyze commit frequency and patterns - Core Logic

### Phase 3: Calculate contributor statistics
- [ ] 3.1.1: Calculate contributor statistics - Core Logic

### Phase 4: Detect code churn hotspots
- [ ] 4.1.1: Detect code churn hotspots - Core Logic

### Phase 5: Generate markdown reports
- [ ] 5.1.1: Generate markdown reports - Core Logic

### Phase 6: Support multiple output formats (JSON, CSV, HTML)
- [ ] 6.1.1: Support multiple output formats - Core Logic

### Phase 7: Polish & Release
- [ ] 7.1.1: Performance Optimization
- [ ] 7.1.2: Documentation
- [ ] 7.1.3: PyPI Release

**Current**: Phase 0
**Next**: 0.1.1

---

## Phase 0: Foundation

**Goal**: Set up repository, package structure, and development tools

### Task 0.1: Repository Setup

**Subtask 0.1.1: Initialize Git Repository (Single Session)**

**Prerequisites**:
- None

**Deliverables**:
- [ ] Add `.gitignore` (Python standard)
- [ ] Create initial `README.md` with project overview
- [ ] Create `LICENSE` (MIT)
- [ ] Initial commit with semantic message

**Files to Create**:
- `.gitignore`
- `README.md`
- `LICENSE`

**Files to Modify**:
- None

**Success Criteria**:
- [ ] `.gitignore` covers `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `build/`
- [ ] README has project name, description, and installation placeholder
- [ ] First commit has semantic message (e.g., `chore: initial repository setup`)

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: main
- **Notes**: (any additional context)

---

**Subtask 0.1.2: Python Package Structure (Single Session)**

**Prerequisites**:
- [ ] 0.1.1: Initialize Git Repository completed

**Deliverables**:
- [ ] Create `git_analyzer/` package directory
- [ ] Create `__init__.py` with `__version__ = "0.1.0"`
- [ ] Create `git_analyzer/cli.py` with Click entry point placeholder
- [ ] Create `tests/` directory with `__init__.py`
- [ ] Create `pyproject.toml` with basic metadata
- [ ] Verify package imports work

**Technology Decisions**:
- Package name for PyPI: git-analyzer
- Module name for Python: git_analyzer

**Files to Create**:
- `git_analyzer/__init__.py`
- `git_analyzer/cli.py`
- `tests/__init__.py`
- `pyproject.toml`

**Files to Modify**:
- None

**Success Criteria**:
- [ ] Can run: `python -c "import git_analyzer; print(git_analyzer.__version__)"`
- [ ] `pyproject.toml` has name, version, description, dependencies section
- [ ] All `__init__.py` files exist

**Example pyproject.toml**:
```toml
[project]
name = "git-analyzer"
version = "0.1.0"
description = "Analyze git repositories to provide insights on code quality, contributor activity, and project health"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.11"
dependencies = [
    "click>=8.1.0",
    "gitpython>=3.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.7.0",
]

[project.scripts]
git-analyzer = "git_analyzer.cli:main"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/0-1-package-structure
- **Notes**: (any additional context)

---

**Subtask 0.1.3: Development Dependencies (Single Session)**

**Prerequisites**:
- [ ] 0.1.2: Python Package Structure completed

**Deliverables**:
- [ ] Update `pyproject.toml` with all dependencies
- [ ] Create `requirements-dev.txt` for development tools
- [ ] Install dependencies: `pip install -e ".[dev]"`
- [ ] Verify all imports work
- [ ] Document installation in README

**Files to Create**:
- `requirements-dev.txt`

**Files to Modify**:
- `pyproject.toml`
- `README.md`

**Success Criteria**:
- [ ] `pip install -e ".[dev]"` completes without errors
- [ ] Can import: `import click`, `import git`, `import pytest`
- [ ] README has installation instructions with virtual environment setup

**Example requirements-dev.txt**:
```
pytest>=7.4.0
pytest-cov>=4.1.0
ruff>=0.1.0
mypy>=1.7.0
pre-commit>=3.5.0
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/0-1-package-structure
- **Notes**: (any additional context)

---

### Task 0.2: Development Tools

**Subtask 0.2.1: Pre-commit Hooks (Single Session)**

**Prerequisites**:
- [ ] 0.1.3: Development Dependencies completed

**Deliverables**:
- [ ] Create `.pre-commit-config.yaml`
- [ ] Configure ruff for linting and formatting
- [ ] Configure mypy for type checking
- [ ] Install hooks: `pre-commit install`
- [ ] Run hooks on all files: `pre-commit run --all-files`

**Files to Create**:
- `.pre-commit-config.yaml`

**Files to Modify**:
- `pyproject.toml` (add ruff and mypy configuration)

**Success Criteria**:
- [ ] Pre-commit hooks run on `git commit`
- [ ] `ruff check .` passes
- [ ] `mypy git_analyzer/` passes or reports expected issues

**Example .pre-commit-config.yaml**:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/0-2-dev-tools
- **Notes**: (any additional context)

---

**Subtask 0.2.2: CI/CD Pipeline (Single Session)**

**Prerequisites**:
- [ ] 0.2.1: Pre-commit Hooks completed

**Deliverables**:
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure test job (pytest)
- [ ] Configure lint job (ruff)
- [ ] Configure type check job (mypy)
- [ ] Add status badge to README

**Files to Create**:
- `.github/workflows/ci.yml`

**Files to Modify**:
- `README.md`

**Success Criteria**:
- [ ] GitHub Actions workflow runs on push/PR
- [ ] All CI jobs pass on clean code
- [ ] README shows CI status badge

**Example .github/workflows/ci.yml**:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[dev]"
      - run: pytest --cov=git_analyzer --cov-report=term-missing

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install ruff
      - run: ruff check .

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[dev]"
      - run: mypy git_analyzer/
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/0-2-dev-tools
- **Notes**: (any additional context)

---

## Phase 1: Core Commands

**Goal**: Implement the main CLI commands and core functionality

### Task 1.1: CLI Entry Point

**Subtask 1.1.1: Click CLI Setup (Single Session)**

**Prerequisites**:
- [ ] Phase 0 completed

**Deliverables**:
- [ ] Create main Click group in `git_analyzer/cli.py`
- [ ] Add `--version` option
- [ ] Add `--help` with descriptive text
- [ ] Register entry point in `pyproject.toml`
- [ ] Test CLI invocation: `git-analyzer --help`

**Technology Decisions**:
- Use Click for CLI framework
- Main command group pattern for subcommands

**Files to Create**:
- None

**Files to Modify**:
- `git_analyzer/cli.py`
- `pyproject.toml`

**Success Criteria**:
- [ ] `git-analyzer --version` shows version number
- [ ] `git-analyzer --help` shows command descriptions
- [ ] Entry point works after `pip install -e .`

**Example git_analyzer/cli.py**:
```python
"""CLI entry point for git-analyzer."""

import click

from git_analyzer import __version__


@click.group()
@click.version_option(version=__version__, prog_name="git-analyzer")
def main() -> None:
    """Analyze git repositories for insights on code quality and contributor activity."""
    pass


@main.command()
@click.argument("repo_path", type=click.Path(exists=True))
@click.option("--format", "-f", type=click.Choice(["json", "csv", "html", "markdown"]), default="markdown")
@click.option("--output", "-o", type=click.Path(), help="Output file path")
def analyze(repo_path: str, format: str, output: str | None) -> None:
    """Analyze a git repository and generate a report."""
    click.echo(f"Analyzing {repo_path}...")
    # TODO: Implement analysis


if __name__ == "__main__":
    main()
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/1-1-cli-setup
- **Notes**: (any additional context)

---

**Subtask 1.1.2: Repository Loading (Single Session)**

**Prerequisites**:
- [ ] 1.1.1: Click CLI Setup completed

**Deliverables**:
- [ ] Create `git_analyzer/repo.py` with GitPython wrapper
- [ ] Implement `load_repository(path)` function
- [ ] Handle invalid repository errors gracefully
- [ ] Write unit tests for repository loading
- [ ] Test with various repository types (local, bare)

**Files to Create**:
- `git_analyzer/repo.py`
- `tests/test_repo.py`

**Files to Modify**:
- `git_analyzer/__init__.py` (export load_repository)

**Success Criteria**:
- [ ] Can load valid git repository
- [ ] Raises appropriate error for non-repository paths
- [ ] Tests pass with >80% coverage on repo module

**Example git_analyzer/repo.py**:
```python
"""Git repository loading and validation."""

from pathlib import Path

from git import InvalidGitRepositoryError, Repo
from git.exc import NoSuchPathError


class RepositoryError(Exception):
    """Raised when repository operations fail."""
    pass


def load_repository(path: str | Path) -> Repo:
    """Load a git repository from the given path.

    Args:
        path: Path to the git repository (can be repo root or subdirectory)

    Returns:
        Repo: GitPython Repo object

    Raises:
        RepositoryError: If path is not a valid git repository

    Example:
        >>> repo = load_repository("/path/to/repo")
        >>> print(repo.head.commit.message)
    """
    try:
        return Repo(path, search_parent_directories=True)
    except InvalidGitRepositoryError:
        raise RepositoryError(f"Not a git repository: {path}")
    except NoSuchPathError:
        raise RepositoryError(f"Path does not exist: {path}")
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/1-1-cli-setup
- **Notes**: (any additional context)

---

## Phase 2: Analyze commit frequency and patterns

**Goal**: Implement analyze commit frequency and patterns

### Task 2.1: Core Implementation

**Subtask 2.1.1: Analyze commit frequency and patterns - Core Logic (Single Session)**

**Prerequisites**:
- [ ] Phase 1 completed

**Deliverables**:
- [ ] Create `git_analyzer/analyzers/commits.py`
- [ ] Implement `CommitAnalyzer` class with methods:
  - `analyze_frequency()` - commits per day/week/month
  - `detect_patterns()` - common commit times, message patterns
  - `get_summary()` - overall statistics
- [ ] Add input validation and error handling
- [ ] Write unit tests (>80% coverage)
- [ ] Update CLI to use CommitAnalyzer

**Files to Create**:
- `git_analyzer/analyzers/__init__.py`
- `git_analyzer/analyzers/commits.py`
- `tests/test_commits.py`

**Files to Modify**:
- `git_analyzer/cli.py`

**Success Criteria**:
- [ ] Can analyze commit frequency for any valid repository
- [ ] Correctly identifies commit patterns (time of day, day of week)
- [ ] Tests pass with >80% coverage
- [ ] No linting errors

**Example git_analyzer/analyzers/commits.py**:
```python
"""Commit frequency and pattern analysis."""

from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Iterator

from git import Commit, Repo


@dataclass
class CommitStats:
    """Statistics about repository commits."""
    total_commits: int
    first_commit_date: datetime
    last_commit_date: datetime
    commits_per_month: dict[str, int]
    commits_per_weekday: dict[str, int]
    commits_per_hour: dict[int, int]
    most_active_day: str
    most_active_hour: int


class CommitAnalyzer:
    """Analyzes commit patterns in a git repository."""

    def __init__(self, repo: Repo) -> None:
        self.repo = repo
        self._commits: list[Commit] | None = None

    @property
    def commits(self) -> Iterator[Commit]:
        """Iterate over all commits in the repository."""
        return self.repo.iter_commits()

    def analyze_frequency(self) -> dict[str, int]:
        """Calculate commits per time period."""
        monthly: Counter[str] = Counter()
        for commit in self.commits:
            month_key = commit.committed_datetime.strftime("%Y-%m")
            monthly[month_key] += 1
        return dict(monthly)

    def detect_patterns(self) -> dict[str, dict[str, int]]:
        """Detect commit time patterns."""
        weekday_counts: Counter[str] = Counter()
        hour_counts: Counter[int] = Counter()

        for commit in self.commits:
            dt = commit.committed_datetime
            weekday_counts[dt.strftime("%A")] += 1
            hour_counts[dt.hour] += 1

        return {
            "by_weekday": dict(weekday_counts),
            "by_hour": dict(hour_counts),
        }

    def get_summary(self) -> CommitStats:
        """Get comprehensive commit statistics."""
        commits = list(self.commits)
        if not commits:
            raise ValueError("Repository has no commits")

        frequency = self.analyze_frequency()
        patterns = self.detect_patterns()

        return CommitStats(
            total_commits=len(commits),
            first_commit_date=commits[-1].committed_datetime,
            last_commit_date=commits[0].committed_datetime,
            commits_per_month=frequency,
            commits_per_weekday=patterns["by_weekday"],
            commits_per_hour=patterns["by_hour"],
            most_active_day=max(patterns["by_weekday"], key=patterns["by_weekday"].get),
            most_active_hour=max(patterns["by_hour"], key=patterns["by_hour"].get),
        )
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/2-1-commit-analysis
- **Notes**: (any additional context)

---

## Phase 3: Calculate contributor statistics

**Goal**: Implement calculate contributor statistics

### Task 3.1: Core Implementation

**Subtask 3.1.1: Calculate contributor statistics - Core Logic (Single Session)**

**Prerequisites**:
- [ ] Phase 2 completed

**Deliverables**:
- [ ] Create `git_analyzer/analyzers/contributors.py`
- [ ] Implement `ContributorAnalyzer` class with methods:
  - `get_all_contributors()` - unique authors with email
  - `get_contribution_counts()` - commits per contributor
  - `get_active_contributors()` - contributors in last N days
- [ ] Add input validation and error handling
- [ ] Write unit tests (>80% coverage)

**Files to Create**:
- `git_analyzer/analyzers/contributors.py`
- `tests/test_contributors.py`

**Files to Modify**:
- `git_analyzer/analyzers/__init__.py`

**Success Criteria**:
- [ ] Correctly identifies all unique contributors
- [ ] Handles author name/email variations
- [ ] Tests pass with >80% coverage
- [ ] No linting errors

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/3-1-contributor-stats
- **Notes**: (any additional context)

---

## Phase 4: Detect code churn hotspots

**Goal**: Implement detect code churn hotspots

### Task 4.1: Core Implementation

**Subtask 4.1.1: Detect code churn hotspots - Core Logic (Single Session)**

**Prerequisites**:
- [ ] Phase 3 completed

**Deliverables**:
- [ ] Create `git_analyzer/analyzers/churn.py`
- [ ] Implement `ChurnAnalyzer` class with methods:
  - `get_file_change_frequency()` - times each file was modified
  - `get_hotspot_files()` - most frequently changed files
  - `get_churn_by_directory()` - aggregate churn per directory
- [ ] Add input validation and error handling
- [ ] Write unit tests (>80% coverage)

**Files to Create**:
- `git_analyzer/analyzers/churn.py`
- `tests/test_churn.py`

**Files to Modify**:
- `git_analyzer/analyzers/__init__.py`

**Success Criteria**:
- [ ] Correctly identifies file change frequency
- [ ] Handles renamed/moved files
- [ ] Tests pass with >80% coverage
- [ ] No linting errors

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/4-1-churn-analysis
- **Notes**: (any additional context)

---

## Phase 5: Generate markdown reports

**Goal**: Implement generate markdown reports

### Task 5.1: Core Implementation

**Subtask 5.1.1: Generate markdown reports - Core Logic (Single Session)**

**Prerequisites**:
- [ ] Phase 4 completed

**Deliverables**:
- [ ] Create `git_analyzer/reporters/markdown.py`
- [ ] Implement `MarkdownReporter` class:
  - `generate_report(stats)` - full markdown report
  - `format_table(data)` - markdown table formatting
  - `format_chart(data)` - ASCII chart for terminal
- [ ] Add input validation and error handling
- [ ] Write unit tests (>80% coverage)

**Files to Create**:
- `git_analyzer/reporters/__init__.py`
- `git_analyzer/reporters/markdown.py`
- `tests/test_markdown_reporter.py`

**Files to Modify**:
- `git_analyzer/cli.py`

**Success Criteria**:
- [ ] Generates well-formatted markdown report
- [ ] Tables render correctly in GitHub/GitLab
- [ ] Tests pass with >80% coverage
- [ ] No linting errors

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/5-1-markdown-reports
- **Notes**: (any additional context)

---

## Phase 6: Support multiple output formats (JSON, CSV, HTML)

**Goal**: Implement support multiple output formats (json, csv, html)

### Task 6.1: Core Implementation

**Subtask 6.1.1: Support multiple output formats - Core Logic (Single Session)**

**Prerequisites**:
- [ ] Phase 5 completed

**Deliverables**:
- [ ] Create `git_analyzer/reporters/json_reporter.py`
- [ ] Create `git_analyzer/reporters/csv_reporter.py`
- [ ] Create `git_analyzer/reporters/html_reporter.py`
- [ ] Implement factory function `get_reporter(format)`
- [ ] Write unit tests (>80% coverage)

**Files to Create**:
- `git_analyzer/reporters/json_reporter.py`
- `git_analyzer/reporters/csv_reporter.py`
- `git_analyzer/reporters/html_reporter.py`
- `tests/test_reporters.py`

**Files to Modify**:
- `git_analyzer/reporters/__init__.py`
- `git_analyzer/cli.py`

**Success Criteria**:
- [ ] All four formats produce valid output
- [ ] JSON is valid and parseable
- [ ] CSV works with Excel/Google Sheets
- [ ] HTML renders correctly in browser
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/6-1-output-formats
- **Notes**: (any additional context)

---

## Phase 7: Polish & Release

**Goal**: Performance optimization, documentation, and PyPI release

### Task 7.1: Polish

**Subtask 7.1.1: Performance Optimization (Single Session)**

**Prerequisites**:
- [ ] Phase 6 completed

**Deliverables**:
- [ ] Profile large repository handling (>100k commits)
- [ ] Implement lazy loading for commit iteration
- [ ] Add progress bar for long operations
- [ ] Optimize memory usage with generators

**Files to Create**:
- None

**Files to Modify**:
- `git_analyzer/analyzers/*.py`
- `git_analyzer/cli.py`

**Success Criteria**:
- [ ] Analysis completes in <60 seconds for typical repos
- [ ] Memory usage stays reasonable for large repos
- [ ] Progress feedback shown for long operations

---

**Subtask 7.1.2: Documentation (Single Session)**

**Prerequisites**:
- [ ] 7.1.1: Performance Optimization completed

**Deliverables**:
- [ ] Complete README with examples
- [ ] Add CLI help text for all commands
- [ ] Document all public API functions
- [ ] Add usage examples in docstrings

**Files to Create**:
- None

**Files to Modify**:
- `README.md`
- All source files (docstrings)

**Success Criteria**:
- [ ] README has installation, quick start, and examples
- [ ] All CLI commands have help text
- [ ] All public functions have docstrings

---

**Subtask 7.1.3: PyPI Release (Single Session)**

**Prerequisites**:
- [ ] 7.1.2: Documentation completed

**Deliverables**:
- [ ] Verify `pyproject.toml` has all required metadata
- [ ] Build package: `python -m build`
- [ ] Test installation: `pip install dist/*.whl`
- [ ] Upload to PyPI: `twine upload dist/*`

**Files to Create**:
- None

**Files to Modify**:
- `pyproject.toml` (final metadata review)

**Success Criteria**:
- [ ] Package builds without errors
- [ ] Package installs from wheel
- [ ] `pip install git-analyzer` works from PyPI

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/7-1-release
- **Notes**: (any additional context)

---

## Git Workflow

- **Branching Strategy**: One branch per task (e.g., `feature/1-2-git-analyzer-core`)
- **Commit Convention**: Semantic commits (feat:, fix:, refactor:, test:, docs:, chore:)
- **Merge Strategy**: Squash merge when task is complete
- **PR Required**: Yes for production branches

**Key principle**: One branch per task, subtasks commit to it, squash merge upon completion.

---

*Generated by DevPlan MCP Server*
