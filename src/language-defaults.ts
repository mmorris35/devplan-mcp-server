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

	java: {
		fileExtension: "java",
		ignorePatterns: ["target/", "*.class", ".idea/", "*.iml", "build/", ".gradle/", "out/"],
		projectStructure: [
			"Create standard Maven/Gradle directory structure",
			"Create `src/main/java/{package}/` for source files",
			"Create `src/test/java/{package}/` for tests",
			"Create `src/main/resources/` for config files",
			"Initialize build tool (Maven pom.xml or Gradle build.gradle)",
		],
		filesToCreate: ["pom.xml", "src/main/java/{package}/Application.java"],
		successCriteria: [
			"`mvn compile` or `./gradlew build` succeeds without errors",
			"Main class exists with valid `main(String[] args)` method",
			"Build file has project coordinates (groupId, artifactId, version)",
		],
		techDecisions: [
			"Use Maven or Gradle for build automation",
			"Follow standard Java package naming conventions",
			"Use Spring Boot for web applications (if applicable)",
			"Target LTS Java version (17 or 21)",
		],
		lintingSetup: [
			"Add Checkstyle or SpotBugs plugin to build file",
			"Create `checkstyle.xml` with Google or Sun style rules",
			"Run `mvn checkstyle:check` or `./gradlew checkstyleMain`",
		],
		lintingCriteria: ["Checkstyle reports no violations", "Code compiles without warnings (`-Xlint:all`)"],
		testingSetup: [
			"Add JUnit 5 dependency to build file",
			"Create test class in `src/test/java/{package}/`",
			"Run `mvn test` or `./gradlew test` to verify",
		],
		testingCriteria: ["`mvn test` or `./gradlew test` discovers and runs tests", "JUnit reports test results"],
		packageManager: "maven",
		configFile: "pom.xml",
	},

	kotlin: {
		fileExtension: "kt",
		ignorePatterns: ["target/", "*.class", ".idea/", "*.iml", "build/", ".gradle/", "out/"],
		projectStructure: [
			"Create Gradle project with Kotlin DSL",
			"Create `src/main/kotlin/{package}/` for source files",
			"Create `src/test/kotlin/{package}/` for tests",
			"Initialize `build.gradle.kts` with Kotlin plugin",
		],
		filesToCreate: ["build.gradle.kts", "src/main/kotlin/{package}/Main.kt"],
		successCriteria: [
			"`./gradlew build` succeeds without errors",
			"Main file exists with `fun main()` function",
			"Kotlin compiler version matches target JVM version",
		],
		techDecisions: [
			"Use Gradle with Kotlin DSL for build automation",
			"Use Kotlin coroutines for async operations",
			"Target compatible JVM and Kotlin versions",
		],
		lintingSetup: [
			"Add ktlint or detekt plugin to build.gradle.kts",
			"Run `./gradlew ktlintCheck` or `./gradlew detekt`",
		],
		lintingCriteria: ["`./gradlew ktlintCheck` reports no violations"],
		testingSetup: [
			"Add JUnit 5 and kotlin-test dependencies",
			"Create test class in `src/test/kotlin/{package}/`",
			"Run `./gradlew test` to verify",
		],
		testingCriteria: ["`./gradlew test` discovers and runs tests"],
		packageManager: "gradle",
		configFile: "build.gradle.kts",
	},

	rust: {
		fileExtension: "rs",
		ignorePatterns: ["target/", "Cargo.lock", ".env"],
		projectStructure: [
			"Run `cargo init` or `cargo new {project}` to initialize",
			"Create `src/main.rs` for binaries or `src/lib.rs` for libraries",
			"Create `tests/` directory for integration tests",
		],
		filesToCreate: ["Cargo.toml", "src/main.rs"],
		successCriteria: [
			"`cargo build` succeeds without errors",
			"`Cargo.toml` has `[package]` section with name and version",
			"`cargo run` executes the main function",
		],
		techDecisions: [
			"Use Cargo for dependency management and builds",
			"Follow Rust API guidelines for public interfaces",
			"Use `#![deny(warnings)]` in lib.rs for strict compilation",
		],
		lintingSetup: [
			"Run `cargo clippy` for linting (included with rustup)",
			"Run `cargo fmt --check` for formatting verification",
			"Add `[lints.clippy]` section to Cargo.toml for custom rules",
		],
		lintingCriteria: ["`cargo clippy -- -D warnings` exits with code 0", "`cargo fmt --check` reports no changes"],
		testingSetup: [
			"Add `#[cfg(test)]` module to source files for unit tests",
			"Create `tests/integration_test.rs` for integration tests",
			"Run `cargo test` to verify test discovery",
		],
		testingCriteria: ["`cargo test` discovers and runs all tests", "Tests include both unit and integration tests"],
		packageManager: "cargo",
		configFile: "Cargo.toml",
	},

	csharp: {
		fileExtension: "cs",
		ignorePatterns: ["bin/", "obj/", ".vs/", "*.user", "packages/", ".nuget/"],
		projectStructure: [
			"Run `dotnet new console` or appropriate template",
			"Create `src/` directory for source files",
			"Create `.csproj` project file",
		],
		filesToCreate: ["{project}.csproj", "Program.cs"],
		successCriteria: [
			"`dotnet build` succeeds without errors",
			"Project file has valid SDK reference",
			"`dotnet run` executes without exceptions",
		],
		techDecisions: [
			"Use .NET SDK-style project format",
			"Target .NET 6+ for modern features",
			"Use nullable reference types (`<Nullable>enable</Nullable>`)",
		],
		lintingSetup: [
			"Enable code analysis in project file",
			"Run `dotnet format --verify-no-changes`",
		],
		lintingCriteria: ["`dotnet format --verify-no-changes` exits with code 0"],
		testingSetup: [
			"Create test project with `dotnet new xunit`",
			"Add project reference to main project",
			"Run `dotnet test` to verify",
		],
		testingCriteria: ["`dotnet test` discovers and runs tests"],
		packageManager: "nuget",
		configFile: "{project}.csproj",
	},

	ruby: {
		fileExtension: "rb",
		ignorePatterns: [".bundle/", "vendor/", "*.gem", ".env", "coverage/"],
		projectStructure: [
			"Create `Gemfile` with dependencies",
			"Create `lib/` directory for source files",
			"Create `lib/{project}.rb` as main entry point",
			"Run `bundle init` to initialize Bundler",
		],
		filesToCreate: ["Gemfile", "lib/{project}.rb"],
		successCriteria: [
			"`bundle install` succeeds",
			"`ruby lib/{project}.rb` runs without syntax errors",
			"Gemfile has valid Ruby version constraint",
		],
		techDecisions: [
			"Use Bundler for dependency management",
			"Follow Ruby style guide conventions",
			"Use frozen string literals for performance",
		],
		lintingSetup: [
			"Add `rubocop` gem to Gemfile",
			"Create `.rubocop.yml` with configuration",
			"Run `bundle exec rubocop`",
		],
		lintingCriteria: ["`bundle exec rubocop` exits with code 0"],
		testingSetup: [
			"Add `rspec` gem to Gemfile",
			"Run `bundle exec rspec --init`",
			"Create `spec/{project}_spec.rb`",
		],
		testingCriteria: ["`bundle exec rspec` discovers and runs tests"],
		packageManager: "bundler",
		configFile: "Gemfile",
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

/**
 * Language-specific file path patterns for Phase 1 scaffolding.
 * Returns paths appropriate for the language's conventions.
 */
export interface LanguageFilePaths {
	mainEntry: string;
	testEntry: string;
	modelsFile: string;
	routesFile: string;
	handlersDir: string;
	testModels: string;
	testApi: string;
}

/**
 * Get language-appropriate file paths for Phase 1 subtasks.
 * Uses the project name to generate proper paths following language conventions.
 */
export function getLanguageFilePaths(language: string, projectUnderscore: string, projectKebab: string): LanguageFilePaths {
	const lang = language.toLowerCase();

	if (lang === "java" || lang === "kotlin") {
		const ext = lang === "kotlin" ? "kt" : "java";
		const srcDir = lang === "kotlin" ? "src/main/kotlin" : "src/main/java";
		const testDir = lang === "kotlin" ? "src/test/kotlin" : "src/test/java";
		const pkg = `com/example/${projectUnderscore}`;
		return {
			mainEntry: `${srcDir}/${pkg}/Application.${ext}`,
			testEntry: `${testDir}/${pkg}/ApplicationTest.${ext}`,
			modelsFile: `${srcDir}/${pkg}/model/`,
			routesFile: `${srcDir}/${pkg}/controller/`,
			handlersDir: `${srcDir}/${pkg}/service/`,
			testModels: `${testDir}/${pkg}/model/`,
			testApi: `${testDir}/${pkg}/controller/`,
		};
	}

	if (lang === "go" || lang === "golang") {
		return {
			mainEntry: `cmd/${projectKebab}/main.go`,
			testEntry: `cmd/${projectKebab}/main_test.go`,
			modelsFile: `internal/models/models.go`,
			routesFile: `internal/routes/routes.go`,
			handlersDir: `internal/handlers/`,
			testModels: `internal/models/models_test.go`,
			testApi: `internal/routes/routes_test.go`,
		};
	}

	if (lang === "rust") {
		return {
			mainEntry: `src/main.rs`,
			testEntry: `tests/integration_test.rs`,
			modelsFile: `src/models.rs`,
			routesFile: `src/routes.rs`,
			handlersDir: `src/handlers/`,
			testModels: `tests/test_models.rs`,
			testApi: `tests/test_api.rs`,
		};
	}

	if (lang === "typescript" || lang === "javascript") {
		const ext = lang === "typescript" ? "ts" : "js";
		return {
			mainEntry: `src/index.${ext}`,
			testEntry: `src/__tests__/index.test.${ext}`,
			modelsFile: `src/models.${ext}`,
			routesFile: `src/routes.${ext}`,
			handlersDir: `src/handlers/`,
			testModels: `src/__tests__/models.test.${ext}`,
			testApi: `src/__tests__/api.test.${ext}`,
		};
	}

	if (lang === "csharp" || lang === "c#") {
		return {
			mainEntry: `src/${projectUnderscore}/Program.cs`,
			testEntry: `tests/${projectUnderscore}.Tests/ProgramTest.cs`,
			modelsFile: `src/${projectUnderscore}/Models/`,
			routesFile: `src/${projectUnderscore}/Controllers/`,
			handlersDir: `src/${projectUnderscore}/Services/`,
			testModels: `tests/${projectUnderscore}.Tests/Models/`,
			testApi: `tests/${projectUnderscore}.Tests/Controllers/`,
		};
	}

	if (lang === "ruby") {
		return {
			mainEntry: `lib/${projectUnderscore}.rb`,
			testEntry: `spec/${projectUnderscore}_spec.rb`,
			modelsFile: `lib/${projectUnderscore}/models.rb`,
			routesFile: `lib/${projectUnderscore}/routes.rb`,
			handlersDir: `lib/${projectUnderscore}/handlers/`,
			testModels: `spec/models_spec.rb`,
			testApi: `spec/routes_spec.rb`,
		};
	}

	// Python and fallback
	return {
		mainEntry: `${projectUnderscore}/main.py`,
		testEntry: `tests/test_main.py`,
		modelsFile: `${projectUnderscore}/models.py`,
		routesFile: `${projectUnderscore}/routes.py`,
		handlersDir: `${projectUnderscore}/handlers/`,
		testModels: `tests/test_models.py`,
		testApi: `tests/test_api.py`,
	};
}
