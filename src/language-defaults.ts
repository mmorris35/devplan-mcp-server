/**
 * Language-specific defaults for project scaffolding.
 * Used when no specific template matches the requested project type + language combination.
 */

export interface LanguageDefaults {
	fileExtension: string;
	ignorePatterns: string[];
	projectStructure: string[];
	filesToCreate: string[];
	successCriteria: string[];
	techDecisions: string[];
	lintingSetup: string[];
	lintingCriteria: string[];
	testingSetup: string[];
	testingCriteria: string[];
	packageManager: string;
	configFile: string;
}

export const LANGUAGE_DEFAULTS: Record<string, LanguageDefaults> = {
	python: {
		fileExtension: "py",
		ignorePatterns: ["__pycache__/", "*.pyc", ".venv/", "dist/", "build/", ".env", "*.egg-info/"],
		projectStructure: [
			"Create `{project}/` package directory with `mkdir -p`",
			"Create `{project}/__init__.py` with `__version__ = '0.1.0'`",
			"Create `tests/` directory with `mkdir -p`",
			"Create `tests/__init__.py` as empty file",
			"Create `pyproject.toml` with project metadata",
		],
		filesToCreate: ["{project}/__init__.py", "tests/__init__.py", "pyproject.toml"],
		successCriteria: [
			"`python -c \"import {project}\"` succeeds without ImportError",
			"`pyproject.toml` has `[project]` section with name and version",
			"`ls {project}/` shows `__init__.py`",
		],
		techDecisions: [
			"Use pyproject.toml (PEP 517/518) for modern Python packaging",
			"Use flat layout for simple projects, src layout for complex ones",
			"Include py.typed marker for type hint support",
		],
		lintingSetup: [
			"Add `ruff` to dev dependencies in pyproject.toml",
			"Add `[tool.ruff]` section with line-length = 100",
			"Add `[tool.ruff.lint]` section with select = ['E', 'F', 'I', 'W']",
			"Run `ruff check .` to verify configuration",
		],
		lintingCriteria: ["`ruff check .` exits with code 0", "`ruff format --check .` exits with code 0"],
		testingSetup: [
			"Add `pytest` and `pytest-cov` to dev dependencies",
			"Create `tests/test_placeholder.py` with sample test",
			"Add `[tool.pytest.ini_options]` section to pyproject.toml",
			"Run `pytest` to verify test discovery",
		],
		testingCriteria: ["`pytest` discovers tests in `tests/` directory", "`pytest --cov` reports coverage"],
		packageManager: "pip",
		configFile: "pyproject.toml",
	},

	typescript: {
		fileExtension: "ts",
		ignorePatterns: ["node_modules/", "dist/", ".env", "*.js.map", "coverage/"],
		projectStructure: [
			"Run `npm init -y` to create package.json",
			"Create `src/` directory for source files",
			"Create `src/index.ts` as entry point",
			"Create `tsconfig.json` with strict mode enabled",
		],
		filesToCreate: ["src/index.ts", "tsconfig.json", "package.json"],
		successCriteria: [
			"`npx tsc --noEmit` succeeds without errors",
			"`package.json` has name and version fields",
			"`tsconfig.json` has `strict: true` in compilerOptions",
		],
		techDecisions: [
			"Use TypeScript strict mode for maximum type safety",
			"Use ES modules (`type: module` in package.json)",
			"Target ES2020+ for modern JavaScript features",
		],
		lintingSetup: [
			"Run `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`",
			"Create `eslint.config.js` with TypeScript configuration",
			"Add `lint` script to package.json: `eslint src/`",
		],
		lintingCriteria: ["`npm run lint` exits with code 0", "ESLint recognizes TypeScript files"],
		testingSetup: [
			"Run `npm install -D vitest` for testing",
			"Create `src/__tests__/placeholder.test.ts` with sample test",
			"Add `test` script to package.json: `vitest run`",
			"Add `test:watch` script: `vitest`",
		],
		testingCriteria: ["`npm test` discovers and runs tests", "Vitest reports test results"],
		packageManager: "npm",
		configFile: "package.json",
	},

	javascript: {
		fileExtension: "js",
		ignorePatterns: ["node_modules/", "dist/", ".env", "coverage/"],
		projectStructure: [
			"Run `npm init -y` to create package.json",
			"Create `src/` directory for source files",
			"Create `src/index.js` as entry point",
		],
		filesToCreate: ["src/index.js", "package.json"],
		successCriteria: [
			"`node src/index.js` runs without syntax errors",
			"`package.json` has name and version fields",
		],
		techDecisions: [
			"Use ES modules (`type: module` in package.json)",
			"Use JSDoc comments for type hints if needed",
		],
		lintingSetup: [
			"Run `npm install -D eslint`",
			"Create `eslint.config.js` with recommended rules",
			"Add `lint` script to package.json",
		],
		lintingCriteria: ["`npm run lint` exits with code 0"],
		testingSetup: [
			"Run `npm install -D vitest` for testing",
			"Create `src/__tests__/placeholder.test.js` with sample test",
			"Add `test` script to package.json",
		],
		testingCriteria: ["`npm test` discovers and runs tests"],
		packageManager: "npm",
		configFile: "package.json",
	},

	go: {
		fileExtension: "go",
		ignorePatterns: ["bin/", "*.exe", ".env", "vendor/"],
		projectStructure: [
			"Run `go mod init {project}` to initialize module",
			"Create `main.go` as entry point (for executables)",
			"Create `internal/` directory for private packages",
			"Create `cmd/` directory for multiple executables (if needed)",
		],
		filesToCreate: ["main.go", "go.mod"],
		successCriteria: [
			"`go build` succeeds without errors",
			"`go.mod` contains module declaration",
			"`go run main.go` executes without panic",
		],
		techDecisions: [
			"Use Go modules for dependency management",
			"Follow standard Go project layout (cmd/, internal/, pkg/)",
			"Use `internal/` for packages that shouldn't be imported externally",
		],
		lintingSetup: [
			"Install golangci-lint: `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest`",
			"Create `.golangci.yml` with linter configuration",
			"Run `golangci-lint run` to verify",
		],
		lintingCriteria: ["`golangci-lint run` exits with code 0", "`go fmt ./...` reports no changes needed"],
		testingSetup: [
			"Create `main_test.go` with sample test",
			"Run `go test ./...` to verify test discovery",
			"Add `-race` flag for race condition detection",
		],
		testingCriteria: ["`go test ./...` discovers and runs tests", "`go test -cover ./...` reports coverage"],
		packageManager: "go mod",
		configFile: "go.mod",
	},

	static: {
		fileExtension: "html",
		ignorePatterns: [".env", "node_modules/", ".DS_Store", "dist/"],
		projectStructure: [
			"Create `index.html` with HTML5 boilerplate",
			"Create `css/` directory for stylesheets",
			"Create `css/style.css` with base styles",
			"Create `js/` directory for scripts (if needed)",
			"Create `assets/` directory for images and fonts",
		],
		filesToCreate: ["index.html", "css/style.css"],
		successCriteria: [
			"`index.html` has valid HTML5 doctype (`<!DOCTYPE html>`)",
			"CSS file is linked in index.html `<head>`",
			"Page opens in browser without console errors",
		],
		techDecisions: [
			"Use semantic HTML5 elements (header, main, footer, nav, article)",
			"Use CSS custom properties (variables) for theming",
			"Avoid build tools unless project complexity requires them",
			"Use modern CSS features (Grid, Flexbox) over legacy approaches",
		],
		lintingSetup: [
			"Optional: Install HTMLHint for HTML validation",
			"Optional: Install Stylelint for CSS validation",
			"Validate HTML at https://validator.w3.org/",
		],
		lintingCriteria: ["HTML validates without errors", "CSS has no syntax errors"],
		testingSetup: [
			"Manual browser testing across Chrome, Firefox, Safari",
			"Optional: Install Playwright for E2E testing",
			"Test responsive design at mobile, tablet, desktop breakpoints",
		],
		testingCriteria: ["Page renders correctly in target browsers", "No console errors on page load"],
		packageManager: "none",
		configFile: "none",
	},

	unknown: {
		fileExtension: "txt",
		ignorePatterns: [".env", ".DS_Store", "*.log"],
		projectStructure: [
			"Create project directory structure based on language conventions",
			"Create main entry point file appropriate for the language",
			"Create configuration file if the language requires one",
		],
		filesToCreate: ["README.md"],
		successCriteria: [
			"Project structure follows language conventions",
			"Entry point file exists and is syntactically valid",
		],
		techDecisions: [
			"Follow official language documentation for project structure",
			"Use most common/standard tooling for the language",
		],
		lintingSetup: ["Install linter appropriate for the language", "Configure linter with standard rules"],
		lintingCriteria: ["Linter runs without configuration errors"],
		testingSetup: ["Install testing framework appropriate for the language", "Create placeholder test file"],
		testingCriteria: ["Test framework discovers and can run tests"],
		packageManager: "unknown",
		configFile: "unknown",
	},
};

/**
 * Get language-specific defaults for scaffolding.
 * Falls back to 'unknown' defaults if language not recognized.
 */
export function getLanguageDefaults(language: string): LanguageDefaults {
	const normalized = language.toLowerCase();

	// Check for static site indicators
	if (normalized === "html" || normalized === "css" || normalized === "static") {
		return LANGUAGE_DEFAULTS.static || LANGUAGE_DEFAULTS.unknown;
	}

	return LANGUAGE_DEFAULTS[normalized] || LANGUAGE_DEFAULTS.unknown;
}
