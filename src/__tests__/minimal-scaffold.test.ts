import { describe, it, expect } from "vitest";
import { generateMinimalScaffold, MinimalScaffoldConfig } from "../generators";
import { TechStack } from "../models";

describe("minimal-scaffold", () => {
	const baseTechStack: TechStack = {
		language: "Python",
		framework: "",
		database: "",
		testing: "pytest",
		linting: "ruff",
		typeChecking: "mypy",
		deployment: "",
		ciCd: "GitHub Actions",
		additionalTools: [],
	};

	describe("generateMinimalScaffold", () => {
		it("should generate scaffold for Python CLI", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "my-tool",
				projectType: "cli",
				language: "python",
				techStack: baseTechStack,
				features: ["Parse JSON files", "Output formatted results"],
			};

			const scaffold = generateMinimalScaffold(config);

			// Check Phase 0 content
			expect(scaffold).toContain("## Phase 0: Foundation");
			expect(scaffold).toContain("python cli");
			expect(scaffold).toContain("__pycache__");
			expect(scaffold).toContain("pyproject.toml");

			// Check Phase 1 content
			expect(scaffold).toContain("## Phase 1: Core Implementation");
			expect(scaffold).toContain("Parse JSON files");

			// Check placeholder replacement
			expect(scaffold).toContain("my_tool");
			expect(scaffold).not.toContain("{project}");
		});

		it("should generate scaffold for TypeScript API", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "my-api",
				projectType: "api",
				language: "typescript",
				techStack: {
					...baseTechStack,
					language: "TypeScript",
					testing: "vitest",
					linting: "eslint",
				},
				features: ["User authentication", "CRUD endpoints"],
			};

			const scaffold = generateMinimalScaffold(config);

			// Check TypeScript-specific content
			expect(scaffold).toContain("typescript api");
			expect(scaffold).toContain("node_modules");
			expect(scaffold).toContain("tsconfig.json");
			expect(scaffold).toContain(".ts");

			// Check features listed
			expect(scaffold).toContain("User authentication");
		});

		it("should generate scaffold for Go library", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "go-utils",
				projectType: "library",
				language: "go",
				techStack: {
					...baseTechStack,
					language: "Go",
					testing: "go test",
					linting: "golangci-lint",
				},
				features: ["String utilities", "File helpers"],
			};

			const scaffold = generateMinimalScaffold(config);

			// Check Go-specific content
			expect(scaffold).toContain("go library");
			expect(scaffold).toContain("go.mod");
			expect(scaffold).toContain(".go");
		});

		it("should generate scaffold for unknown language", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "my-project",
				projectType: "cli",
				language: "cobol",
				techStack: baseTechStack,
				features: ["Feature 1"],
			};

			const scaffold = generateMinimalScaffold(config);

			// Should use unknown defaults
			expect(scaffold).toContain("## Phase 0: Foundation");
			expect(scaffold).toContain("## Phase 1: Core Implementation");
			// Unknown language note
			expect(scaffold).toContain("No specific template matched");
		});

		it("should handle projects with no features", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "empty-project",
				projectType: "library",
				language: "python",
				techStack: baseTechStack,
				features: [],
			};

			const scaffold = generateMinimalScaffold(config);

			// Should still generate valid scaffold
			expect(scaffold).toContain("## Phase 0: Foundation");
			expect(scaffold).toContain("## Phase 1: Core Implementation");
		});

		it("should handle project names with special characters", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "My-Cool_Project.2024",
				projectType: "cli",
				language: "python",
				techStack: baseTechStack,
				features: ["Feature 1"],
			};

			const scaffold = generateMinimalScaffold(config);

			// Should normalize to underscore version
			expect(scaffold).toContain("my_cool_project_2024");
			expect(scaffold).not.toContain("My-Cool_Project.2024/__init__");
		});

		it("should include technology stack in Phase 1", () => {
			const config: MinimalScaffoldConfig = {
				projectName: "test-project",
				projectType: "api",
				language: "python",
				techStack: {
					...baseTechStack,
					framework: "FastAPI",
					database: "PostgreSQL",
				},
				features: ["User API"],
			};

			const scaffold = generateMinimalScaffold(config);

			expect(scaffold).toContain("**Framework**: FastAPI");
			expect(scaffold).toContain("**Database**: PostgreSQL");
		});
	});
});
