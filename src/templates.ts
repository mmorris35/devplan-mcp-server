/**
 * Project templates and defaults for DevPlan MCP Server.
 *
 * Contains detailed task breakdowns for each project type with specific
 * deliverables, file paths, and success criteria - paint-by-numbers style.
 */

export type ProjectType = "cli" | "web_app" | "api" | "library";

export interface TemplateConfig {
	name: string;
	description: string;
	defaultPhases: string[];
	defaultTechStack: {
		language: string;
		framework?: string;
		database?: string;
		testing?: string;
		linting?: string;
		typeChecking?: string;
		deployment?: string;
		ciCd?: string;
	};
}

export const TEMPLATES: Record<ProjectType, TemplateConfig> = {
	cli: {
		name: "CLI Tool",
		description: "Command-line application with arguments and options",
		defaultPhases: ["Foundation", "Core Commands", "Advanced Features", "Polish & Release"],
		defaultTechStack: {
			language: "Python 3.11+",
			framework: "Click or Typer",
			testing: "pytest",
			linting: "ruff",
			typeChecking: "mypy",
			deployment: "PyPI",
			ciCd: "GitHub Actions",
		},
	},
	web_app: {
		name: "Web Application",
		description: "Full-stack web application with frontend and backend",
		defaultPhases: ["Foundation", "Backend API", "Frontend UI", "Integration", "Polish & Release"],
		defaultTechStack: {
			language: "TypeScript",
			framework: "Next.js or React + Express",
			database: "PostgreSQL",
			testing: "Jest + Playwright",
			linting: "eslint",
			typeChecking: "TypeScript",
			deployment: "Vercel or AWS",
			ciCd: "GitHub Actions",
		},
	},
	api: {
		name: "REST API",
		description: "Backend API service with endpoints and data models",
		defaultPhases: ["Foundation", "Data Models", "Core Endpoints", "Advanced Features", "Polish & Release"],
		defaultTechStack: {
			language: "Python 3.11+",
			framework: "FastAPI",
			database: "PostgreSQL",
			testing: "pytest",
			linting: "ruff",
			typeChecking: "mypy",
			deployment: "Docker + AWS/GCP",
			ciCd: "GitHub Actions",
		},
	},
	library: {
		name: "Library/Package",
		description: "Reusable library or package for other projects",
		defaultPhases: ["Foundation", "Core Module", "API Design", "Documentation", "Polish & Release"],
		defaultTechStack: {
			language: "Python 3.11+",
			testing: "pytest",
			linting: "ruff",
			typeChecking: "mypy",
			deployment: "PyPI",
			ciCd: "GitHub Actions",
		},
	},
};

export function getTemplate(projectType: string): TemplateConfig {
	const normalized = projectType.toLowerCase().replace(/[\s-]/g, "_") as ProjectType;
	return TEMPLATES[normalized] || TEMPLATES.cli;
}

export function listTemplates(): Array<{ type: ProjectType; name: string; description: string }> {
	return Object.entries(TEMPLATES).map(([type, config]) => ({
		type: type as ProjectType,
		name: config.name,
		description: config.description,
	}));
}

/**
 * Detailed task breakdowns for each project type.
 * Each subtask includes: deliverables, files to create/modify, and success criteria.
 * This is the "paint-by-numbers" structure that makes plans executable.
 */
export interface SubtaskTemplate {
	id: string;
	title: string;
	deliverables: string[];
	filesToCreate: string[];
	filesToModify: string[];
	successCriteria: string[];
	techDecisions?: string[];
}

export interface TaskTemplate {
	id: string;
	title: string;
	subtasks: SubtaskTemplate[];
}

export interface PhaseTemplate {
	id: string;
	title: string;
	goal: string;
	days?: string;
	tasks: TaskTemplate[];
}

export const PROJECT_TYPE_TASKS: Record<ProjectType, PhaseTemplate[]> = {
	cli: [
		{
			id: "0",
			title: "Foundation",
			goal: "Set up repository, package structure, and development tools",
			days: "1-2 days",
			tasks: [
				{
					id: "0.1",
					title: "Repository Setup",
					subtasks: [
						{
							id: "0.1.1",
							title: "Initialize Git Repository",
							deliverables: [
								"Run `git init` to initialize repository",
								"Create `.gitignore` with Python standard ignores",
								"Create `README.md` with project name and description sections",
								"Create `LICENSE` file with MIT license text",
								"Run `git add .` to stage all files",
								"Run `git commit -m 'chore: initial repository setup'`",
							],
							filesToCreate: [".gitignore", "README.md", "LICENSE"],
							filesToModify: [],
							successCriteria: [
								"`.gitignore` includes `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `build/`, `.env`",
								"README.md has `# {project}` heading with project name",
								"README.md has `## Description` section with one-sentence goal",
								"README.md has `## Installation` section with placeholder text",
								"LICENSE file contains full MIT license text with current year",
								"First commit exists with semantic message format",
								"`git status` shows clean working tree after commit",
							],
							techDecisions: [
								"Use MIT license for open-source compatibility",
								"Follow semantic commit convention from the start",
							],
						},
						{
							id: "0.1.2",
							title: "Python Package Structure",
							deliverables: [
								"Create `{project}/` package directory with `mkdir -p`",
								"Create `{project}/__init__.py` with `__version__ = '0.1.0'`",
								"Create `{project}/cli.py` with placeholder Click group",
								"Create `tests/` directory with `mkdir -p`",
								"Create `tests/__init__.py` as empty file",
								"Create `pyproject.toml` with project metadata and dependencies",
								"Verify package imports: `python -c \"import {project}\"`",
							],
							filesToCreate: [
								"{project}/__init__.py",
								"{project}/cli.py",
								"tests/__init__.py",
								"pyproject.toml",
							],
							filesToModify: [],
							successCriteria: [
								"`python -c \"import {project}; print({project}.__version__)\"` prints '0.1.0'",
								"`pyproject.toml` has `[project]` section with name, version, description",
								"`pyproject.toml` has `[project.scripts]` section for CLI entry point",
								"`pyproject.toml` has `dependencies` array with click, pytest",
								"`{project}/__init__.py` exports `__version__` string",
								"`{project}/cli.py` contains `@click.group()` decorator",
								"`tests/__init__.py` exists and is importable",
							],
							techDecisions: [
								"Package name for PyPI: {project}",
								"Module name for Python: {project_underscore}",
								"Use pyproject.toml (PEP 517/518) instead of setup.py",
							],
						},
						{
							id: "0.1.3",
							title: "Development Dependencies",
							deliverables: [
								"Add `[project.optional-dependencies]` section to pyproject.toml",
								"Define `dev` extras with pytest, ruff, mypy, pre-commit",
								"Create virtual environment: `python -m venv .venv`",
								"Activate venv and run `pip install -e \".[dev]\"`",
								"Verify imports: `python -c \"import click; import pytest; import ruff\"`",
								"Update README.md with installation instructions",
								"Add virtual environment setup instructions to README",
							],
							filesToCreate: [],
							filesToModify: ["pyproject.toml", "README.md"],
							successCriteria: [
								"`pip install -e \".[dev]\"` completes with exit code 0",
								"`python -c \"import click\"` succeeds without ImportError",
								"`python -c \"import pytest\"` succeeds without ImportError",
								"`ruff --version` prints version number",
								"`mypy --version` prints version number",
								"README has `## Installation` section with venv instructions",
								"README shows both user install and dev install commands",
							],
							techDecisions: [
								"Use optional-dependencies for dev tools (cleaner than requirements-dev.txt)",
								"Include ruff for linting (faster than flake8+black)",
								"Include mypy for type checking",
							],
						},
					],
				},
				{
					id: "0.2",
					title: "Development Tools",
					subtasks: [
						{
							id: "0.2.1",
							title: "Pre-commit Hooks",
							deliverables: [
								"Create `.pre-commit-config.yaml` with repos list",
								"Add ruff hook with `ruff check --fix` and `ruff format`",
								"Add mypy hook with `--strict` flag",
								"Add trailing-whitespace and end-of-file-fixer hooks",
								"Run `pre-commit install` to set up git hooks",
								"Run `pre-commit run --all-files` to verify setup",
								"Add `[tool.ruff]` section to pyproject.toml with config",
								"Add `[tool.mypy]` section to pyproject.toml with strict settings",
							],
							filesToCreate: [".pre-commit-config.yaml"],
							filesToModify: ["pyproject.toml"],
							successCriteria: [
								"`.pre-commit-config.yaml` exists with valid YAML syntax",
								"`pre-commit install` completes without errors",
								"`pre-commit run --all-files` passes on clean codebase",
								"`ruff check .` exits with code 0",
								"`ruff format --check .` exits with code 0",
								"`mypy {project}/` exits with code 0 or only expected issues",
								"Git commit triggers pre-commit hooks automatically",
							],
							techDecisions: [
								"Use ruff for both linting and formatting (replaces flake8+black+isort)",
								"Run mypy in strict mode for maximum type safety",
								"Include pre-commit hooks for consistent code quality",
							],
						},
						{
							id: "0.2.2",
							title: "CI/CD Pipeline",
							deliverables: [
								"Create `.github/workflows/` directory",
								"Create `.github/workflows/ci.yml` with workflow definition",
								"Define `test` job: checkout, setup-python, install deps, pytest",
								"Define `lint` job: checkout, setup-python, install deps, ruff check",
								"Define `typecheck` job: checkout, setup-python, install deps, mypy",
								"Configure workflow triggers: push to main, pull_request",
								"Add CI status badge to README.md header",
							],
							filesToCreate: [".github/workflows/ci.yml"],
							filesToModify: ["README.md"],
							successCriteria: [
								"`.github/workflows/ci.yml` has valid YAML syntax",
								"Workflow defines `on: [push, pull_request]` triggers",
								"Test job runs `pytest tests/ -v --cov`",
								"Lint job runs `ruff check .` and `ruff format --check .`",
								"Type check job runs `mypy {project}/`",
								"All jobs use `ubuntu-latest` runner",
								"README has `![CI](https://github.com/...` badge at top",
							],
							techDecisions: [
								"Use GitHub Actions for CI/CD (most common for open source)",
								"Run jobs in parallel for faster feedback",
								"Use setup-python action with version matrix if needed",
							],
						},
					],
				},
			],
		},
		{
			id: "1",
			title: "Core Commands",
			goal: "Implement the main CLI commands and core functionality",
			days: "3-5 days",
			tasks: [
				{
					id: "1.1",
					title: "CLI Entry Point",
					subtasks: [
						{
							id: "1.1.1",
							title: "Click CLI Setup",
							deliverables: [
								"Implement `cli()` function with `@click.group()` decorator in `{project}/cli.py`",
								"Implement `version_callback(ctx, param, value)` for --version flag",
								"Add `@click.version_option()` decorator with callback",
								"Add `@click.pass_context` for context propagation",
								"Update `[project.scripts]` in pyproject.toml: `{project} = \"{project}.cli:cli\"`",
								"Reinstall package: `pip install -e .`",
								"Verify CLI: `{project} --help` and `{project} --version`",
							],
							filesToCreate: [],
							filesToModify: ["{project}/cli.py", "pyproject.toml"],
							successCriteria: [
								"`{project} --version` prints version from `__version__`",
								"`{project} --help` shows group help with command list",
								"`{project}` with no args shows help (not error)",
								"Entry point `{project}` is in PATH after pip install",
								"cli.py imports `__version__` from `{project}/__init__.py`",
								"Click group has `help` parameter with description",
								"Exit code is 0 for --help and --version",
							],
							techDecisions: [
								"Use Click for CLI framework (Typer alternative considered)",
								"Use command group pattern for subcommands (extensible)",
								"Import version from __init__.py (single source of truth)",
							],
						},
					],
				},
			],
		},
	],
	web_app: [
		{
			id: "0",
			title: "Foundation",
			goal: "Set up repository, project structure, and development tools",
			days: "1-2 days",
			tasks: [
				{
					id: "0.1",
					title: "Repository Setup",
					subtasks: [
						{
							id: "0.1.1",
							title: "Initialize Git Repository",
							deliverables: [
								"Run `git init` to initialize repository",
								"Create `.gitignore` with Node.js + Next.js ignores",
								"Create `README.md` with project name and description",
								"Create `LICENSE` file with MIT license text",
								"Run `git add .` to stage all files",
								"Run `git commit -m 'chore: initial repository setup'`",
							],
							filesToCreate: [".gitignore", "README.md", "LICENSE"],
							filesToModify: [],
							successCriteria: [
								"`.gitignore` includes `node_modules/`, `.next/`, `.env*.local`, `*.log`",
								"README.md has `# {project}` heading",
								"README.md has description and tech stack sections",
								"LICENSE file contains MIT license with current year",
								"First commit exists with semantic message",
								"`git status` shows clean working tree",
								"`git log --oneline` shows initial commit",
							],
							techDecisions: [
								"Use MIT license for open-source compatibility",
								"Follow semantic commit convention from the start",
							],
						},
						{
							id: "0.1.2",
							title: "Next.js Project Setup",
							deliverables: [
								"Run `npx create-next-app@latest` with TypeScript, ESLint, Tailwind, App Router",
								"Verify `tsconfig.json` has `strict: true` in compilerOptions",
								"Create `src/app/layout.tsx` with RootLayout component",
								"Create `src/app/page.tsx` with Home component",
								"Configure `next.config.js` with any custom settings",
								"Run `npm run dev` and verify server starts",
								"Visit localhost:3000 and verify page renders",
							],
							filesToCreate: [
								"src/app/layout.tsx",
								"src/app/page.tsx",
								"tsconfig.json",
								"package.json",
								"next.config.js",
							],
							filesToModify: [],
							successCriteria: [
								"`npm run dev` starts server on localhost:3000 without errors",
								"`npm run build` completes without TypeScript errors",
								"Browser shows home page content at localhost:3000",
								"`tsconfig.json` has `strict: true` enabled",
								"App Router structure: `src/app/` directory exists",
								"`package.json` has next, react, react-dom dependencies",
								"Tailwind CSS classes work in components",
							],
							techDecisions: [
								"Use App Router (not Pages Router) - React Server Components support",
								"Enable strict TypeScript for maximum type safety",
								"Use Tailwind CSS for styling (fast development)",
							],
						},
					],
				},
				{
					id: "0.2",
					title: "Development Tools",
					subtasks: [
						{
							id: "0.2.1",
							title: "ESLint and Prettier",
							deliverables: [
								"Create `.eslintrc.json` extending `next/core-web-vitals`",
								"Create `.prettierrc` with tab width, semi, single quote settings",
								"Install prettier: `npm install -D prettier eslint-config-prettier`",
								"Add `format` script to package.json: `prettier --write .`",
								"Add `lint:fix` script: `eslint --fix .`",
								"Run `npm run lint` to verify no errors",
								"Run `npm run format` to format all files",
							],
							filesToCreate: [".eslintrc.json", ".prettierrc"],
							filesToModify: ["package.json"],
							successCriteria: [
								"`.eslintrc.json` extends `next/core-web-vitals`",
								"`.prettierrc` defines consistent formatting rules",
								"`npm run lint` exits with code 0",
								"`npm run format` formats files without errors",
								"ESLint and Prettier configs don't conflict",
								"`eslint-config-prettier` is in devDependencies",
								"All existing files pass lint after format",
							],
							techDecisions: [
								"Use eslint-config-prettier to avoid ESLint/Prettier conflicts",
								"Next.js ESLint config includes React best practices",
								"Prettier handles all formatting (ESLint only for logic)",
							],
						},
						{
							id: "0.2.2",
							title: "CI/CD Pipeline",
							deliverables: [
								"Create `.github/workflows/` directory",
								"Create `.github/workflows/ci.yml` with workflow definition",
								"Define `build` job: checkout, setup-node, npm ci, npm run build",
								"Define `lint` job: checkout, setup-node, npm ci, npm run lint",
								"Define `test` job: checkout, setup-node, npm ci, npm test (placeholder)",
								"Configure workflow triggers: push to main, pull_request",
								"Add CI status badge to README.md header",
							],
							filesToCreate: [".github/workflows/ci.yml"],
							filesToModify: ["README.md"],
							successCriteria: [
								"`.github/workflows/ci.yml` has valid YAML syntax",
								"Workflow triggers on push and pull_request events",
								"Build job runs `npm run build` successfully",
								"Lint job runs `npm run lint` successfully",
								"All jobs use Node.js 18+ with `ubuntu-latest`",
								"Jobs run in parallel for faster CI",
								"README has CI badge: `![CI](https://github.com/...)`",
							],
							techDecisions: [
								"Use GitHub Actions (best integration with GitHub)",
								"Use `npm ci` for reproducible installs",
								"Run jobs in parallel for faster feedback",
							],
						},
					],
				},
			],
		},
		{
			id: "1",
			title: "Backend API",
			goal: "Implement API routes and database models",
			days: "3-5 days",
			tasks: [
				{
					id: "1.1",
					title: "Database Setup",
					subtasks: [
						{
							id: "1.1.1",
							title: "Prisma ORM Setup",
							deliverables: [
								"Run `npm install prisma @prisma/client` to add dependencies",
								"Run `npx prisma init` to create prisma/ directory",
								"Create `.env` with `DATABASE_URL` connection string",
								"Create `.env.example` with placeholder DATABASE_URL",
								"Define `User` model in `prisma/schema.prisma` with id, email, name, createdAt",
								"Run `npx prisma migrate dev --name init` to create migration",
								"Run `npx prisma generate` to generate client",
							],
							filesToCreate: ["prisma/schema.prisma", ".env", ".env.example"],
							filesToModify: [".gitignore"],
							successCriteria: [
								"`prisma/schema.prisma` exists with valid schema syntax",
								"User model has id (cuid), email (unique), name, createdAt fields",
								"`.env` contains DATABASE_URL with valid connection string",
								"`.env` is in `.gitignore` (secrets not committed)",
								"`.env.example` is committed with placeholder value",
								"`npx prisma migrate dev` creates migration successfully",
								"`@prisma/client` can be imported: `import { PrismaClient } from '@prisma/client'`",
							],
							techDecisions: [
								"Use Prisma ORM for type-safe database access",
								"PostgreSQL as database (production-ready, widely supported)",
								"cuid for IDs (URL-safe, sortable, globally unique)",
							],
						},
					],
				},
			],
		},
	],
	api: [
		{
			id: "0",
			title: "Foundation",
			goal: "Set up repository, package structure, and development tools",
			days: "1-2 days",
			tasks: [
				{
					id: "0.1",
					title: "Repository Setup",
					subtasks: [
						{
							id: "0.1.1",
							title: "Initialize Git Repository",
							deliverables: [
								"Run `git init` to initialize repository",
								"Create `.gitignore` with Python + API ignores",
								"Create `README.md` with API name, description, endpoints section",
								"Create `LICENSE` file with MIT license text",
								"Run `git add .` to stage all files",
								"Run `git commit -m 'chore: initial repository setup'`",
							],
							filesToCreate: [".gitignore", "README.md", "LICENSE"],
							filesToModify: [],
							successCriteria: [
								"`.gitignore` includes `__pycache__/`, `*.pyc`, `.venv/`, `.env`, `*.db`",
								"README.md has `# {project} API` heading",
								"README.md has `## Endpoints` section (placeholder)",
								"README.md has `## Setup` section with install instructions",
								"LICENSE file contains MIT license with current year",
								"First commit exists with semantic message format",
								"`git status` shows clean working tree",
							],
							techDecisions: [
								"Use MIT license for open-source compatibility",
								"Follow semantic commit convention from the start",
							],
						},
						{
							id: "0.1.2",
							title: "FastAPI Project Structure",
							deliverables: [
								"Create `{project}/` package directory with `mkdir -p`",
								"Create `{project}/__init__.py` with `__version__ = '0.1.0'`",
								"Create `{project}/main.py` with FastAPI app instance and `/health` endpoint",
								"Implement `create_app() -> FastAPI` factory function",
								"Implement `health_check() -> dict` endpoint returning `{\"status\": \"healthy\"}`",
								"Create `{project}/routers/__init__.py` for API route modules",
								"Create `{project}/schemas/__init__.py` for Pydantic models",
								"Create `pyproject.toml` with fastapi, uvicorn dependencies",
							],
							filesToCreate: [
								"{project}/__init__.py",
								"{project}/main.py",
								"{project}/routers/__init__.py",
								"{project}/models/__init__.py",
								"{project}/schemas/__init__.py",
								"pyproject.toml",
							],
							filesToModify: [],
							successCriteria: [
								"`uvicorn {project}.main:app --reload` starts on port 8000",
								"GET `/health` returns `{\"status\": \"healthy\"}` with 200",
								"Swagger UI loads at `http://localhost:8000/docs`",
								"ReDoc loads at `http://localhost:8000/redoc`",
								"OpenAPI JSON at `http://localhost:8000/openapi.json`",
								"`{project}/main.py` imports FastAPI from fastapi",
								"All `__init__.py` files exist and are importable",
							],
							techDecisions: [
								"FastAPI for API framework (async, auto OpenAPI docs)",
								"Uvicorn as ASGI server (fast, production-ready)",
								"Factory pattern with create_app() for testability",
							],
						},
					],
				},
			],
		},
		{
			id: "1",
			title: "Data Models",
			goal: "Define database models and API schemas",
			days: "2-3 days",
			tasks: [
				{
					id: "1.1",
					title: "Database Setup",
					subtasks: [
						{
							id: "1.1.1",
							title: "SQLAlchemy Models",
							deliverables: [
								"Run `pip install sqlalchemy[asyncio] asyncpg alembic`",
								"Create `{project}/database.py` with `create_engine()` and `SessionLocal`",
								"Implement `get_db()` dependency generator for FastAPI",
								"Create `{project}/models/base.py` with `Base = declarative_base()`",
								"Create `{project}/models/user.py` with User model (id, email, name, created_at)",
								"Run `alembic init alembic` to create migrations directory",
								"Configure `alembic.ini` with database URL from env",
								"Create initial migration: `alembic revision --autogenerate -m 'create users'`",
							],
							filesToCreate: [
								"{project}/database.py",
								"{project}/models/base.py",
								"{project}/models/user.py",
								"alembic.ini",
								"alembic/env.py",
							],
							filesToModify: ["pyproject.toml"],
							successCriteria: [
								"`{project}/database.py` exports `engine`, `SessionLocal`, `get_db`",
								"User model has id (UUID), email (unique), name, created_at columns",
								"`alembic upgrade head` runs without errors",
								"Tables exist in database after migration",
								"`from {project}.models.user import User` works",
								"`get_db()` yields session and closes it properly",
								"alembic.ini reads DATABASE_URL from environment",
							],
							techDecisions: [
								"SQLAlchemy 2.0 style with async support",
								"asyncpg driver for PostgreSQL (fastest async driver)",
								"Alembic for database migrations (SQLAlchemy native)",
								"UUID primary keys (globally unique, no collisions)",
							],
						},
					],
				},
			],
		},
	],
	library: [
		{
			id: "0",
			title: "Foundation",
			goal: "Set up repository, package structure, and development tools",
			days: "1-2 days",
			tasks: [
				{
					id: "0.1",
					title: "Repository Setup",
					subtasks: [
						{
							id: "0.1.1",
							title: "Initialize Git Repository",
							deliverables: [
								"Run `git init` to initialize repository",
								"Create `.gitignore` with Python standard ignores",
								"Create `README.md` with library name, description, installation, usage sections",
								"Create `LICENSE` file with MIT license text",
								"Run `git add .` to stage all files",
								"Run `git commit -m 'chore: initial repository setup'`",
							],
							filesToCreate: [".gitignore", "README.md", "LICENSE"],
							filesToModify: [],
							successCriteria: [
								"`.gitignore` includes `__pycache__/`, `*.pyc`, `.venv/`, `dist/`, `*.egg-info/`",
								"README.md has `# {project}` heading with library name",
								"README.md has `## Installation` section with pip install command",
								"README.md has `## Usage` section with code example placeholder",
								"LICENSE file contains MIT license with current year",
								"First commit exists with semantic message format",
								"`git status` shows clean working tree",
							],
							techDecisions: [
								"Use MIT license for maximum open-source compatibility",
								"Follow semantic commit convention from the start",
							],
						},
						{
							id: "0.1.2",
							title: "Python Package Structure",
							deliverables: [
								"Create `{project}/` package directory with `mkdir -p`",
								"Create `{project}/__init__.py` with `__version__` and `__all__` exports",
								"Create `{project}/py.typed` marker file (empty) for PEP 561",
								"Create `tests/` directory for test modules",
								"Create `tests/__init__.py` as empty file",
								"Create `pyproject.toml` with [project] metadata, classifiers, dependencies",
								"Add PyPI classifiers: Development Status, License, Python version",
							],
							filesToCreate: [
								"{project}/__init__.py",
								"{project}/py.typed",
								"tests/__init__.py",
								"pyproject.toml",
							],
							filesToModify: [],
							successCriteria: [
								"`python -c \"import {project}; print({project}.__version__)\"` prints version",
								"`{project}/__init__.py` defines `__all__` list for public API",
								"`{project}/py.typed` exists (PEP 561 compliance)",
								"`pyproject.toml` has `[project]` with name, version, description, readme",
								"`pyproject.toml` has classifiers array with License, Python version",
								"`pyproject.toml` has `requires-python = \">=3.9\"`",
								"Package is installable: `pip install -e .` succeeds",
							],
							techDecisions: [
								"Use pyproject.toml (PEP 517/518) instead of setup.py",
								"Include py.typed for type hint support in downstream projects",
								"Export public API via __all__ for explicit interface",
							],
						},
					],
				},
			],
		},
		{
			id: "1",
			title: "Core Module",
			goal: "Implement the main library functionality",
			days: "3-5 days",
			tasks: [
				{
					id: "1.1",
					title: "Core API",
					subtasks: [
						{
							id: "1.1.1",
							title: "Primary Interface",
							deliverables: [
								"Create `{project}/core.py` as main module",
								"Implement primary class or function (based on library purpose)",
								"Add Google-style docstrings with Args, Returns, Raises, Examples sections",
								"Add type hints to all function signatures",
								"Update `{project}/__init__.py` to export public API",
								"Create `tests/test_core.py` with pytest test cases",
								"Write tests for success cases, edge cases, and error conditions",
							],
							filesToCreate: ["{project}/core.py", "tests/test_core.py"],
							filesToModify: ["{project}/__init__.py"],
							successCriteria: [
								"`{project}/core.py` contains primary class/function implementation",
								"All public functions have Google-style docstrings",
								"Docstrings include working code examples (doctest compatible)",
								"Type hints on all function signatures (mypy passes)",
								"`from {project} import <main_export>` works",
								"`pytest tests/test_core.py -v` passes all tests",
								"`pytest --cov={project} --cov-report=term-missing` shows >80% coverage",
							],
							techDecisions: [
								"Google-style docstrings (widely supported, readable)",
								"Type hints for all public APIs (IDE support, documentation)",
								"pytest for testing (most popular, fixture support)",
							],
						},
					],
				},
			],
		},
	],
};

/**
 * Find the best matching template for a composite key.
 * Implements fallback chain: exact match → without variant → minimal:language → null
 *
 * @param key - Composite key like "cli:python" or "web_app:typescript:static"
 * @returns PhaseTemplate[] if found, null if no match (triggers minimal scaffold)
 */
export function findTemplate(key: string): PhaseTemplate[] | null {
	// Try exact match first
	if (PROJECT_TYPE_TASKS[key as ProjectType]) {
		return PROJECT_TYPE_TASKS[key as ProjectType];
	}

	// Parse the key
	const parts = key.split(":");
	const projectType = parts[0];
	const language = parts[1];
	const variant = parts[2];

	// If we have a variant, try without it
	if (variant) {
		const withoutVariant = `${projectType}:${language}`;
		if (PROJECT_TYPE_TASKS[withoutVariant as ProjectType]) {
			return PROJECT_TYPE_TASKS[withoutVariant as ProjectType];
		}
	}

	// Try just the project type (for backwards compatibility with existing templates)
	// Map language to existing template keys
	if (projectType === "cli" && language === "python") {
		return PROJECT_TYPE_TASKS.cli;
	}
	if (projectType === "web_app" && (language === "typescript" || language === "javascript")) {
		return PROJECT_TYPE_TASKS.web_app;
	}
	if (projectType === "api" && language === "python") {
		return PROJECT_TYPE_TASKS.api;
	}
	if (projectType === "library" && language === "python") {
		return PROJECT_TYPE_TASKS.library;
	}

	// Try language-only minimal template (future expansion)
	const minimalKey = `minimal:${language}`;
	if (PROJECT_TYPE_TASKS[minimalKey as ProjectType]) {
		return PROJECT_TYPE_TASKS[minimalKey as ProjectType];
	}

	// No match - return null to trigger minimal scaffold generation
	return null;
}

/**
 * Check if a specific template key has a direct match (no fallback).
 */
export function hasExactTemplate(key: string): boolean {
	return PROJECT_TYPE_TASKS[key as ProjectType] !== undefined;
}

// Interview questions for gathering project requirements
export const INTERVIEW_QUESTIONS = [
	{
		id: "project_name",
		text: "What is the name of your project?",
		required: true,
		example: "my-awesome-cli",
	},
	{
		id: "project_type",
		text: "What type of project is this? (cli, web_app, api, library)",
		required: true,
		example: "cli",
	},
	{
		id: "primary_goal",
		text: "In one sentence, what is the main purpose of this project?",
		required: true,
		example: "Convert markdown files to styled PDF documents",
	},
	{
		id: "target_users",
		text: "Who are the target users of this project?",
		required: true,
		example: "Developers, technical writers, content creators",
	},
	{
		id: "timeline",
		text: "What is your expected timeline for this project?",
		required: true,
		example: "2 weeks",
	},
	{
		id: "key_features",
		text: "What are the must-have features for the MVP? (list 3-7 features)",
		required: true,
		example: "1. Parse markdown files\n2. Generate PDF output\n3. Support custom styles",
	},
	{
		id: "tech_stack",
		text: "Are there any specific technologies you must use or cannot use?",
		required: false,
		example: "Must use: Python 3.11+, Click. Cannot use: Java",
	},
	{
		id: "constraints",
		text: "Are there any other constraints or requirements? (performance, security, etc.)",
		required: false,
		example: "Must process files in under 5 seconds",
	},
];
