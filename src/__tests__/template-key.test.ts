import { describe, it, expect } from "vitest";
import { resolveTemplateKey, detectVariant, templateKeyToString, TemplateKey } from "../generators";
import type { ProjectBrief } from "../models";

// Helper to create minimal brief for testing
function createBrief(overrides: Partial<ProjectBrief>): ProjectBrief {
	return {
		projectName: "test-project",
		projectType: "cli",
		primaryGoal: "Test project",
		targetUsers: "Developers",
		timeline: "1 week",
		keyFeatures: [],
		mustUseTech: [],
		cannotUseTech: [],
		niceToHaveFeatures: [],
		...overrides,
	};
}

describe("template-key", () => {
	describe("resolveTemplateKey", () => {
		it("should detect Python CLI", () => {
			const brief = createBrief({
				projectType: "cli",
				mustUseTech: ["Python", "Click"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.projectType).toBe("cli");
			expect(key.language).toBe("python");
		});

		it("should detect TypeScript CLI", () => {
			const brief = createBrief({
				projectType: "cli",
				mustUseTech: ["TypeScript", "Commander"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.projectType).toBe("cli");
			expect(key.language).toBe("typescript");
		});

		it("should detect Go API", () => {
			const brief = createBrief({
				projectType: "api",
				mustUseTech: ["Go", "Chi", "PostgreSQL"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.projectType).toBe("api");
			expect(key.language).toBe("go");
		});

		it("should detect Python web_app", () => {
			const brief = createBrief({
				projectType: "web_app",
				mustUseTech: ["Python", "FastAPI", "React"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.projectType).toBe("web_app");
			expect(key.language).toBe("python");
		});

		it("should default to unknown for unrecognized languages", () => {
			const brief = createBrief({
				projectType: "library",
				mustUseTech: ["Haskell", "Cabal"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.language).toBe("unknown");
		});

		it("should normalize project type with spaces/dashes", () => {
			const brief = createBrief({
				projectType: "web-app",
				mustUseTech: ["TypeScript"],
			});
			const key = resolveTemplateKey(brief);
			expect(key.projectType).toBe("web_app");
		});
	});

	describe("detectVariant", () => {
		it("should detect static variant for HTML/CSS projects", () => {
			const brief = createBrief({
				projectType: "web_app",
				mustUseTech: ["HTML", "CSS", "JavaScript"],
				keyFeatures: ["Static landing page"],
			});
			const variant = detectVariant(brief);
			expect(variant).toBe("static");
		});

		it("should not detect static when backend present", () => {
			const brief = createBrief({
				projectType: "web_app",
				mustUseTech: ["HTML", "CSS", "Express", "PostgreSQL"],
			});
			const variant = detectVariant(brief);
			expect(variant).not.toBe("static");
		});

		it("should detect serverless variant", () => {
			const brief = createBrief({
				projectType: "api",
				mustUseTech: ["TypeScript", "AWS Lambda"],
			});
			const variant = detectVariant(brief);
			expect(variant).toBe("serverless");
		});

		it("should detect minimal variant when no framework", () => {
			const brief = createBrief({
				projectType: "cli",
				mustUseTech: ["Python"],
			});
			const variant = detectVariant(brief);
			expect(variant).toBe("minimal");
		});

		it("should return undefined for standard projects with frameworks", () => {
			const brief = createBrief({
				projectType: "cli",
				mustUseTech: ["Python", "Click"],
			});
			const variant = detectVariant(brief);
			expect(variant).toBeUndefined();
		});
	});

	describe("templateKeyToString", () => {
		it("should format key without variant", () => {
			const key: TemplateKey = { projectType: "cli", language: "python" };
			expect(templateKeyToString(key)).toBe("cli:python");
		});

		it("should format key with variant", () => {
			const key: TemplateKey = { projectType: "web_app", language: "typescript", variant: "static" };
			expect(templateKeyToString(key)).toBe("web_app:typescript:static");
		});
	});
});
