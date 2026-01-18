import { describe, it, expect } from "vitest";
import { getLanguageDefaults, LANGUAGE_DEFAULTS } from "../language-defaults";

describe("language-defaults", () => {
	describe("LANGUAGE_DEFAULTS", () => {
		it("should have python defaults", () => {
			expect(LANGUAGE_DEFAULTS.python).toBeDefined();
			expect(LANGUAGE_DEFAULTS.python.fileExtension).toBe("py");
			expect(LANGUAGE_DEFAULTS.python.packageManager).toBe("pip");
		});

		it("should have typescript defaults", () => {
			expect(LANGUAGE_DEFAULTS.typescript).toBeDefined();
			expect(LANGUAGE_DEFAULTS.typescript.fileExtension).toBe("ts");
			expect(LANGUAGE_DEFAULTS.typescript.packageManager).toBe("npm");
		});

		it("should have javascript defaults", () => {
			expect(LANGUAGE_DEFAULTS.javascript).toBeDefined();
			expect(LANGUAGE_DEFAULTS.javascript.fileExtension).toBe("js");
		});

		it("should have go defaults", () => {
			expect(LANGUAGE_DEFAULTS.go).toBeDefined();
			expect(LANGUAGE_DEFAULTS.go.fileExtension).toBe("go");
			expect(LANGUAGE_DEFAULTS.go.packageManager).toBe("go mod");
		});

		it("should have static site defaults", () => {
			expect(LANGUAGE_DEFAULTS.static).toBeDefined();
			expect(LANGUAGE_DEFAULTS.static.fileExtension).toBe("html");
			expect(LANGUAGE_DEFAULTS.static.packageManager).toBe("none");
		});

		it("should have unknown fallback", () => {
			expect(LANGUAGE_DEFAULTS.unknown).toBeDefined();
		});
	});

	describe("getLanguageDefaults", () => {
		it("should return python defaults for 'python'", () => {
			const defaults = getLanguageDefaults("python");
			expect(defaults.fileExtension).toBe("py");
		});

		it("should be case insensitive", () => {
			expect(getLanguageDefaults("Python").fileExtension).toBe("py");
			expect(getLanguageDefaults("TYPESCRIPT").fileExtension).toBe("ts");
		});

		it("should return static defaults for html/css", () => {
			expect(getLanguageDefaults("html").fileExtension).toBe("html");
			expect(getLanguageDefaults("css").fileExtension).toBe("html");
			expect(getLanguageDefaults("static").fileExtension).toBe("html");
		});

		it("should return unknown for unrecognized languages", () => {
			const defaults = getLanguageDefaults("cobol");
			expect(defaults).toBe(LANGUAGE_DEFAULTS.unknown);
		});
	});
});
