# dotfiles-manager - Development Plan

## How to Use This Plan

**For Claude Code**: Read this plan, find the subtask ID from the prompt, complete ALL checkboxes, update completion notes, commit with semantic message.

**For You**: Use this prompt (change only the subtask ID):
```
please re-read claude.md and DEVELOPMENT_PLAN.md (the entire documents, for context), then continue with [X.Y.Z], following all of the development plan and claude.md rules.
```

---

## Git Discipline (CRITICAL)

**This project uses task-level branching.** You MUST follow this workflow:

### Starting a Task (X.Y)
```bash
# Ensure you're on main and up-to-date
git checkout main
git pull origin main

# Create task branch
git checkout -b feature/<task-id>-<description>
# Example: git checkout -b feature/0-1-repository-setup
```

### After Each Subtask (X.Y.Z)
```bash
# Stage and commit with semantic message
git add -A
git commit -m "<type>: <description>

Completed subtask X.Y.Z: <subtask-title>

- <deliverable 1>
- <deliverable 2>
..."
```

### Completing a Task (before starting next task)
```bash
# Ensure all subtasks committed
git status

# Push branch
git push -u origin feature/<task-id>-<description>

# Switch to main and squash merge
git checkout main
git merge --squash feature/<task-id>-<description>
git commit -m "feat: <task description>

Completed task X.Y with subtasks:
- X.Y.1: <title>
- X.Y.2: <title>
..."

# Delete feature branch
git branch -d feature/<task-id>-<description>
git push origin --delete feature/<task-id>-<description>  # if pushed
```

### Commit Message Types
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `test:` - Adding/updating tests
- `docs:` - Documentation only
- `chore:` - Build, config, dependencies

---

## Project Overview

**Project Name**: dotfiles-manager
**Goal**: A CLI tool to sync, backup, and manage dotfiles across multiple machines with support for profiles and encrypted secrets
**Target Users**: developers, system administrators, power users
**Timeline**: 2 weeks

**MVP Scope**:
- [ ] Initialize and sync dotfiles to a git repository
- [ ] Create symlinks from dotfiles repo to home directory
- [ ] Support multiple profiles (work, home, server)
- [ ] Encrypt sensitive files (API keys, tokens)
- [ ] Cross-platform support (macOS, Linux)
- [ ] Backup and restore functionality

---

## Technology Stack

- **Language**: Python 3.11+
- **Framework**: Click
- **Testing**: pytest
- **Linting**: ruff
- **Type Checking**: mypy
- **Deployment**: PyPI
- **CI/CD**: GitHub Actions
- **Additional**: GitPython, cryptography

---

## Progress Tracking

### Phase 0: Foundation
- [ ] 0.1.1: Initialize Git Repository
- [ ] 0.1.2: Python Package Structure
- [ ] 0.1.3: Development Dependencies
- [ ] 0.2.1: Pre-commit Hooks
- [ ] 0.2.2: CI/CD Pipeline

### Phase 1: Core CLI
- [ ] 1.1.1: Click CLI Setup
- [ ] 1.1.2: Configuration System
- [ ] 1.1.3: Logging Setup

### Phase 2: Git Integration
- [ ] 2.1.1: Repository Initialization
- [ ] 2.1.2: Sync Commands

### Phase 3: Symlink Management
- [ ] 3.1.1: Symlink Creation
- [ ] 3.1.2: Symlink Status and Repair

### Phase 4: Profile System
- [ ] 4.1.1: Profile Configuration
- [ ] 4.1.2: Profile Switching

### Phase 5: Encryption
- [ ] 5.1.1: Encryption Core
- [ ] 5.1.2: Secret Management Commands

### Phase 6: Backup & Restore
- [ ] 6.1.1: Backup System
- [ ] 6.1.2: Restore System

### Phase 7: Polish & Release
- [ ] 7.1.1: Cross-Platform Testing
- [ ] 7.1.2: Documentation
- [ ] 7.1.3: PyPI Release

**Current**: Phase 0
**Next**: 0.1.1

---

## Phase 0: Foundation

**Goal**: Set up repository, package structure, and development tools

### Task 0.1: Repository Setup

**🔀 START TASK: Create branch `feature/0-1-repository-setup`**
```bash
git checkout -b feature/0-1-repository-setup
```

---

**Subtask 0.1.1: Initialize Git Repository (Single Session)**

**Prerequisites**:
- None
- Branch `feature/0-1-repository-setup` created

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
- **Tests**: N/A
- **Build**: N/A
- **Branch**: feature/0-1-repository-setup
- **Notes**: (any additional context)

**📝 COMMIT after completing this subtask:**
```bash
git add -A
git commit -m "chore: initialize git repository

Completed subtask 0.1.1: Initialize Git Repository

- Added .gitignore with Python standard ignores
- Created README.md with project overview
- Added MIT LICENSE"
```

---

**Subtask 0.1.2: Python Package Structure (Single Session)**

**Prerequisites**:
- [ ] 0.1.1: Initialize Git Repository completed

**Deliverables**:
- [ ] Create `dotfiles_manager/` package directory
- [ ] Create `__init__.py` with `__version__ = "0.1.0"`
- [ ] Create `dotfiles_manager/cli.py` with Click entry point placeholder
- [ ] Create `tests/` directory with `__init__.py` and `conftest.py`
- [ ] Create `pyproject.toml` with basic metadata
- [ ] Verify package imports work

**Technology Decisions**:
- Package name for PyPI: dotfiles-manager
- Module name for Python: dotfiles_manager

**Files to Create**:
- `dotfiles_manager/__init__.py`
- `dotfiles_manager/cli.py`
- `tests/__init__.py`
- `tests/conftest.py`
- `pyproject.toml`

**Files to Modify**:
- None

**Success Criteria**:
- [ ] Can run: `python -c "import dotfiles_manager; print(dotfiles_manager.__version__)"`
- [ ] `pyproject.toml` has name, version, description, dependencies section
- [ ] All `__init__.py` files exist

**Example pyproject.toml**:
```toml
[project]
name = "dotfiles-manager"
version = "0.1.0"
description = "Sync, backup, and manage dotfiles across multiple machines"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.11"
keywords = ["dotfiles", "configuration", "sync", "backup"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: MacOS",
    "Operating System :: POSIX :: Linux",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Topic :: System :: Systems Administration",
]
dependencies = [
    "click>=8.1.0",
    "gitpython>=3.1.0",
    "cryptography>=41.0.0",
    "rich>=13.0.0",
    "pyyaml>=6.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "pytest-mock>=3.12.0",
    "ruff>=0.1.0",
    "mypy>=1.7.0",
    "types-PyYAML>=6.0.0",
]

[project.scripts]
dotfiles = "dotfiles_manager.cli:main"
dfm = "dotfiles_manager.cli:main"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "C4", "SIM"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=dotfiles_manager --cov-report=term-missing"
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: N/A
- **Build**: (success/fail)
- **Branch**: feature/0-1-repository-setup
- **Notes**: (any additional context)

**📝 COMMIT after completing this subtask:**
```bash
git add -A
git commit -m "feat: create Python package structure

Completed subtask 0.1.2: Python Package Structure

- Created dotfiles_manager/ package with __init__.py
- Created cli.py with Click entry point placeholder
- Created tests/ directory with __init__.py and conftest.py
- Added pyproject.toml with project metadata and dependencies"
```

---

**Subtask 0.1.3: Development Dependencies (Single Session)**

**Prerequisites**:
- [ ] 0.1.2: Python Package Structure completed

**Deliverables**:
- [ ] Create virtual environment: `python -m venv .venv`
- [ ] Install dependencies: `pip install -e ".[dev]"`
- [ ] Verify all imports work
- [ ] Update README with installation instructions

**Files to Create**:
- None

**Files to Modify**:
- `README.md`

**Success Criteria**:
- [ ] `pip install -e ".[dev]"` completes without errors
- [ ] Can import: `import click`, `import git`, `import cryptography`, `import rich`
- [ ] README has installation instructions with virtual environment setup

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: N/A
- **Build**: (success/fail)
- **Branch**: feature/0-1-repository-setup
- **Notes**: (any additional context)

**📝 COMMIT after completing this subtask:**
```bash
git add -A
git commit -m "chore: install development dependencies

Completed subtask 0.1.3: Development Dependencies

- Verified all dependencies install correctly
- Updated README with installation instructions"
```

**✅ COMPLETE TASK 0.1: Squash merge to main**
```bash
git checkout main
git merge --squash feature/0-1-repository-setup
git commit -m "feat: repository setup complete

Completed task 0.1: Repository Setup

- 0.1.1: Initialize Git Repository
- 0.1.2: Python Package Structure
- 0.1.3: Development Dependencies

Project foundation ready with package structure, dependencies, and documentation."

git branch -d feature/0-1-repository-setup
```

---

### Task 0.2: Development Tools

**🔀 START TASK: Create branch `feature/0-2-dev-tools`**
```bash
git checkout -b feature/0-2-dev-tools
```

---

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
- None

**Success Criteria**:
- [ ] Pre-commit hooks run on `git commit`
- [ ] `ruff check .` passes
- [ ] `mypy dotfiles_manager/` passes

**Example .pre-commit-config.yaml**:
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-PyYAML
          - click
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: N/A
- **Build**: (success/fail)
- **Branch**: feature/0-2-dev-tools
- **Notes**: (any additional context)

---

**Subtask 0.2.2: CI/CD Pipeline (Single Session)**

**Prerequisites**:
- [ ] 0.2.1: Pre-commit Hooks completed

**Deliverables**:
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure test job (pytest on Python 3.11 and 3.12)
- [ ] Configure lint job (ruff)
- [ ] Configure type check job (mypy)
- [ ] Test on both ubuntu-latest and macos-latest
- [ ] Add status badge to README

**Files to Create**:
- `.github/workflows/ci.yml`

**Files to Modify**:
- `README.md`

**Success Criteria**:
- [ ] GitHub Actions workflow runs on push/PR
- [ ] All CI jobs pass on clean code
- [ ] Tests run on both Linux and macOS
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
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        python-version: ["3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - run: pip install -e ".[dev]"
      - run: pytest --cov=dotfiles_manager --cov-report=term-missing

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install ruff
      - run: ruff check .
      - run: ruff format --check .

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -e ".[dev]"
      - run: mypy dotfiles_manager/
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: N/A
- **Build**: (success/fail)
- **Branch**: feature/0-2-dev-tools
- **Notes**: (any additional context)

---

## Phase 1: Core CLI

**Goal**: Set up the CLI framework with configuration and logging

### Task 1.1: CLI Infrastructure

**Subtask 1.1.1: Click CLI Setup (Single Session)**

**Prerequisites**:
- [ ] Phase 0 completed

**Deliverables**:
- [ ] Create main Click group in `dotfiles_manager/cli.py`
- [ ] Add `--version` option
- [ ] Add `--verbose` / `-v` flag for debug output
- [ ] Add `--config` option to specify config file path
- [ ] Use Rich for colored output
- [ ] Test CLI invocation: `dotfiles --help`

**Files to Create**:
- `dotfiles_manager/console.py` (Rich console wrapper)

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] `dotfiles --version` shows version number
- [ ] `dotfiles --help` shows all available commands
- [ ] `dotfiles -v` enables verbose output
- [ ] Entry point works after `pip install -e .`

**Example dotfiles_manager/cli.py**:
```python
"""CLI entry point for dotfiles-manager."""

import click

from dotfiles_manager import __version__
from dotfiles_manager.console import console, enable_verbose


@click.group()
@click.version_option(version=__version__, prog_name="dotfiles-manager")
@click.option("-v", "--verbose", is_flag=True, help="Enable verbose output")
@click.option(
    "-c", "--config",
    type=click.Path(),
    default=None,
    help="Path to config file (default: ~/.config/dotfiles-manager/config.yaml)"
)
@click.pass_context
def main(ctx: click.Context, verbose: bool, config: str | None) -> None:
    """Manage your dotfiles across multiple machines.

    Sync, backup, and organize configuration files with support for
    multiple profiles and encrypted secrets.
    """
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose
    ctx.obj["config_path"] = config

    if verbose:
        enable_verbose()
        console.print("[dim]Verbose mode enabled[/dim]")


@main.command()
@click.pass_context
def status(ctx: click.Context) -> None:
    """Show the current status of your dotfiles."""
    console.print("[bold]Dotfiles Status[/bold]")
    # TODO: Implement status command


@main.command()
@click.argument("path", type=click.Path(), default=".")
@click.pass_context
def init(ctx: click.Context, path: str) -> None:
    """Initialize a new dotfiles repository."""
    console.print(f"[green]Initializing dotfiles repository in {path}[/green]")
    # TODO: Implement init command


if __name__ == "__main__":
    main()
```

**Example dotfiles_manager/console.py**:
```python
"""Rich console configuration for CLI output."""

from rich.console import Console

# Global console instance
console = Console()

# Verbose mode flag
_verbose = False


def enable_verbose() -> None:
    """Enable verbose output mode."""
    global _verbose
    _verbose = True


def is_verbose() -> bool:
    """Check if verbose mode is enabled."""
    return _verbose


def debug(message: str) -> None:
    """Print a debug message (only in verbose mode)."""
    if _verbose:
        console.print(f"[dim][DEBUG] {message}[/dim]")


def success(message: str) -> None:
    """Print a success message."""
    console.print(f"[green]✓[/green] {message}")


def error(message: str) -> None:
    """Print an error message."""
    console.print(f"[red]✗[/red] {message}")


def warning(message: str) -> None:
    """Print a warning message."""
    console.print(f"[yellow]![/yellow] {message}")
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

**Subtask 1.1.2: Configuration System (Single Session)**

**Prerequisites**:
- [ ] 1.1.1: Click CLI Setup completed

**Deliverables**:
- [ ] Create `dotfiles_manager/config.py` with Config dataclass
- [ ] Support YAML configuration file
- [ ] Default config location: `~/.config/dotfiles-manager/config.yaml`
- [ ] Create config on first run if not exists
- [ ] Write unit tests for config loading

**Files to Create**:
- `dotfiles_manager/config.py`
- `tests/test_config.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] Config loads from default location
- [ ] Config can be overridden with `--config` flag
- [ ] Missing config creates default
- [ ] Tests pass with >80% coverage

**Example dotfiles_manager/config.py**:
```python
"""Configuration management for dotfiles-manager."""

from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class Config:
    """Application configuration."""

    # Path to the dotfiles repository
    repo_path: Path = field(default_factory=lambda: Path.home() / ".dotfiles")

    # Current active profile
    active_profile: str = "default"

    # List of files/patterns to ignore
    ignore_patterns: list[str] = field(default_factory=lambda: [
        ".git",
        ".DS_Store",
        "*.swp",
        "*~",
    ])

    # Whether to create backups before overwriting
    backup_on_overwrite: bool = True

    # Backup directory
    backup_dir: Path = field(default_factory=lambda: Path.home() / ".dotfiles-backup")

    @classmethod
    def default_path(cls) -> Path:
        """Get the default config file path."""
        return Path.home() / ".config" / "dotfiles-manager" / "config.yaml"

    @classmethod
    def load(cls, path: Path | None = None) -> "Config":
        """Load configuration from a YAML file.

        Args:
            path: Path to config file. If None, uses default location.

        Returns:
            Config instance with loaded values.
        """
        config_path = path or cls.default_path()

        if not config_path.exists():
            # Create default config
            config = cls()
            config.save(config_path)
            return config

        with open(config_path) as f:
            data = yaml.safe_load(f) or {}

        return cls(
            repo_path=Path(data.get("repo_path", str(Path.home() / ".dotfiles"))),
            active_profile=data.get("active_profile", "default"),
            ignore_patterns=data.get("ignore_patterns", cls().ignore_patterns),
            backup_on_overwrite=data.get("backup_on_overwrite", True),
            backup_dir=Path(data.get("backup_dir", str(Path.home() / ".dotfiles-backup"))),
        )

    def save(self, path: Path | None = None) -> None:
        """Save configuration to a YAML file.

        Args:
            path: Path to save to. If None, uses default location.
        """
        config_path = path or self.default_path()
        config_path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "repo_path": str(self.repo_path),
            "active_profile": self.active_profile,
            "ignore_patterns": self.ignore_patterns,
            "backup_on_overwrite": self.backup_on_overwrite,
            "backup_dir": str(self.backup_dir),
        }

        with open(config_path, "w") as f:
            yaml.safe_dump(data, f, default_flow_style=False)
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

**Subtask 1.1.3: Logging Setup (Single Session)**

**Prerequisites**:
- [ ] 1.1.2: Configuration System completed

**Deliverables**:
- [ ] Create `dotfiles_manager/logging.py` with structured logging
- [ ] Log to file in `~/.local/share/dotfiles-manager/logs/`
- [ ] Integrate with Rich for console output
- [ ] Add `--debug` flag for DEBUG level logging
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/logging.py`
- `tests/test_logging.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] Logs written to file with timestamps
- [ ] Console output respects verbosity settings
- [ ] Log rotation (keep last 5 log files)
- [ ] Tests pass

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

## Phase 2: Git Integration

**Goal**: Implement git repository management for dotfiles

### Task 2.1: Repository Management

**Subtask 2.1.1: Repository Initialization (Single Session)**

**Prerequisites**:
- [ ] Phase 1 completed

**Deliverables**:
- [ ] Create `dotfiles_manager/git.py` with GitManager class
- [ ] Implement `init_repo()` - initialize new dotfiles repo
- [ ] Implement `clone_repo()` - clone existing dotfiles repo
- [ ] Implement `is_repo()` - check if path is a git repo
- [ ] Add `dotfiles init` command
- [ ] Add `dotfiles clone <url>` command
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/git.py`
- `tests/test_git.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] `dotfiles init` creates new repo with README and .gitignore
- [ ] `dotfiles clone <url>` clones remote repo
- [ ] Proper error handling for existing repos
- [ ] Tests pass with >80% coverage

**Example dotfiles_manager/git.py**:
```python
"""Git repository management for dotfiles."""

from pathlib import Path

from git import Repo, InvalidGitRepositoryError
from git.exc import GitCommandError

from dotfiles_manager.console import console, debug, error, success


class GitError(Exception):
    """Raised when git operations fail."""
    pass


class GitManager:
    """Manages git operations for the dotfiles repository."""

    def __init__(self, repo_path: Path) -> None:
        """Initialize GitManager.

        Args:
            repo_path: Path to the dotfiles repository.
        """
        self.repo_path = repo_path
        self._repo: Repo | None = None

    @property
    def repo(self) -> Repo:
        """Get the git Repo object, loading it if necessary."""
        if self._repo is None:
            if not self.is_repo():
                raise GitError(f"Not a git repository: {self.repo_path}")
            self._repo = Repo(self.repo_path)
        return self._repo

    def is_repo(self) -> bool:
        """Check if the repo_path is a valid git repository."""
        try:
            Repo(self.repo_path)
            return True
        except InvalidGitRepositoryError:
            return False

    def init_repo(self, bare: bool = False) -> Repo:
        """Initialize a new git repository.

        Args:
            bare: Whether to create a bare repository.

        Returns:
            The initialized Repo object.

        Raises:
            GitError: If repository already exists or init fails.
        """
        if self.is_repo():
            raise GitError(f"Repository already exists at {self.repo_path}")

        self.repo_path.mkdir(parents=True, exist_ok=True)

        debug(f"Initializing git repository at {self.repo_path}")
        self._repo = Repo.init(self.repo_path, bare=bare)

        # Create initial files
        self._create_initial_files()

        # Initial commit
        self.repo.index.add([".gitignore", "README.md"])
        self.repo.index.commit("chore: initial dotfiles repository setup")

        success(f"Initialized dotfiles repository at {self.repo_path}")
        return self._repo

    def clone_repo(self, url: str) -> Repo:
        """Clone a remote repository.

        Args:
            url: URL of the remote repository.

        Returns:
            The cloned Repo object.

        Raises:
            GitError: If clone fails.
        """
        if self.repo_path.exists() and any(self.repo_path.iterdir()):
            raise GitError(f"Directory not empty: {self.repo_path}")

        debug(f"Cloning {url} to {self.repo_path}")
        try:
            self._repo = Repo.clone_from(url, self.repo_path)
            success(f"Cloned dotfiles repository to {self.repo_path}")
            return self._repo
        except GitCommandError as e:
            raise GitError(f"Failed to clone repository: {e}")

    def _create_initial_files(self) -> None:
        """Create initial repository files."""
        # .gitignore
        gitignore = self.repo_path / ".gitignore"
        gitignore.write_text(
            "# OS files\n"
            ".DS_Store\n"
            "Thumbs.db\n"
            "\n"
            "# Editor files\n"
            "*.swp\n"
            "*~\n"
            ".vscode/\n"
            ".idea/\n"
            "\n"
            "# Secrets (encrypted versions are OK)\n"
            "*.secret\n"
            "!*.secret.enc\n"
        )

        # README.md
        readme = self.repo_path / "README.md"
        readme.write_text(
            "# Dotfiles\n\n"
            "My personal dotfiles managed with [dotfiles-manager]"
            "(https://github.com/yourusername/dotfiles-manager).\n\n"
            "## Installation\n\n"
            "```bash\n"
            "pip install dotfiles-manager\n"
            "dotfiles clone <this-repo-url>\n"
            "dotfiles link\n"
            "```\n"
        )
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/2-1-git-integration
- **Notes**: (any additional context)

---

**Subtask 2.1.2: Sync Commands (Single Session)**

**Prerequisites**:
- [ ] 2.1.1: Repository Initialization completed

**Deliverables**:
- [ ] Implement `sync_to_remote()` - push changes to remote
- [ ] Implement `sync_from_remote()` - pull changes from remote
- [ ] Add `dotfiles push` command
- [ ] Add `dotfiles pull` command
- [ ] Handle merge conflicts gracefully
- [ ] Write unit tests

**Files to Create**:
- None

**Files to Modify**:
- `dotfiles_manager/git.py`
- `dotfiles_manager/cli.py`
- `tests/test_git.py`

**Success Criteria**:
- [ ] `dotfiles push` commits and pushes all changes
- [ ] `dotfiles pull` pulls and handles conflicts
- [ ] User prompted for commit message
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/2-1-git-integration
- **Notes**: (any additional context)

---

## Phase 3: Symlink Management

**Goal**: Create and manage symlinks from dotfiles repo to home directory

### Task 3.1: Symlink Operations

**Subtask 3.1.1: Symlink Creation (Single Session)**

**Prerequisites**:
- [ ] Phase 2 completed

**Deliverables**:
- [ ] Create `dotfiles_manager/linker.py` with SymlinkManager class
- [ ] Implement `link_file()` - create symlink for single file
- [ ] Implement `link_all()` - link all files in repo
- [ ] Implement `unlink_file()` - remove symlink
- [ ] Add `dotfiles link [file]` command
- [ ] Add `dotfiles unlink [file]` command
- [ ] Handle existing files (backup, skip, overwrite options)
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/linker.py`
- `tests/test_linker.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] Creates symlinks in correct locations
- [ ] Backs up existing files before overwriting
- [ ] Handles nested directories
- [ ] Tests pass with >80% coverage

**Example dotfiles_manager/linker.py**:
```python
"""Symlink management for dotfiles."""

from dataclasses import dataclass
from enum import Enum
from pathlib import Path
import shutil

from dotfiles_manager.console import console, debug, error, success, warning


class ConflictStrategy(Enum):
    """Strategy for handling existing files."""
    SKIP = "skip"
    BACKUP = "backup"
    OVERWRITE = "overwrite"
    ASK = "ask"


@dataclass
class LinkResult:
    """Result of a link operation."""
    source: Path
    target: Path
    success: bool
    message: str
    backed_up: Path | None = None


class SymlinkManager:
    """Manages symlinks between dotfiles repo and home directory."""

    def __init__(
        self,
        repo_path: Path,
        home_path: Path | None = None,
        backup_dir: Path | None = None,
    ) -> None:
        """Initialize SymlinkManager.

        Args:
            repo_path: Path to the dotfiles repository.
            home_path: Path to home directory (default: ~).
            backup_dir: Path to backup directory for existing files.
        """
        self.repo_path = repo_path
        self.home_path = home_path or Path.home()
        self.backup_dir = backup_dir or (self.home_path / ".dotfiles-backup")

    def get_target_path(self, source: Path) -> Path:
        """Get the target path in home directory for a source file.

        Args:
            source: Path to file in dotfiles repo.

        Returns:
            Corresponding path in home directory.
        """
        relative = source.relative_to(self.repo_path)
        return self.home_path / relative

    def link_file(
        self,
        source: Path,
        strategy: ConflictStrategy = ConflictStrategy.BACKUP,
    ) -> LinkResult:
        """Create a symlink for a single file.

        Args:
            source: Path to file in dotfiles repo.
            strategy: How to handle existing files.

        Returns:
            LinkResult with operation details.
        """
        target = self.get_target_path(source)

        debug(f"Linking {source} -> {target}")

        # Check if target already exists
        if target.exists() or target.is_symlink():
            if target.is_symlink() and target.resolve() == source.resolve():
                return LinkResult(
                    source=source,
                    target=target,
                    success=True,
                    message="Already linked",
                )

            # Handle conflict based on strategy
            result = self._handle_conflict(source, target, strategy)
            if not result.success:
                return result

        # Create parent directories if needed
        target.parent.mkdir(parents=True, exist_ok=True)

        # Create symlink
        target.symlink_to(source)

        success(f"Linked {target.name}")
        return LinkResult(
            source=source,
            target=target,
            success=True,
            message="Created symlink",
        )

    def _handle_conflict(
        self,
        source: Path,
        target: Path,
        strategy: ConflictStrategy,
    ) -> LinkResult:
        """Handle existing file conflict.

        Args:
            source: Source file in dotfiles repo.
            target: Existing target file.
            strategy: Conflict resolution strategy.

        Returns:
            LinkResult indicating whether to proceed.
        """
        if strategy == ConflictStrategy.SKIP:
            warning(f"Skipping {target.name} (already exists)")
            return LinkResult(
                source=source,
                target=target,
                success=False,
                message="Skipped (file exists)",
            )

        if strategy == ConflictStrategy.BACKUP:
            backup_path = self._backup_file(target)
            return LinkResult(
                source=source,
                target=target,
                success=True,
                message="Backed up existing file",
                backed_up=backup_path,
            )

        if strategy == ConflictStrategy.OVERWRITE:
            if target.is_symlink():
                target.unlink()
            elif target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink()
            return LinkResult(
                source=source,
                target=target,
                success=True,
                message="Overwrote existing file",
            )

        # ASK strategy would prompt user (not implemented in this example)
        return LinkResult(
            source=source,
            target=target,
            success=False,
            message="User interaction required",
        )

    def _backup_file(self, path: Path) -> Path:
        """Backup a file to the backup directory.

        Args:
            path: Path to file to backup.

        Returns:
            Path to backup file.
        """
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # Create unique backup name with timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{path.name}.{timestamp}.bak"
        backup_path = self.backup_dir / backup_name

        if path.is_symlink():
            # Just remove symlinks, don't backup
            path.unlink()
        elif path.is_dir():
            shutil.move(str(path), str(backup_path))
        else:
            shutil.copy2(path, backup_path)
            path.unlink()

        debug(f"Backed up {path} to {backup_path}")
        return backup_path

    def link_all(
        self,
        strategy: ConflictStrategy = ConflictStrategy.BACKUP,
        ignore_patterns: list[str] | None = None,
    ) -> list[LinkResult]:
        """Link all files in the dotfiles repository.

        Args:
            strategy: How to handle existing files.
            ignore_patterns: Patterns to ignore (e.g., [".git", "README.md"]).

        Returns:
            List of LinkResult for each file.
        """
        ignore = set(ignore_patterns or [".git", "README.md", "LICENSE"])
        results: list[LinkResult] = []

        for source in self.repo_path.rglob("*"):
            # Skip directories (we only link files)
            if source.is_dir():
                continue

            # Skip ignored files
            if any(part in ignore for part in source.parts):
                continue

            result = self.link_file(source, strategy)
            results.append(result)

        return results
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/3-1-symlinks
- **Notes**: (any additional context)

---

**Subtask 3.1.2: Symlink Status and Repair (Single Session)**

**Prerequisites**:
- [ ] 3.1.1: Symlink Creation completed

**Deliverables**:
- [ ] Implement `get_status()` - check all symlink states
- [ ] Implement `repair()` - fix broken symlinks
- [ ] Add `dotfiles status` command (show linked/unlinked/broken)
- [ ] Add `dotfiles repair` command
- [ ] Show nice table output with Rich
- [ ] Write unit tests

**Files to Create**:
- None

**Files to Modify**:
- `dotfiles_manager/linker.py`
- `dotfiles_manager/cli.py`
- `tests/test_linker.py`

**Success Criteria**:
- [ ] Status shows all files with their link state
- [ ] Repair fixes broken symlinks
- [ ] Nice colored table output
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/3-1-symlinks
- **Notes**: (any additional context)

---

## Phase 4: Profile System

**Goal**: Support multiple dotfile profiles (work, home, server)

### Task 4.1: Profile Management

**Subtask 4.1.1: Profile Configuration (Single Session)**

**Prerequisites**:
- [ ] Phase 3 completed

**Deliverables**:
- [ ] Create `dotfiles_manager/profiles.py` with ProfileManager class
- [ ] Profile structure: `profiles/<profile-name>/` in dotfiles repo
- [ ] Implement `create_profile()`
- [ ] Implement `list_profiles()`
- [ ] Implement `delete_profile()`
- [ ] Add `dotfiles profile create <name>` command
- [ ] Add `dotfiles profile list` command
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/profiles.py`
- `tests/test_profiles.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] Can create new profiles
- [ ] Profiles stored in `profiles/` subdirectory
- [ ] List shows all profiles with active indicator
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/4-1-profiles
- **Notes**: (any additional context)

---

**Subtask 4.1.2: Profile Switching (Single Session)**

**Prerequisites**:
- [ ] 4.1.1: Profile Configuration completed

**Deliverables**:
- [ ] Implement `switch_profile()` - unlink old, link new profile
- [ ] Implement `get_active_profile()`
- [ ] Add `dotfiles profile switch <name>` command
- [ ] Store active profile in config
- [ ] Handle profile-specific overrides (merge base + profile)
- [ ] Write unit tests

**Files to Create**:
- None

**Files to Modify**:
- `dotfiles_manager/profiles.py`
- `dotfiles_manager/cli.py`
- `dotfiles_manager/config.py`
- `tests/test_profiles.py`

**Success Criteria**:
- [ ] Switch cleanly unlinks old and links new
- [ ] Active profile persisted across sessions
- [ ] Profile files override base files
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/4-1-profiles
- **Notes**: (any additional context)

---

## Phase 5: Encryption

**Goal**: Encrypt sensitive files like API keys and tokens

### Task 5.1: Encryption System

**Subtask 5.1.1: Encryption Core (Single Session)**

**Prerequisites**:
- [ ] Phase 4 completed

**Deliverables**:
- [ ] Create `dotfiles_manager/crypto.py` with Encryptor class
- [ ] Use AES-256-GCM for encryption
- [ ] Derive key from password using PBKDF2 (100k iterations)
- [ ] Implement `encrypt_file()` - creates `.enc` version
- [ ] Implement `decrypt_file()` - decrypts `.enc` file
- [ ] Store salt with encrypted data
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/crypto.py`
- `tests/test_crypto.py`

**Files to Modify**:
- None

**Success Criteria**:
- [ ] Files encrypt/decrypt correctly
- [ ] Different passwords produce different ciphertext
- [ ] Wrong password raises clear error
- [ ] Tests pass with >90% coverage (security critical)

**Example dotfiles_manager/crypto.py**:
```python
"""Encryption utilities for sensitive dotfiles."""

import os
import secrets
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


class CryptoError(Exception):
    """Raised when encryption/decryption fails."""
    pass


class Encryptor:
    """Handles encryption and decryption of sensitive files."""

    # Number of PBKDF2 iterations (OWASP recommends 100k+)
    ITERATIONS = 100_000

    # Salt length in bytes
    SALT_LENGTH = 16

    # Nonce length for AES-GCM
    NONCE_LENGTH = 12

    def __init__(self, password: str) -> None:
        """Initialize encryptor with a password.

        Args:
            password: Password used to derive encryption key.
        """
        self.password = password.encode()

    def _derive_key(self, salt: bytes) -> bytes:
        """Derive encryption key from password and salt.

        Args:
            salt: Random salt for key derivation.

        Returns:
            32-byte key for AES-256.
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=self.ITERATIONS,
        )
        return kdf.derive(self.password)

    def encrypt(self, plaintext: bytes) -> bytes:
        """Encrypt data.

        Args:
            plaintext: Data to encrypt.

        Returns:
            Encrypted data with salt and nonce prepended:
            [salt (16 bytes)][nonce (12 bytes)][ciphertext][tag (16 bytes)]
        """
        salt = secrets.token_bytes(self.SALT_LENGTH)
        nonce = secrets.token_bytes(self.NONCE_LENGTH)
        key = self._derive_key(salt)

        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        return salt + nonce + ciphertext

    def decrypt(self, ciphertext: bytes) -> bytes:
        """Decrypt data.

        Args:
            ciphertext: Data encrypted with encrypt().

        Returns:
            Decrypted plaintext.

        Raises:
            CryptoError: If decryption fails (wrong password or corrupted data).
        """
        if len(ciphertext) < self.SALT_LENGTH + self.NONCE_LENGTH + 16:
            raise CryptoError("Ciphertext too short")

        salt = ciphertext[:self.SALT_LENGTH]
        nonce = ciphertext[self.SALT_LENGTH:self.SALT_LENGTH + self.NONCE_LENGTH]
        encrypted_data = ciphertext[self.SALT_LENGTH + self.NONCE_LENGTH:]

        key = self._derive_key(salt)
        aesgcm = AESGCM(key)

        try:
            return aesgcm.decrypt(nonce, encrypted_data, None)
        except Exception as e:
            raise CryptoError("Decryption failed (wrong password or corrupted data)") from e

    def encrypt_file(self, source: Path, dest: Path | None = None) -> Path:
        """Encrypt a file.

        Args:
            source: Path to file to encrypt.
            dest: Destination path (default: source with .enc suffix).

        Returns:
            Path to encrypted file.
        """
        dest = dest or source.with_suffix(source.suffix + ".enc")

        plaintext = source.read_bytes()
        ciphertext = self.encrypt(plaintext)
        dest.write_bytes(ciphertext)

        return dest

    def decrypt_file(self, source: Path, dest: Path | None = None) -> Path:
        """Decrypt a file.

        Args:
            source: Path to encrypted file.
            dest: Destination path (default: source without .enc suffix).

        Returns:
            Path to decrypted file.
        """
        if source.suffix != ".enc":
            raise CryptoError(f"Expected .enc file, got {source}")

        dest = dest or source.with_suffix("")

        ciphertext = source.read_bytes()
        plaintext = self.decrypt(ciphertext)
        dest.write_bytes(plaintext)

        return dest
```

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/5-1-encryption
- **Notes**: (any additional context)

---

**Subtask 5.1.2: Secret Management Commands (Single Session)**

**Prerequisites**:
- [ ] 5.1.1: Encryption Core completed

**Deliverables**:
- [ ] Add `dotfiles secret encrypt <file>` command
- [ ] Add `dotfiles secret decrypt <file>` command
- [ ] Add `dotfiles secret list` command (show encrypted files)
- [ ] Prompt for password securely (no echo)
- [ ] Support password from environment variable `DOTFILES_PASSWORD`
- [ ] Write integration tests

**Files to Create**:
- None

**Files to Modify**:
- `dotfiles_manager/cli.py`
- `tests/test_crypto.py`

**Success Criteria**:
- [ ] Commands work end-to-end
- [ ] Password input is hidden
- [ ] Environment variable override works
- [ ] Tests pass with >85% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/5-1-encryption
- **Notes**: (any additional context)

---

## Phase 6: Backup & Restore

**Goal**: Backup existing dotfiles and restore from backup

### Task 6.1: Backup System

**Subtask 6.1.1: Backup System (Single Session)**

**Prerequisites**:
- [ ] Phase 5 completed

**Deliverables**:
- [ ] Create `dotfiles_manager/backup.py` with BackupManager class
- [ ] Implement `create_backup()` - snapshot current home config
- [ ] Implement `list_backups()` - show available backups
- [ ] Add `dotfiles backup create [name]` command
- [ ] Add `dotfiles backup list` command
- [ ] Compress backups with timestamps
- [ ] Write unit tests

**Files to Create**:
- `dotfiles_manager/backup.py`
- `tests/test_backup.py`

**Files to Modify**:
- `dotfiles_manager/cli.py`

**Success Criteria**:
- [ ] Backups created in `~/.dotfiles-backup/`
- [ ] Backups are compressed (tar.gz)
- [ ] List shows backup date and size
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/6-1-backup
- **Notes**: (any additional context)

---

**Subtask 6.1.2: Restore System (Single Session)**

**Prerequisites**:
- [ ] 6.1.1: Backup System completed

**Deliverables**:
- [ ] Implement `restore_backup()` - restore from backup
- [ ] Add `dotfiles backup restore <name>` command
- [ ] Add `dotfiles backup delete <name>` command
- [ ] Confirm before restore (destructive operation)
- [ ] Option to restore specific files only
- [ ] Write integration tests

**Files to Create**:
- None

**Files to Modify**:
- `dotfiles_manager/backup.py`
- `dotfiles_manager/cli.py`
- `tests/test_backup.py`

**Success Criteria**:
- [ ] Restore replaces current config with backup
- [ ] Confirmation prompt before restore
- [ ] Can restore individual files
- [ ] Tests pass with >80% coverage

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**: (list files)
- **Files Modified**: (list files)
- **Tests**: (pass/fail, coverage %)
- **Build**: (success/fail)
- **Branch**: feature/6-1-backup
- **Notes**: (any additional context)

---

## Phase 7: Polish & Release

**Goal**: Cross-platform testing, documentation, and PyPI release

### Task 7.1: Polish

**Subtask 7.1.1: Cross-Platform Testing (Single Session)**

**Prerequisites**:
- [ ] Phase 6 completed

**Deliverables**:
- [ ] Test all functionality on Ubuntu 22.04
- [ ] Test all functionality on macOS 13+
- [ ] Fix any platform-specific issues
- [ ] Add platform detection utilities
- [ ] Document platform differences

**Files to Create**:
- `dotfiles_manager/platform.py`

**Files to Modify**:
- Various files as needed for fixes

**Success Criteria**:
- [ ] All tests pass on Linux
- [ ] All tests pass on macOS
- [ ] Handles platform-specific dotfiles (.bashrc vs .zshrc)

---

**Subtask 7.1.2: Documentation (Single Session)**

**Prerequisites**:
- [ ] 7.1.1: Cross-Platform Testing completed

**Deliverables**:
- [ ] Complete README with all features
- [ ] Add usage examples for each command
- [ ] Document profile setup workflow
- [ ] Document encryption best practices
- [ ] Add CONTRIBUTING.md

**Files to Create**:
- `CONTRIBUTING.md`

**Files to Modify**:
- `README.md`

**Success Criteria**:
- [ ] README covers installation, all commands, examples
- [ ] All CLI commands have help text
- [ ] Security best practices documented

---

**Subtask 7.1.3: PyPI Release (Single Session)**

**Prerequisites**:
- [ ] 7.1.2: Documentation completed

**Deliverables**:
- [ ] Verify `pyproject.toml` metadata
- [ ] Build package: `python -m build`
- [ ] Test installation: `pip install dist/*.whl`
- [ ] Create GitHub release
- [ ] Upload to PyPI: `twine upload dist/*`

**Files to Create**:
- `.github/workflows/release.yml`

**Files to Modify**:
- `pyproject.toml` (bump version if needed)

**Success Criteria**:
- [ ] Package builds without errors
- [ ] `pip install dotfiles-manager` works from PyPI
- [ ] GitHub release created with changelog

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

- **Branching Strategy**: One branch per task (e.g., `feature/3-1-symlinks`)
- **Commit Convention**: Semantic commits (feat:, fix:, refactor:, test:, docs:, chore:)
- **Merge Strategy**: Squash merge when task is complete
- **PR Required**: Yes for production branches

**Key principle**: One branch per task, subtasks commit to it, squash merge upon completion.

---

*Generated by DevPlan MCP Server*
