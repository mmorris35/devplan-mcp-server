import { describe, it, expect } from "vitest";
import { findTemplate, hasExactTemplate, PROJECT_TYPE_TASKS } from "../templates";

describe("template-lookup", () => {
	describe("findTemplate", () => {
		// Backwards compatibility with existing templates
		it("should find cli template for 'cli' key", () => {
			const template = findTemplate("cli");
			expect(template).toBe(PROJECT_TYPE_TASKS.cli);
		});

		it("should find web_app template for 'web_app' key", () => {
			const template = findTemplate("web_app");
			expect(template).toBe(PROJECT_TYPE_TASKS.web_app);
		});

		it("should find api template for 'api' key", () => {
			const template = findTemplate("api");
			expect(template).toBe(PROJECT_TYPE_TASKS.api);
		});

		it("should find library template for 'library' key", () => {
			const template = findTemplate("library");
			expect(template).toBe(PROJECT_TYPE_TASKS.library);
		});

		// Composite key fallbacks
		it("should find cli template for 'cli:python' via fallback", () => {
			const template = findTemplate("cli:python");
			expect(template).toBe(PROJECT_TYPE_TASKS.cli);
		});

		it("should find web_app template for 'web_app:typescript' via fallback", () => {
			const template = findTemplate("web_app:typescript");
			expect(template).toBe(PROJECT_TYPE_TASKS.web_app);
		});

		it("should find api template for 'api:python' via fallback", () => {
			const template = findTemplate("api:python");
			expect(template).toBe(PROJECT_TYPE_TASKS.api);
		});

		// No match cases - should return null
		it("should return null for 'cli:typescript' (no TypeScript CLI template)", () => {
			const template = findTemplate("cli:typescript");
			expect(template).toBeNull();
		});

		it("should return null for 'cli:go' (no Go CLI template)", () => {
			const template = findTemplate("cli:go");
			expect(template).toBeNull();
		});

		it("should return null for 'api:rust' (no Rust API template)", () => {
			const template = findTemplate("api:rust");
			expect(template).toBeNull();
		});

		it("should return null for unknown project types", () => {
			const template = findTemplate("mobile:swift");
			expect(template).toBeNull();
		});

		// Variant handling
		it("should strip variant and try base key", () => {
			// web_app:typescript:static should fall back to web_app:typescript → web_app
			const template = findTemplate("web_app:typescript:static");
			// Currently returns web_app template via fallback
			expect(template).toBe(PROJECT_TYPE_TASKS.web_app);
		});
	});

	describe("hasExactTemplate", () => {
		it("should return true for existing template keys", () => {
			expect(hasExactTemplate("cli")).toBe(true);
			expect(hasExactTemplate("web_app")).toBe(true);
			expect(hasExactTemplate("api")).toBe(true);
			expect(hasExactTemplate("library")).toBe(true);
		});

		it("should return false for composite keys (not exact)", () => {
			expect(hasExactTemplate("cli:python")).toBe(false);
			expect(hasExactTemplate("web_app:typescript")).toBe(false);
		});

		it("should return false for non-existent keys", () => {
			expect(hasExactTemplate("mobile")).toBe(false);
			expect(hasExactTemplate("cli:rust")).toBe(false);
		});
	});
});
