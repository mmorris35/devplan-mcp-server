# HelloCLI — Gold Standard Example Plan

This is the reference example of a Haiku-executable development plan.
Study this before generating any plan.

> **Note**: This example uses `### Subtask` headings for readability. When
> generating plans for validation, use `**Subtask X.Y.Z: Title**` bold format
> instead, as validators only recognize that pattern.

---

# DEVELOPMENT_PLAN.md - HelloCLI

> **Haiku-Executable Plan**: Every subtask contains complete, copy-pasteable code. Claude Haiku can execute this mechanically without inference.

## Project Summary

| Field | Value |
|-------|-------|
| **Project** | HelloCLI |
| **Goal** | Minimal CLI that greets users by name with optional color output |
| **Phases** | 2 |
| **Tasks** | 4 |
| **Subtasks** | 6 |

---

## Phase Overview

| Phase | Name | Tasks | Status |
|-------|------|-------|--------|
| 1 | Project Setup | 2 | Pending |
| 2 | CLI Implementation | 2 | Pending |

---

# Phase 1: Project Setup

## Task 1.1: Initialize Project Structure

**Branch:** `feature/1.1-project-init`

**Subtask 1.1.1: Create pyproject.toml**

**Prerequisites:** None

**Deliverables:**
- [ ] `pyproject.toml` - Project configuration

**Complete Code:**

Create file `pyproject.toml`:
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "hello-cli"
version = "0.1.0"
description = "A minimal CLI that greets users by name"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "click>=8.1.0",
    "rich>=13.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]

[project.scripts]
hello = "hello_cli.cli:main"

[tool.ruff]
target-version = "py311"
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_ignores = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=hello_cli --cov-report=term-missing"

[tool.coverage.run]
source = ["src/hello_cli"]
branch = true

[tool.coverage.report]
fail_under = 100
show_missing = true
```

**Verification:**
```bash
python -c "import tomllib; tomllib.load(open('pyproject.toml', 'rb'))"
# Expected: No output (success)
```

**Success Criteria:**
- [ ] `pyproject.toml` exists
- [ ] TOML parses without error
- [ ] All dependencies listed

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Files Created**: `pyproject.toml`
- **Verification**: (filled by executor)

---

**Subtask 1.1.2: Create Package Structure**

**Prerequisites:** 1.1.1 complete

**Deliverables:**
- [ ] `src/hello_cli/__init__.py` - Package init with version
- [ ] `src/hello_cli/cli.py` - CLI placeholder
- [ ] `tests/__init__.py` - Test package init

**Complete Code:**

Create file `src/hello_cli/__init__.py`:
```python
"""HelloCLI - A minimal greeting CLI."""

from __future__ import annotations

__version__ = "0.1.0"
__all__ = ["__version__"]
```

Create file `src/hello_cli/cli.py`:
```python
"""CLI entry point for HelloCLI."""

from __future__ import annotations


def main() -> None:
    """Entry point placeholder."""
    pass
```

Create file `tests/__init__.py`:
```python
"""Test package for HelloCLI."""
```

**Verification:**
```bash
ls -la src/hello_cli/
# Expected: __init__.py, cli.py

ls -la tests/
# Expected: __init__.py

python -c "from hello_cli import __version__; print(__version__)"
# Expected: 0.1.0
```

**Success Criteria:**
- [ ] Package structure created
- [ ] `__version__` importable
- [ ] Tests directory exists

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Files Created**: `src/hello_cli/__init__.py`, `src/hello_cli/cli.py`, `tests/__init__.py`
- **Verification**: (filled by executor)

---

### Task 1.1 Complete - Squash Merge

```bash
git push -u origin feature/1.1-project-init
git checkout main
git pull origin main
git merge --squash feature/1.1-project-init
git commit -m "feat(setup): initialize project structure

- Add pyproject.toml with dependencies
- Create src/hello_cli package structure
- Add tests directory"
git push origin main
git branch -d feature/1.1-project-init
git push origin --delete feature/1.1-project-init
```

- [ ] All subtasks complete (1.1.1, 1.1.2)
- [ ] All verification passes
- [ ] Squash merged to main
- [ ] Feature branch deleted

---

## Task 1.2: Install and Verify

**Branch:** `feature/1.2-install-verify`

**Subtask 1.2.1: Install Dev Dependencies and Verify Tools**

**Prerequisites:** Task 1.1 complete

**Deliverables:**
- [ ] Package installed in editable mode
- [ ] All dev tools working

**Complete Code:**

Commands to execute:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
ruff --version
# Expected: ruff 0.x.x
mypy --version
# Expected: mypy 1.x.x
pytest --version
# Expected: pytest 7.x.x
```

**Verification:**
```bash
hello --help || true
# Expected: Error (no --help implemented yet) - this is OK

python -c "from hello_cli import __version__; print('OK')"
# Expected: OK
```

**Success Criteria:**
- [ ] `pip install -e ".[dev]"` succeeds
- [ ] `ruff --version` works
- [ ] `mypy --version` works
- [ ] `pytest --version` works

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Verification**: (filled by executor)

---

### Task 1.2 Complete - Squash Merge

```bash
git push -u origin feature/1.2-install-verify
git checkout main
git pull origin main
git merge --squash feature/1.2-install-verify
git commit -m "chore(setup): install and verify dev dependencies

- Install package in editable mode
- Verify ruff, mypy, pytest work"
git push origin main
git branch -d feature/1.2-install-verify
git push origin --delete feature/1.2-install-verify
```

- [ ] All subtasks complete (1.2.1)
- [ ] All verification passes
- [ ] Squash merged to main
- [ ] Feature branch deleted

---

# Phase 2: CLI Implementation

## Task 2.1: Implement Core CLI

**Branch:** `feature/2.1-core-cli`

**Subtask 2.1.1: Implement Greeting Command**

**Prerequisites:** Task 1.2 complete

**Deliverables:**
- [ ] `src/hello_cli/cli.py` - Full CLI implementation
- [ ] `tests/test_cli.py` - Complete test suite (8 tests)

**Complete Code:**

Replace `src/hello_cli/cli.py` with:
```python
"""CLI entry point for HelloCLI."""

from __future__ import annotations

import click
from rich.console import Console

from hello_cli import __version__

console = Console()


@click.command()
@click.argument("name", default="World")
@click.option("--color", is_flag=True, help="Use colored output")
@click.version_option(version=__version__, prog_name="hello-cli")
def main(name: str, color: bool) -> None:
    """Greet NAME with a friendly message.

    If no NAME is provided, greets "World" by default.

    Examples:
        hello Alice        -> Hello, Alice!
        hello --color Bob  -> Hello, Bob! (in green)
    """
    message = f"Hello, {name}!"

    if color:
        console.print(message, style="bold green")
    else:
        click.echo(message)


if __name__ == "__main__":
    main()
```

Create file `tests/test_cli.py`:
```python
"""Tests for HelloCLI."""

from __future__ import annotations

from click.testing import CliRunner

from hello_cli import __version__
from hello_cli.cli import main


class TestGreetCommand:
    """Test suite for the greet command."""

    def test_greet_default_name(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, [])
        assert result.exit_code == 0
        assert "Hello, World!" in result.output

    def test_greet_custom_name(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["Alice"])
        assert result.exit_code == 0
        assert "Hello, Alice!" in result.output

    def test_greet_with_color_flag(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["Bob", "--color"])
        assert result.exit_code == 0
        assert "Bob" in result.output

    def test_version_flag(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["--version"])
        assert result.exit_code == 0
        assert __version__ in result.output
        assert "hello-cli" in result.output

    def test_help_flag(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "Greet NAME" in result.output
        assert "--color" in result.output
        assert "--version" in result.output


class TestEdgeCases:
    """Test edge cases."""

    def test_empty_string_name(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, [""])
        assert result.exit_code == 0
        assert "Hello, !" in result.output

    def test_name_with_spaces(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["John Doe"])
        assert result.exit_code == 0
        assert "Hello, John Doe!" in result.output

    def test_special_characters_in_name(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["Jose Garcia"])
        assert result.exit_code == 0
        assert "Hello, Jose Garcia!" in result.output
```

**Verification:**
```bash
ruff check src tests
# Expected: All checks passed!

mypy src
# Expected: Success: no issues found

pytest tests/ -v --cov=hello_cli --cov-report=term-missing
# Expected: 8 passed, 100% coverage
```

**Success Criteria:**
- [ ] `ruff check src tests` passes
- [ ] `mypy src` passes
- [ ] `pytest` shows 8 tests passing
- [ ] Coverage is 100%

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Files Created**: `tests/test_cli.py`
- **Files Modified**: `src/hello_cli/cli.py`
- **Tests**: 8 tests, 100% coverage
- **Verification**: (filled by executor)

---

### Task 2.1 Complete - Squash Merge

```bash
git push -u origin feature/2.1-core-cli
git checkout main
git pull origin main
git merge --squash feature/2.1-core-cli
git commit -m "feat(cli): implement greeting command

- Add click-based CLI with name argument
- Add --color flag for Rich output
- Add --version and --help flags
- 8 tests, 100% coverage"
git push origin main
git branch -d feature/2.1-core-cli
git push origin --delete feature/2.1-core-cli
```

- [ ] All subtasks complete (2.1.1)
- [ ] All tests pass with 100% coverage
- [ ] Squash merged to main
- [ ] Feature branch deleted

---

## Task 2.2: Final Verification

**Branch:** `feature/2.2-final-verify`

**Subtask 2.2.1: End-to-End Testing**

**Prerequisites:** Task 2.1 complete

**Deliverables:**
- [ ] CLI works from command line
- [ ] All flags function correctly

**Complete Code:**

Commands to execute:
```bash
hello
# Expected: Hello, World!

hello Alice
# Expected: Hello, Alice!

hello Bob --color
# Expected: Hello, Bob! (in green)

hello --version
# Expected: hello-cli, version 0.1.0

hello --help
# Expected: Usage info with all options
```

**Verification:**
```bash
hello && hello Alice && hello --version && hello --help
# Expected: All succeed (exit 0)

pytest tests/ -v --cov=hello_cli --cov-report=term-missing --cov-fail-under=100
# Expected: 8 passed, 100% coverage, exit 0
```

**Success Criteria:**
- [ ] `hello` outputs "Hello, World!"
- [ ] `hello Alice` outputs "Hello, Alice!"
- [ ] `hello --version` shows version
- [ ] `hello --help` shows help
- [ ] All tests pass with 100% coverage

**Completion Notes:**
- **Implementation**: (filled by executor)
- **Verification**: (filled by executor)

---

### Task 2.2 Complete - Squash Merge

```bash
git push -u origin feature/2.2-final-verify
git checkout main
git pull origin main
git merge --squash feature/2.2-final-verify
git commit -m "test(cli): complete end-to-end verification

- Verify all CLI commands work
- Confirm 100% test coverage
- All quality checks pass"
git push origin main
git branch -d feature/2.2-final-verify
git push origin --delete feature/2.2-final-verify
```

- [ ] All subtasks complete (2.2.1)
- [ ] All verification passes
- [ ] Squash merged to main
- [ ] Feature branch deleted

---

# Project Complete Checklist

- [ ] Phase 1: Project Setup complete
- [ ] Phase 2: CLI Implementation complete
- [ ] All tests pass (8 tests)
- [ ] 100% code coverage
- [ ] CLI works: `hello`, `hello NAME`, `hello --color`, `hello --version`, `hello --help`
- [ ] Clean git history (squash merges only)
