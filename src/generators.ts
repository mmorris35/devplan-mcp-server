/**
 * Generators for DevPlan MCP Server.
 * Creates PROJECT_BRIEF.md, DEVELOPMENT_PLAN.md, and claude.md content.
 *
 * Key principle: Generate detailed scaffolding that Claude Code can follow
 * like "paint-by-numbers" - every subtask has explicit deliverables, files,
 * and success criteria so there's nothing left to imagination.
 */

import type { DevelopmentPlan, Phase, ProjectBrief, TechStack } from "./models";
import { getTemplate, PROJECT_TYPE_TASKS, type PhaseTemplate } from "./templates";

export interface BriefInput {
	name: string;
	projectType: string;
	goal: string;
	targetUsers: string[];
	features: string[];
	techStack?: {
		mustUse?: string[];
		cannotUse?: string[];
	};
	timeline?: string;
	teamSize?: number;
	constraints?: string[];
	niceToHave?: string[];
}

/**
 * Conflict matrix for detecting incompatible technology choices.
 * Each entry is [tech1, tech2, reason] where tech1 and tech2 conflict.
 */
const TECH_CONFLICTS: Array<[string[], string[], string]> = [
	// Frontend framework conflicts
	[["react", "reactjs", "react.js"], ["vue", "vuejs", "vue.js"], "competing frontend frameworks"],
	[["react", "reactjs", "react.js"], ["angular", "angularjs"], "competing frontend frameworks"],
	[["vue", "vuejs", "vue.js"], ["angular", "angularjs"], "competing frontend frameworks"],
	[["react", "reactjs", "react.js"], ["svelte", "sveltekit"], "competing frontend frameworks"],
	[["vue", "vuejs", "vue.js"], ["svelte", "sveltekit"], "competing frontend frameworks"],

	// Backend framework conflicts (same language)
	[["express", "expressjs"], ["fastify"], "competing Node.js frameworks"],
	[["django"], ["flask"], "competing Python web frameworks"],
	[["django"], ["fastapi"], "competing Python web frameworks"],
	[["flask"], ["fastapi"], "competing Python web frameworks"],
	[["spring", "spring boot"], ["quarkus"], "competing Java frameworks"],

	// Testing framework conflicts (same ecosystem)
	[["pytest"], ["jest", "mocha", "vitest"], "pytest is Python-specific, others are JavaScript"],
	[["jest"], ["mocha"], "competing JavaScript test frameworks"],
	[["jest"], ["vitest"], "competing JavaScript test frameworks"],
	[["unittest"], ["jest", "mocha", "vitest"], "unittest is Python-specific, others are JavaScript"],

	// ORM conflicts (same language)
	[["sqlalchemy"], ["django orm"], "competing Python ORMs"],
	[["prisma"], ["typeorm"], "competing Node.js ORMs"],
	[["prisma"], ["sequelize"], "competing Node.js ORMs"],
	[["typeorm"], ["sequelize"], "competing Node.js ORMs"],

	// Package manager conflicts
	[["npm"], ["yarn"], "competing Node.js package managers - choose one"],
	[["npm"], ["pnpm"], "competing Node.js package managers - choose one"],
	[["yarn"], ["pnpm"], "competing Node.js package managers - choose one"],

	// Language ecosystem mismatches
	[["python", "pip", "pytest", "ruff", "mypy"], ["npm", "node", "typescript", "eslint"], "mixing Python and Node.js ecosystems"],

	// CSS framework conflicts
	[["tailwind", "tailwindcss"], ["bootstrap"], "competing CSS frameworks"],
	[["tailwind", "tailwindcss"], ["material-ui", "mui"], "Tailwind typically replaces component library styling"],

	// State management conflicts
	[["redux"], ["mobx"], "competing React state management libraries"],
	[["redux"], ["zustand"], "competing React state management libraries"],
	[["vuex"], ["pinia"], "Pinia is the recommended replacement for Vuex"],
];

/**
 * Detect conflicts between technologies in a list.
 * Returns warnings for any incompatible combinations found.
 */
export function detectTechConflicts(technologies: string[]): string[] {
	const warnings: string[] = [];
	const techLower = technologies.map(t => t.toLowerCase().trim());

	for (const [group1, group2, reason] of TECH_CONFLICTS) {
		const hasGroup1 = group1.some(tech =>
			techLower.some(t => t.includes(tech) || tech.includes(t))
		);
		const hasGroup2 = group2.some(tech =>
			techLower.some(t => t.includes(tech) || tech.includes(t))
		);

		if (hasGroup1 && hasGroup2) {
			const found1 = techLower.find(t => group1.some(g => t.includes(g) || g.includes(t))) || group1[0];
			const found2 = techLower.find(t => group2.some(g => t.includes(g) || g.includes(t))) || group2[0];
			warnings.push(`Tech conflict: '${found1}' and '${found2}' are ${reason}`);
		}
	}

	return warnings;
}

/**
 * Extract technology names from a development plan's Technology Stack section.
 */
export function extractTechFromPlan(content: string): string[] {
	const technologies: string[] = [];

	// Find Technology Stack section
	const techStackMatch = content.match(/##\s*Technology Stack\s*\n([\s\S]*?)(?=\n##\s|$)/i);
	if (!techStackMatch) return technologies;

	const techSection = techStackMatch[1];

	// Extract tech from bullet points like "- **Language**: Python 3.11+"
	const bulletMatches = techSection.matchAll(/[-*]\s*\*?\*?([^*:]+)\*?\*?:\s*(.+)/g);
	for (const match of bulletMatches) {
		const value = match[2].trim();
		// Split on common separators and add each technology
		const techs = value.split(/[,\/+]/).map(t => t.trim()).filter(t => t.length > 0);
		technologies.push(...techs);
	}

	return technologies;
}

export function createBrief(input: BriefInput): string {
	const mustUse = input.techStack?.mustUse?.map((t) => `- ${t}`).join("\n") || "- (none specified)";
	const cannotUse = input.techStack?.cannotUse?.map((t) => `- ${t}`).join("\n") || "- (none specified)";
	const features = input.features.map((f) => `- ${f}`).join("\n");
	const constraints = input.constraints?.map((c) => `- ${c}`).join("\n") || "- (none specified)";
	const niceToHave = input.niceToHave?.length
		? input.niceToHave.map((f) => `- ${f}`).join("\n")
		: "- (to be determined after MVP)";

	return `# PROJECT_BRIEF.md

## Basic Information

- **Project Name**: ${input.name}
- **Project Type**: ${input.projectType}
- **Primary Goal**: ${input.goal}
- **Target Users**: ${input.targetUsers.join(", ")}
- **Timeline**: ${input.timeline || "Not specified"}
- **Team Size**: ${input.teamSize || 1}

## Functional Requirements

### Key Features (MVP)

${features}

### Nice-to-Have Features (v2)

${niceToHave}

## Technical Constraints

### Must Use

${mustUse}

### Cannot Use

${cannotUse}

## Other Constraints

${constraints}

## Success Criteria

- All MVP features implemented and working
- Code passes linting and type checking
- Test coverage >= 80%
- Documentation complete

---

*Generated by DevPlan MCP Server*
`;
}

export function parseBrief(content: string): ProjectBrief {
	const lines = content.split("\n");

	const extractField = (fieldName: string): string => {
		for (const line of lines) {
			if (line.includes(`**${fieldName}**:`)) {
				const value = line.split(":").slice(1).join(":").trim();
				return value.replace(/\*\*/g, "");
			}
		}
		return "";
	};

	const extractList = (sectionName: string): string[] => {
		const items: string[] = [];
		let inSection = false;

		for (const line of lines) {
			if (line.includes(sectionName)) {
				inSection = true;
				continue;
			}
			if (inSection) {
				if (line.startsWith("##") || line.startsWith("---")) {
					break;
				}
				if (line.startsWith("- ") && !line.includes("(none") && !line.includes("(to be")) {
					items.push(line.substring(2).trim());
				}
			}
		}
		return items;
	};

	return {
		projectName: extractField("Project Name"),
		projectType: extractField("Project Type"),
		primaryGoal: extractField("Primary Goal"),
		targetUsers: extractField("Target Users"),
		timeline: extractField("Timeline"),
		teamSize: extractField("Team Size") || "1",
		keyFeatures: extractList("Key Features"),
		niceToHaveFeatures: extractList("Nice-to-Have"),
		mustUseTech: extractList("Must Use"),
		cannotUseTech: extractList("Cannot Use"),
		successCriteria: extractList("Success Criteria"),
		performanceRequirements: {},
		securityRequirements: {},
		scalabilityRequirements: {},
		availabilityRequirements: {},
		existingKnowledge: [],
		infrastructureAccess: [],
		externalSystems: [],
		dataSources: [],
		dataDestinations: [],
		knownChallenges: [],
		referenceMaterials: [],
		questionsAndClarifications: [],
		useCases: [],
		deliverables: [],
	};
}

export function generateTechStack(brief: ProjectBrief): TechStack {
	const template = getTemplate(brief.projectType);
	const defaults = template.defaultTechStack;

	const cannotUse = brief.cannotUseTech.map((t) => t.toLowerCase());

	const isBlocked = (tech: string | undefined): boolean => {
		if (!tech) return false;
		return cannotUse.some((blocked) => tech.toLowerCase().includes(blocked));
	};

	// Build tech stack respecting constraints
	let language = defaults.language;
	let framework = defaults.framework || "";
	let database = defaults.database || "";
	const testing = defaults.testing || "pytest";
	const linting = defaults.linting || "ruff";
	const typeChecking = defaults.typeChecking || "mypy";
	let deployment = defaults.deployment || "";
	const ciCd = defaults.ciCd || "GitHub Actions";

	if (isBlocked(language)) language = "Python 3.11+";
	if (isBlocked(framework)) framework = "";
	if (isBlocked(database)) database = "";
	if (isBlocked(deployment)) deployment = "";

	// Add must_use items to additional tools
	const additionalTools: Record<string, string> = {};
	brief.mustUseTech.forEach((tech, i) => {
		additionalTools[`must_use_${i}`] = tech;
	});

	return {
		language,
		framework,
		database,
		testing,
		linting,
		typeChecking,
		deployment,
		ciCd,
		additionalTools,
	};
}

export function generatePhases(brief: ProjectBrief): Phase[] {
	const template = getTemplate(brief.projectType);
	const phaseNames = template.defaultPhases;

	return phaseNames.map((name, i) => ({
		id: String(i),
		title: name,
		goal: `Complete ${name.toLowerCase()} phase`,
		days: "",
		description: "",
		tasks: [],
	}));
}

/**
 * Replace template placeholders with actual project values.
 */
function replaceTemplatePlaceholders(text: string, projectName: string): string {
	const projectUnderscore = projectName.toLowerCase().replace(/-/g, "_");
	return text
		.replace(/\{project\}/g, projectUnderscore)
		.replace(/\{project_underscore\}/g, projectUnderscore);
}

/**
 * Get the previous subtask ID in the sequence for prerequisite chaining.
 */
function getPreviousSubtaskId(currentId: string, phases: PhaseTemplate[]): string | null {
	// Collect all subtask IDs in order
	const allIds: string[] = [];
	for (const phase of phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				allIds.push(subtask.id);
			}
		}
	}

	const currentIndex = allIds.indexOf(currentId);
	if (currentIndex <= 0) {
		return null; // First subtask has no prerequisite
	}
	return allIds[currentIndex - 1];
}

/**
 * Get a subtask's title by its ID.
 */
function getSubtaskTitle(id: string, phases: PhaseTemplate[], projectName: string): string | null {
	for (const phase of phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				if (subtask.id === id) {
					return replaceTemplatePlaceholders(subtask.title, projectName);
				}
			}
		}
	}
	return null;
}

/**
 * Generate detailed DEVELOPMENT_PLAN.md with paint-by-numbers subtasks.
 * Each subtask has explicit deliverables, files, and success criteria.
 *
 * @param briefContent - The PROJECT_BRIEF.md content
 * @param lessons - Optional array of lessons to inject into subtask success criteria
 */
export function generatePlan(briefContent: string, lessons?: Lesson[]): string {
	const brief = parseBrief(briefContent);
	const techStack = generateTechStack(brief);
	const projectType = (brief.projectType.toLowerCase().replace(/[\s-]/g, "_") || "cli") as
		| "cli"
		| "web_app"
		| "api"
		| "library";

	// Get detailed task templates for this project type
	const phaseTemplates = PROJECT_TYPE_TASKS[projectType] || PROJECT_TYPE_TASKS.cli;

	const techStackSection = Object.entries(techStack)
		.filter(([key, value]) => value && key !== "additionalTools")
		.map(([key, value]) => `- **${formatKey(key)}**: ${value}`)
		.join("\n");

	// Build progress tracking section
	const progressSection = phaseTemplates
		.map((phase) => {
			const taskLines = phase.tasks
				.flatMap((task) =>
					task.subtasks.map(
						(subtask) => `- [ ] ${subtask.id}: ${replaceTemplatePlaceholders(subtask.title, brief.projectName)}`
					)
				)
				.join("\n");
			return `### Phase ${phase.id}: ${phase.title}\n${taskLines}`;
		})
		.join("\n\n");

	// Build detailed phase sections with full subtask details
	const phasesSection = phaseTemplates
		.map((phase) => {
			const tasksSection = phase.tasks
				.map((task) => {
					const branchName = `${task.id}-${task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}`;
					const subtasksSection = task.subtasks
						.map((subtask) => {
							const deliverables = subtask.deliverables
								.map((d) => `- [ ] ${replaceTemplatePlaceholders(d, brief.projectName)}`)
								.join("\n");
							const filesToCreate =
								subtask.filesToCreate.length > 0
									? subtask.filesToCreate
											.map((f) => `- \`${replaceTemplatePlaceholders(f, brief.projectName)}\``)
											.join("\n")
									: "- None";
							const filesToModify =
								subtask.filesToModify.length > 0
									? subtask.filesToModify
											.map((f) => `- \`${replaceTemplatePlaceholders(f, brief.projectName)}\``)
											.join("\n")
									: "- None";
							// Base success criteria from template
							const baseSuccessCriteria = subtask.successCriteria
								.map((c) => `- [ ] ${replaceTemplatePlaceholders(c, brief.projectName)}`);

							// Add lesson-based success criteria if lessons provided
							let lessonCriteria: string[] = [];
							if (lessons && lessons.length > 0) {
								const relevantLessons = findRelevantLessons(
									subtask.title,
									subtask.deliverables,
									lessons,
									projectType
								);
								if (relevantLessons.length > 0) {
									lessonCriteria = generateLessonSuccessCriteria(relevantLessons)
										.map(c => `- [ ] ${c}`);
								}
							}

							const successCriteria = [...baseSuccessCriteria, ...lessonCriteria].join("\n");

							// Technology Decisions are mandatory - provide default if not specified
							const techDecisionsContent = subtask.techDecisions && subtask.techDecisions.length > 0
								? subtask.techDecisions.map((t) => `- ${replaceTemplatePlaceholders(t, brief.projectName)}`).join("\n")
								: `- Follow project conventions established in Phase 0\n- Maintain consistency with existing codebase patterns`;
							const techDecisions = `\n**Technology Decisions**:\n${techDecisionsContent}\n`;

							// Track prerequisite for this subtask (marked [x] as it must be complete before starting)
							const prereqId = getPreviousSubtaskId(subtask.id, phaseTemplates);
							const prereqTitle = prereqId ? getSubtaskTitle(prereqId, phaseTemplates, brief.projectName) : null;
							const prerequisite = prereqId
								? `- [x] ${prereqId}: ${prereqTitle}`
								: "- None (first subtask)";

							return `**Subtask ${subtask.id}: ${replaceTemplatePlaceholders(subtask.title, brief.projectName)} (Single Session)**

**Prerequisites**:
${prerequisite}

**Deliverables**:
${deliverables}
${techDecisions}
**Files to Create**:
${filesToCreate}

**Files to Modify**:
${filesToModify}

**Success Criteria**:
${successCriteria}

---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**:
  - (filename) - (line count) lines
- **Files Modified**:
  - (filename)
- **Tests**: (X tests, Y% coverage)
- **Build**: (ruff: pass/fail, mypy: pass/fail)
- **Branch**: feature/${task.id}-${subtask.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)}
- **Notes**: (any additional context)

---`;
						})
						.join("\n\n");

					return `### Task ${task.id}: ${task.title}

**Git**: Create branch \`feature/${branchName}\` when starting first subtask. Commit after each subtask. Squash merge to main when task complete.

${subtasksSection}

### Task ${task.id} Complete - Squash Merge
- [ ] All subtasks complete
- [ ] All tests pass
- [ ] Squash merge to main: \`git checkout main && git merge --squash feature/${branchName}\`
- [ ] Delete branch: \`git branch -d feature/${branchName}\``;
				})
				.join("\n\n");

			const daysLine = phase.days ? `**Duration**: ${phase.days}\n\n` : "";

			return `## Phase ${phase.id}: ${phase.title}

**Goal**: ${phase.goal}
${daysLine}
${tasksSection}`;
		})
		.join("\n\n---\n\n");

	// Add feature-specific phases based on the project's MVP features
	const featurePhasesSection = generateFeaturePhases(brief);

	// Add deferred phases for nice-to-have features (Phase X.5 v2)
	const deferredPhasesSection = generateDeferredPhases(brief);

	return `# ${brief.projectName} - Development Plan

## How to Use This Plan

**For Claude Code**: Read this plan, find the subtask ID from the prompt, complete ALL checkboxes, update completion notes, commit.

**For You**: Use this prompt (change only the subtask ID):
\`\`\`
please re-read claude.md and DEVELOPMENT_PLAN.md (the entire documents, for context), then continue with [X.Y.Z], following all of the development plan and claude.md rules.
\`\`\`

---

## Project Overview

**Project Name**: ${brief.projectName}
**Goal**: ${brief.primaryGoal}
**Target Users**: ${brief.targetUsers}
**Timeline**: ${brief.timeline || "Not specified"}

**MVP Scope**:
${brief.keyFeatures.map((f) => `- [ ] ${f}`).join("\n")}

---

## Technology Stack

${techStackSection}

---

## Progress Tracking

${progressSection}

**Current**: Phase 0
**Next**: 0.1.1

---

${phasesSection}

${featurePhasesSection}

${deferredPhasesSection}

## Git Workflow

### Branch Strategy
- **ONE branch per TASK** (e.g., \`feature/1-2-${brief.projectName.toLowerCase()}-core\`)
- **NO branches for individual subtasks** - subtasks are commits within the task branch
- Create branch when starting first subtask of a task
- Branch naming: \`feature/{phase}-{task}-{description}\`

### Commit Strategy
- **One commit per subtask** with semantic message
- Format: \`feat(scope): description\` or \`fix(scope): description\`
- Types: \`feat\`, \`fix\`, \`refactor\`, \`test\`, \`docs\`, \`chore\`
- Example: \`feat(parser): implement markdown parsing with GFM support\`

### Merge Strategy
- **Squash merge when task is complete** (all subtasks done)
- PR required for production branches
- Delete feature branch after merge

### Workflow Example
\`\`\`bash
# Starting Task 1.2 (first subtask is 1.2.1)
git checkout -b feature/1-2-user-auth

# After completing subtask 1.2.1
git add . && git commit -m "feat(auth): implement user model"

# After completing subtask 1.2.2
git add . && git commit -m "feat(auth): add password hashing"

# After completing subtask 1.2.3 (task complete)
git add . && git commit -m "feat(auth): add login endpoint"
git push -u origin feature/1-2-user-auth
# Create PR, squash merge to main, delete branch
\`\`\`

---

## Ready to Build

You now have a development plan so detailed that even Claude with Haiku can implement it. Each subtask is paint-by-numbers: explicit deliverables, specific files, and testable success criteria.

**To start implementation**, use this prompt (change only the subtask ID):

\`\`\`
Please read CLAUDE.md and DEVELOPMENT_PLAN.md completely, then implement subtask [0.1.1], following all rules and marking checkboxes as you complete each item.
\`\`\`

**Pro tip**: Start with 0.1.1 and work through subtasks in order. Each one builds on the previous.

---

*Generated by DevPlan MCP Server*
`;
}

/**
 * Analyze a feature string and categorize it for detailed template generation.
 */
function categorizeFeature(feature: string): {
	category:
		| "file_io"
		| "parsing"
		| "pdf_generation"
		| "data_transform"
		| "api_endpoint"
		| "ui_component"
		| "config"
		| "generic";
	keywords: string[];
} {
	const lowerFeature = feature.toLowerCase();
	const keywords: string[] = [];

	// Extract file types for context
	const fileTypeMatch = lowerFeature.match(
		/\b(markdown|md|pdf|json|yaml|csv|xml|html|txt|file|document)\b/g
	);
	if (fileTypeMatch) keywords.push(...fileTypeMatch);

	// PDF/document generation patterns (check before generic "generate")
	if (
		(lowerFeature.includes("generate") || lowerFeature.includes("create") || lowerFeature.includes("output")) &&
		(lowerFeature.includes("pdf") || lowerFeature.includes("document"))
	) {
		return { category: "pdf_generation", keywords };
	}

	// Parsing patterns (check before generic file_io)
	if (
		lowerFeature.includes("parse") ||
		(lowerFeature.includes("read") && (lowerFeature.includes("markdown") || lowerFeature.includes("md")))
	) {
		return { category: "parsing", keywords };
	}

	// File I/O patterns - conversion
	if (
		lowerFeature.includes("convert") ||
		lowerFeature.includes("export") ||
		lowerFeature.includes("import")
	) {
		return { category: "file_io", keywords };
	}

	// Batch/watch patterns
	if (
		lowerFeature.includes("batch") ||
		lowerFeature.includes("multiple") ||
		lowerFeature.includes("watch") ||
		lowerFeature.includes("monitor")
	) {
		return { category: "file_io", keywords: ["batch", ...keywords] };
	}

	// Data transformation patterns
	if (
		lowerFeature.includes("transform") ||
		lowerFeature.includes("process") ||
		lowerFeature.includes("highlight") ||
		lowerFeature.includes("format") ||
		lowerFeature.includes("style") ||
		lowerFeature.includes("theme") ||
		lowerFeature.includes("table of contents") ||
		lowerFeature.includes("toc")
	) {
		return { category: "data_transform", keywords };
	}

	// Config/options patterns
	if (
		lowerFeature.includes("custom") ||
		lowerFeature.includes("config") ||
		lowerFeature.includes("option") ||
		lowerFeature.includes("setting") ||
		lowerFeature.includes("output path") ||
		lowerFeature.includes("filename")
	) {
		return { category: "config", keywords };
	}

	// Generic file operations
	if (
		lowerFeature.includes("read") ||
		lowerFeature.includes("write") ||
		lowerFeature.includes("load") ||
		lowerFeature.includes("save")
	) {
		return { category: "file_io", keywords };
	}

	return { category: "generic", keywords };
}

/**
 * Generate detailed implementation guidance based on feature category.
 */
function generateFeatureImplementation(
	feature: string,
	projectName: string,
	phaseNum: number,
	techStack: string[]
): {
	deliverables: string[];
	filesToCreate: string[];
	filesToModify: string[];
	successCriteria: string[];
	techDecisions?: string[];
	codeGuidance: string;
} {
	const { category, keywords } = categorizeFeature(feature);
	const projectUnderscore = projectName.toLowerCase().replace(/-/g, "_");

	switch (category) {
		case "parsing": {
			const isMarkdown = keywords.includes("markdown") || keywords.includes("md");
			const isJson = keywords.includes("json");
			const isYaml = keywords.includes("yaml");

			if (isMarkdown) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/parser.py\` - Markdown parsing module`,
						`Implement \`parse_markdown_file(path: Path) -> str\` - Read file and parse to HTML`,
						`Implement \`parse_markdown_content(content: str) -> str\` - Parse string to HTML`,
						`Implement \`create_parser(code_highlighter=None) -> MarkdownIt\` - Configure parser instance`,
						`Implement \`CustomRenderer\` class - Custom renderer with code block hooks`,
						`Handle GFM extensions: tables, task lists (\`- [ ]\`), strikethrough (\`~~text~~\`)`,
						`Add \`markdown-it-py[plugins]\` to pyproject.toml dependencies`,
						`Create unit tests achieving >80% coverage`,
						`Create test fixtures with sample markdown files`,
					],
					filesToCreate: [
						`${projectUnderscore}/parser.py`,
						`tests/test_parser.py`,
						`tests/fixtures/sample.md`,
						`tests/fixtures/complex.md`,
					],
					filesToModify: [`pyproject.toml`],
					successCriteria: [
						`\`parse_markdown_file()\` reads file with UTF-8 encoding and returns HTML string`,
						`\`parse_markdown_content()\` handles all CommonMark elements (headers h1-h6, lists, links, images, code blocks)`,
						`GFM tables render as HTML \`<table>\` elements`,
						`Task lists (\`- [ ]\` / \`- [x]\`) render as checkboxes`,
						`Code blocks with language hints preserve language for highlighter: \`\`\`python -> \`<code class="language-python">\``,
						`Empty input returns empty string (no exceptions)`,
						`File not found raises \`FileNotFoundError\` with descriptive message`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Use markdown-it-py for CommonMark + GFM parsing (not mistune - less GFM support)`,
						`Custom renderer class for code block hooks (enables syntax highlighting integration)`,
						`Return HTML string (not DOM) - simpler for PDF generation pipeline`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/parser.py
from markdown_it import MarkdownIt
from markdown_it.renderer import RendererHTML

class CustomRenderer(RendererHTML):
    """Custom renderer with hooks for code block processing."""

    def __init__(self, code_highlighter=None):
        super().__init__()
        self.code_highlighter = code_highlighter

    def fence(self, tokens, idx, options, env):
        """Render fenced code blocks with optional syntax highlighting."""
        token = tokens[idx]
        code = token.content
        lang = token.info.strip() if token.info else None

        if self.code_highlighter and lang:
            return self.code_highlighter(code, lang)

        lang_class = f' class="language-{lang}"' if lang else ''
        escaped = self.escapeHtml(code)
        return f'<pre><code{lang_class}>{escaped}</code></pre>\\n'


def create_parser(code_highlighter=None) -> MarkdownIt:
    """
    Create configured markdown parser.

    Args:
        code_highlighter: Optional function(code, lang) -> html for syntax highlighting

    Returns:
        Configured MarkdownIt instance
    """
    md = MarkdownIt("gfm-like")  # GitHub Flavored Markdown
    md.renderer = CustomRenderer(code_highlighter)
    return md


def parse_markdown(content: str, code_highlighter=None) -> str:
    """
    Parse markdown content to HTML.

    Args:
        content: Markdown text to parse
        code_highlighter: Optional syntax highlighter function

    Returns:
        HTML string
    """
    parser = create_parser(code_highlighter)
    return parser.render(content)
\`\`\`

**Test fixtures** (tests/fixtures/sample.md):
\`\`\`markdown
# Heading 1
## Heading 2

Paragraph with **bold** and *italic* text.

- List item 1
- List item 2
  - Nested item

\\\`\\\`\\\`python
def hello():
    print("Hello, World!")
\\\`\\\`\\\`

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
\`\`\``,
				};
			}

			if (isJson) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/parser.py\` with JSON parsing utilities`,
						`Use built-in \`json\` module with proper error handling`,
						`Support both file paths and string content as input`,
						`Validate JSON structure against expected schema (if applicable)`,
						`Write tests with valid and invalid JSON samples`,
					],
					filesToCreate: [`${projectUnderscore}/parser.py`, `tests/test_parser.py`],
					filesToModify: [],
					successCriteria: [
						`Valid JSON parses without errors`,
						`Invalid JSON raises descriptive error with line number`,
						`Large files (>1MB) parse efficiently`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/parser.py
import json
from pathlib import Path
from typing import Any

class ParseError(Exception):
    """Raised when parsing fails."""
    pass

def parse_json(content: str | Path) -> Any:
    """
    Parse JSON content or file.

    Args:
        content: JSON string or path to JSON file

    Returns:
        Parsed Python object

    Raises:
        ParseError: If JSON is invalid
    """
    if isinstance(content, Path) or (isinstance(content, str) and Path(content).exists()):
        path = Path(content)
        content = path.read_text(encoding="utf-8")

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ParseError(f"Invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}") from e
\`\`\``,
				};
			}

			// Generic parsing
			return {
				deliverables: [
					`Create \`${projectUnderscore}/parser.py\` with parsing logic`,
					`Implement input validation and error handling`,
					`Support both file paths and string content`,
					`Write tests with various input samples`,
				],
				filesToCreate: [`${projectUnderscore}/parser.py`, `tests/test_parser.py`],
				filesToModify: [],
				successCriteria: [
					`Valid input parses correctly`,
					`Invalid input raises descriptive errors`,
					`Edge cases (empty, very large) handled gracefully`,
				],
				codeGuidance: "",
			};
		}

		case "pdf_generation": {
			return {
				deliverables: [
					`Create \`${projectUnderscore}/pdf.py\` - PDF generation module`,
					`Implement \`generate_pdf(html: str, output_path: Path, css: str = None) -> Path\` - Core PDF generation`,
					`Implement \`convert_file(input_path: Path, output_path: Path = None) -> Path\` - File-to-PDF conversion`,
					`Implement \`get_default_css() -> str\` - Return default print stylesheet`,
					`Create \`${projectUnderscore}/templates/base.html\` - HTML wrapper template with {css} and {content} placeholders`,
					`Define \`DEFAULT_CSS\` constant with @page rules, typography, code block styles`,
					`Add \`weasyprint>=60.0\` to pyproject.toml dependencies`,
					`Add \`convert\` command to CLI: \`${projectName} convert <input> [-o output]\``,
					`Create unit tests achieving >80% coverage`,
				],
				filesToCreate: [
					`${projectUnderscore}/pdf.py`,
					`${projectUnderscore}/templates/base.html`,
					`tests/test_pdf.py`,
				],
				filesToModify: [`${projectUnderscore}/cli.py`, `pyproject.toml`],
				successCriteria: [
					`\`generate_pdf()\` creates valid PDF file at specified path`,
					`\`convert_file()\` defaults output to input path with .pdf extension`,
					`PDF uses A4 page size with 2cm margins (@page CSS rule)`,
					`Default CSS includes readable typography (11pt body, proper heading sizes)`,
					`Code blocks use monospace font with light background`,
					`Output directory is created if it doesn't exist (mkdir parents=True)`,
					`ImportError for WeasyPrint shows message: "Install WeasyPrint: pip install weasyprint"`,
					`All tests pass with >80% coverage`,
				],
				techDecisions: [
					`Use WeasyPrint for HTML-to-PDF (best CSS support, active development)`,
					`A4 page size as default (international standard, fits US Letter content)`,
					`2cm margins (balanced whitespace without wasting paper)`,
					`Template pattern with {css} and {content} placeholders (flexible, testable)`,
				],
				codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/pdf.py
from pathlib import Path
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

# Base HTML template
BASE_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{css}</style>
</head>
<body>
{content}
</body>
</html>"""

# Default print styles
DEFAULT_CSS = """
@page {
    size: A4;
    margin: 2cm;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
}
h1 { font-size: 24pt; margin-top: 0; }
h2 { font-size: 18pt; }
h3 { font-size: 14pt; }
code {
    font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
    font-size: 10pt;
    background: #f5f5f5;
    padding: 0.2em 0.4em;
}
pre {
    background: #f5f5f5;
    padding: 1em;
    overflow-x: auto;
    border-radius: 4px;
}
"""


def generate_pdf(
    html_content: str,
    output_path: str | Path,
    css: str | None = None,
) -> Path:
    """
    Generate PDF from HTML content.

    Args:
        html_content: HTML string to convert
        output_path: Where to save the PDF
        css: Optional custom CSS (uses default if not provided)

    Returns:
        Path to generated PDF file
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    full_html = BASE_TEMPLATE.format(
        css=css or DEFAULT_CSS,
        content=html_content
    )

    font_config = FontConfiguration()
    html = HTML(string=full_html)
    html.write_pdf(output_path, font_config=font_config)

    return output_path


def convert_markdown_to_pdf(
    markdown_path: str | Path,
    output_path: str | Path | None = None,
    css: str | None = None,
) -> Path:
    """
    Convert markdown file to PDF.

    Args:
        markdown_path: Path to markdown file
        output_path: Output PDF path (defaults to same name with .pdf)
        css: Optional custom CSS

    Returns:
        Path to generated PDF
    """
    from ${projectUnderscore}.parser import parse_markdown

    markdown_path = Path(markdown_path)
    if output_path is None:
        output_path = markdown_path.with_suffix(".pdf")

    content = markdown_path.read_text(encoding="utf-8")
    html = parse_markdown(content)

    return generate_pdf(html, output_path, css)
\`\`\`

**Base template** (${projectUnderscore}/templates/base.html):
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{{ css }}</style>
</head>
<body>
{{ content }}
</body>
</html>
\`\`\`

**Dependencies** (add to pyproject.toml):
\`\`\`toml
dependencies = [
    "weasyprint>=60.0",
    "markdown-it-py>=3.0",
]
\`\`\``,
			};
		}

		case "file_io": {
			const isConversion =
				feature.toLowerCase().includes("convert") || feature.toLowerCase().includes("export");
			const isBatch =
				feature.toLowerCase().includes("batch") || feature.toLowerCase().includes("multiple");
			const isWatch = feature.toLowerCase().includes("watch");

			if (isWatch) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/watcher.py\` - File watching module`,
						`Implement \`WatchHandler\` class extending FileSystemEventHandler`,
						`Implement \`watch_file(path: Path, on_change: Callable) -> None\` - Watch single file`,
						`Implement debouncing in WatchHandler: ignore events within 300ms of last event`,
						`Add \`--watch\` / \`-w\` flag to convert command`,
						`Handle graceful shutdown: catch KeyboardInterrupt, stop observer, print "Stopped watching"`,
						`Add \`watchdog>=3.0\` to pyproject.toml dependencies`,
						`Create unit tests achieving >80% coverage`,
					],
					filesToCreate: [`${projectUnderscore}/watcher.py`, `tests/test_watcher.py`],
					filesToModify: [`${projectUnderscore}/cli.py`, `pyproject.toml`],
					successCriteria: [
						`\`WatchHandler.on_modified()\` calls callback only if >300ms since last call`,
						`\`watch_file()\` prints "Watching {path} for changes... (Ctrl+C to stop)"`,
						`File modification triggers rebuild within 1 second`,
						`Multiple rapid saves (within 300ms) trigger only one rebuild`,
						`Ctrl+C prints "Stopped watching" and exits with code 0`,
						`Watching non-existent file raises FileNotFoundError`,
						`File deletion while watching prints warning, continues watching parent directory`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Use watchdog library for cross-platform file system events`,
						`300ms debounce delay (balances responsiveness vs duplicate events)`,
						`Watch parent directory, filter for target file (watchdog limitation)`,
						`Use time.time() for debounce tracking (simple, no external deps)`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/watcher.py
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time

class ConversionHandler(FileSystemEventHandler):
    def __init__(self, convert_fn, debounce_ms=300):
        self.convert_fn = convert_fn
        self.debounce_ms = debounce_ms
        self._last_event = 0

    def on_modified(self, event):
        if event.is_directory:
            return
        # Debounce rapid events
        now = time.time() * 1000
        if now - self._last_event < self.debounce_ms:
            return
        self._last_event = now
        self.convert_fn(event.src_path)

def watch_file(path: str, convert_fn, on_change_msg: str = "Rebuilt"):
    """Watch a file and call convert_fn when it changes."""
    handler = ConversionHandler(convert_fn)
    observer = Observer()
    observer.schedule(handler, path=str(Path(path).parent), recursive=False)
    observer.start()
    print(f"Watching {path} for changes... (Ctrl+C to stop)")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
\`\`\``,
				};
			}

			if (isBatch) {
				return {
					deliverables: [
						`Implement \`expand_inputs(patterns: list[str]) -> list[Path]\` - Expand globs and directories to file list`,
						`Implement \`convert_batch(files: list[Path], output_dir: Path = None) -> BatchResult\` - Convert multiple files`,
						`Implement \`BatchResult\` dataclass with fields: succeeded (list), failed (list), total_time (float)`,
						`Update CLI to accept multiple positional arguments: \`${projectName} convert <files>...\``,
						`Add \`--output-dir\` / \`-d\` option for batch output location`,
						`Add progress indicator using click.progressbar showing "[1/5] Converting file.md..."`,
						`Handle partial failures: continue processing, report failures at end`,
						`Create unit tests achieving >80% coverage`,
					],
					filesToCreate: [`tests/test_batch.py`],
					filesToModify: [`${projectUnderscore}/cli.py`, `${projectUnderscore}/pdf.py`],
					successCriteria: [
						`\`expand_inputs(["*.md"])\` returns list of matching Path objects`,
						`\`expand_inputs(["./docs/"])\` returns all .md files in directory recursively`,
						`\`convert_batch()\` returns BatchResult with counts of succeeded/failed`,
						`Progress bar shows current file name and count: "[1/5] Converting README.md"`,
						`\`--output-dir ./pdfs/\` creates directory if needed and places outputs there`,
						`If 2 of 5 files fail, exit code is non-zero and stderr lists failed files`,
						`Keyboard interrupt (Ctrl+C) stops gracefully, reports partial progress`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Use glob.glob() with recursive=True for pattern expansion`,
						`Use click.progressbar for progress display (built into Click)`,
						`Continue on failure, collect errors, report at end (don't fail fast)`,
						`Exit code = number of failed files (0 = success, >0 = some failures)`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# In cli.py
@click.argument("inputs", nargs=-1, required=True)
@click.option("--output-dir", "-d", type=click.Path(), help="Output directory for batch")
@click.option("--jobs", "-j", default=1, help="Parallel jobs")
def convert(inputs: tuple[str, ...], output_dir: str | None, jobs: int):
    # Expand globs
    files = []
    for pattern in inputs:
        if "*" in pattern:
            files.extend(glob.glob(pattern, recursive=True))
        elif Path(pattern).is_dir():
            files.extend(Path(pattern).glob("**/*.md"))
        else:
            files.append(pattern)

    # Process with progress
    with click.progressbar(files, label="Converting") as bar:
        for f in bar:
            output = determine_output_path(f, output_dir)
            convert_file(f, output)
\`\`\``,
				};
			}

			if (isConversion) {
				// Extract source and target formats from feature
				const formats = keywords.filter((k) =>
					["markdown", "md", "pdf", "json", "yaml", "csv", "html"].includes(k)
				);
				const sourceFormat = formats[0] || "input";
				const targetFormat = formats[1] || "output";

				return {
					deliverables: [
						`Create \`${projectUnderscore}/converter.py\` with \`convert(input_path, output_path)\` function`,
						`Parse ${sourceFormat} input using appropriate library`,
						`Generate ${targetFormat} output with proper formatting`,
						`Add \`convert\` command to CLI with input/output arguments`,
						`Handle encoding (UTF-8) and file not found errors`,
						`Write unit tests with sample fixtures`,
					],
					filesToCreate: [
						`${projectUnderscore}/converter.py`,
						`tests/test_converter.py`,
						`tests/fixtures/sample.md`,
					],
					filesToModify: [`${projectUnderscore}/cli.py`],
					successCriteria: [
						`\`${projectName} convert input.md\` produces \`input.pdf\` in same directory`,
						`\`${projectName} convert input.md -o custom.pdf\` works`,
						`Informative error message for missing input file`,
						`Tests cover: valid conversion, missing file, invalid format`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/converter.py
from pathlib import Path

def convert(input_path: str | Path, output_path: str | Path | None = None) -> Path:
    """
    Convert ${sourceFormat} file to ${targetFormat}.

    Args:
        input_path: Path to input ${sourceFormat} file
        output_path: Optional output path. Defaults to input with .${targetFormat} extension.

    Returns:
        Path to generated ${targetFormat} file

    Raises:
        FileNotFoundError: If input file doesn't exist
        ConversionError: If conversion fails
    """
    input_path = Path(input_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = input_path.with_suffix(".${targetFormat}")
    else:
        output_path = Path(output_path)

    # Read input
    content = input_path.read_text(encoding="utf-8")

    # Transform (implement conversion logic here)
    result = transform_content(content)

    # Write output
    output_path.write_bytes(result)  # or write_text for text formats

    return output_path
\`\`\``,
				};
			}

			// Generic file I/O
			return {
				deliverables: [
					`Implement file reading with proper encoding handling (UTF-8)`,
					`Implement file writing with atomic writes (write to temp, then rename)`,
					`Add CLI options for input/output paths`,
					`Handle file permissions and disk space errors`,
					`Write tests with temporary files`,
				],
				filesToCreate: [`${projectUnderscore}/io.py`, `tests/test_io.py`],
				filesToModify: [`${projectUnderscore}/cli.py`],
				successCriteria: [
					`Can read files with various encodings`,
					`Atomic writes prevent partial output on error`,
					`Clear error messages for permission denied, disk full`,
				],
				codeGuidance: "",
			};
		}

		case "data_transform": {
			const isHighlight = feature.toLowerCase().includes("highlight");
			const isTheme =
				feature.toLowerCase().includes("theme") ||
				feature.toLowerCase().includes("style") ||
				feature.toLowerCase().includes("css");
			const isToc =
				feature.toLowerCase().includes("table of contents") || feature.toLowerCase().includes("toc");

			if (isHighlight) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/highlighter.py\` - Syntax highlighting module`,
						`Implement \`highlight_code(code: str, language: str = None) -> str\` - Apply syntax highlighting`,
						`Implement \`get_lexer(language: str = None, code: str = None) -> Lexer\` - Get appropriate Pygments lexer`,
						`Implement \`get_highlight_css(theme: str = "default") -> str\` - Get CSS for highlight theme`,
						`Implement \`SUPPORTED_THEMES: list[str]\` - List of available Pygments themes`,
						`Integrate with parser: pass \`highlight_code\` as \`code_highlighter\` to \`create_parser()\``,
						`Add \`--highlight-theme <name>\` CLI option (default: "default")`,
						`Add \`pygments>=2.0\` to pyproject.toml dependencies`,
						`Create unit tests achieving >80% coverage`,
					],
					filesToCreate: [
						`${projectUnderscore}/highlighter.py`,
						`tests/test_highlighter.py`,
					],
					filesToModify: [`${projectUnderscore}/parser.py`, `${projectUnderscore}/cli.py`, `pyproject.toml`],
					successCriteria: [
						`\`highlight_code()\` returns HTML with \`<span class="...">\` syntax highlighting spans`,
						`\`get_lexer()\` returns correct lexer for "python", "javascript", "bash", "json"`,
						`\`get_lexer()\` with unknown language falls back to TextLexer (plain text)`,
						`\`get_lexer(None, code)\` auto-detects language from code content`,
						`\`get_highlight_css("monokai")\` returns valid CSS for monokai theme`,
						`Integration: markdown code blocks are highlighted in final PDF output`,
						`\`--highlight-theme invalid\` shows error with list of available themes`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Use Pygments for syntax highlighting (industry standard, 500+ languages)`,
						`HtmlFormatter with cssclass="highlight" for consistent CSS targeting`,
						`Fallback to TextLexer for unknown languages (never fail, just don't highlight)`,
						`Auto-detection as fallback only (explicit language preferred for accuracy)`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/highlighter.py
from pygments import highlight
from pygments.lexers import get_lexer_by_name, guess_lexer, TextLexer
from pygments.formatters import HtmlFormatter

def highlight_code(code: str, language: str | None = None) -> str:
    """
    Apply syntax highlighting to code block.

    Args:
        code: Source code to highlight
        language: Language identifier (python, js, etc.) or None for auto-detect

    Returns:
        HTML string with syntax highlighting spans
    """
    try:
        if language:
            lexer = get_lexer_by_name(language, stripall=True)
        else:
            lexer = guess_lexer(code)
    except Exception:
        lexer = TextLexer()

    formatter = HtmlFormatter(nowrap=True, cssclass="highlight")
    return highlight(code, lexer, formatter)

def get_highlight_css(theme: str = "default") -> str:
    """Get CSS for syntax highlighting theme."""
    formatter = HtmlFormatter(style=theme)
    return formatter.get_style_defs(".highlight")
\`\`\``,
				};
			}

			if (isTheme) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/themes/__init__.py\` - Theme management module`,
						`Implement \`get_theme_css(theme: str) -> str\` - Load built-in theme CSS`,
						`Implement \`load_custom_css(path: Path) -> str\` - Load user CSS file`,
						`Implement \`list_themes() -> list[str]\` - Return available theme names`,
						`Define \`BUILT_IN_THEMES = ["default", "minimal"]\` constant`,
						`Create \`${projectUnderscore}/themes/default.css\` - Professional theme with system fonts`,
						`Create \`${projectUnderscore}/themes/minimal.css\` - Clean, minimal styling`,
						`Add \`--theme <name>\` CLI option (default: "default")`,
						`Add \`--css <path>\` CLI option for custom CSS file`,
						`Create unit tests achieving >80% coverage`,
					],
					filesToCreate: [
						`${projectUnderscore}/themes/__init__.py`,
						`${projectUnderscore}/themes/default.css`,
						`${projectUnderscore}/themes/minimal.css`,
						`tests/test_themes.py`,
					],
					filesToModify: [`${projectUnderscore}/pdf.py`, `${projectUnderscore}/cli.py`],
					successCriteria: [
						`\`get_theme_css("default")\` returns CSS string with body, heading, code styles`,
						`\`get_theme_css("minimal")\` returns different CSS with simpler styles`,
						`\`get_theme_css("invalid")\` raises ValueError listing available themes`,
						`\`load_custom_css()\` reads file and returns CSS string`,
						`\`load_custom_css()\` raises FileNotFoundError for missing files`,
						`\`list_themes()\` returns ["default", "minimal"]`,
						`\`--theme minimal\` CLI option applies minimal.css to PDF output`,
						`\`--css custom.css\` loads and applies user CSS, overriding default`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Store themes as .css files in package (not embedded strings) - easier to edit`,
						`Use importlib.resources for package data access (Python 3.9+ standard)`,
						`--css overrides --theme completely (no merging) - simpler mental model`,
						`System font stack for default theme (no web font dependencies)`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/themes/__init__.py
from pathlib import Path

THEMES_DIR = Path(__file__).parent
BUILT_IN_THEMES = ["default", "minimal"]

def get_theme_css(theme: str) -> str:
    """Load CSS for a built-in theme."""
    if theme not in BUILT_IN_THEMES:
        raise ValueError(f"Unknown theme: {theme}. Available: {BUILT_IN_THEMES}")
    css_path = THEMES_DIR / f"{theme}.css"
    return css_path.read_text()

def load_custom_css(path: str | Path) -> str:
    """Load CSS from a custom file."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"CSS file not found: {path}")
    return path.read_text()
\`\`\`

**default.css structure**:
\`\`\`css
/* ${projectUnderscore}/themes/default.css */
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
h1, h2, h3 { margin-top: 1.5em; }
code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
pre { background: #f4f4f4; padding: 1em; overflow-x: auto; }
\`\`\``,
				};
			}

			if (isToc) {
				return {
					deliverables: [
						`Create \`${projectUnderscore}/toc.py\` - Table of contents module`,
						`Implement \`TocEntry\` dataclass with fields: level (int), text (str), anchor (str)`,
						`Implement \`extract_headings(html: str, max_depth: int = 6) -> list[TocEntry]\` - Parse headings from HTML`,
						`Implement \`generate_anchor(text: str) -> str\` - Create URL-safe anchor from heading text`,
						`Implement \`add_heading_ids(html: str) -> str\` - Add id attributes to headings`,
						`Implement \`generate_toc_html(entries: list[TocEntry]) -> str\` - Render TOC as HTML nav element`,
						`Add \`--toc\` CLI flag to enable TOC generation`,
						`Add \`--toc-depth N\` CLI option to limit heading levels (default: 6)`,
						`Create unit tests achieving >80% coverage`,
					],
					filesToCreate: [`${projectUnderscore}/toc.py`, `tests/test_toc.py`],
					filesToModify: [`${projectUnderscore}/pdf.py`, `${projectUnderscore}/cli.py`],
					successCriteria: [
						`\`extract_headings()\` finds all h1-h6 tags with their text content`,
						`\`extract_headings(html, max_depth=2)\` only returns h1 and h2 entries`,
						`\`generate_anchor("Hello World!")\` returns "hello-world" (lowercase, hyphenated)`,
						`\`add_heading_ids()\` adds id="anchor" to each heading tag`,
						`\`generate_toc_html()\` returns \`<nav class="toc">...<ul>...<li>...\` structure`,
						`TOC links (\`<a href="#anchor">\`) navigate to correct headings in PDF`,
						`Nested headings (h2 under h1) render as nested \`<ul>\` lists`,
						`Empty document (no headings) returns empty string (no error)`,
						`All tests pass with >80% coverage`,
					],
					techDecisions: [
						`Use regex to extract headings (simpler than HTML parser for this use case)`,
						`Anchor format: lowercase, spaces to hyphens, strip special chars`,
						`TOC as \`<nav class="toc">\` element (semantic HTML, easy to style)`,
						`Insert TOC at beginning of content (before first heading)`,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# ${projectUnderscore}/toc.py
import re
from dataclasses import dataclass

@dataclass
class TocEntry:
    level: int  # 1-6
    text: str
    anchor: str

def extract_headings(html: str, max_depth: int = 6) -> list[TocEntry]:
    """Extract headings from HTML content."""
    pattern = r"<h([1-6])[^>]*id=[\"']([^\"']+)[\"'][^>]*>(.+?)</h\\1>"
    entries = []
    for match in re.finditer(pattern, html, re.IGNORECASE):
        level = int(match.group(1))
        if level <= max_depth:
            entries.append(TocEntry(
                level=level,
                anchor=match.group(2),
                text=re.sub(r"<[^>]+>", "", match.group(3))  # Strip inner tags
            ))
    return entries

def generate_toc_html(entries: list[TocEntry]) -> str:
    """Generate HTML table of contents."""
    if not entries:
        return ""
    lines = ['<nav class="toc"><h2>Table of Contents</h2><ul>']
    for entry in entries:
        indent = "  " * (entry.level - 1)
        lines.append(f'{indent}<li><a href="#{entry.anchor}">{entry.text}</a></li>')
    lines.append("</ul></nav>")
    return "\\n".join(lines)
\`\`\``,
				};
			}

			// Generic transform
			return {
				deliverables: [
					`Design transformation pipeline with clear input/output types`,
					`Implement core transformation function`,
					`Add validation for input data`,
					`Handle edge cases (empty input, malformed data)`,
					`Write tests with various input scenarios`,
				],
				filesToCreate: [`${projectUnderscore}/transform.py`, `tests/test_transform.py`],
				filesToModify: [],
				successCriteria: [
					`Transformation produces expected output for valid input`,
					`Clear error messages for invalid input`,
					`Edge cases handled gracefully`,
				],
				codeGuidance: "",
			};
		}

		case "config": {
			const isOutputPath =
				feature.toLowerCase().includes("output") || feature.toLowerCase().includes("path");

			if (isOutputPath) {
				return {
					deliverables: [
						`Add \`-o\` / \`--output\` option for custom output file path`,
						`Add \`--output-dir\` option for batch operations`,
						`Support filename templates: \`{name}\`, \`{date}\`, \`{ext}\``,
						`Create output directory if it doesn't exist`,
						`Handle path conflicts (overwrite prompt or \`--force\`)`,
						`Write tests for path handling`,
					],
					filesToCreate: [`tests/test_output_paths.py`],
					filesToModify: [`${projectUnderscore}/cli.py`, `${projectUnderscore}/converter.py`],
					successCriteria: [
						`\`-o custom.pdf\` creates file at specified path`,
						`\`--output-dir ./out/\` places output in directory (creates if needed)`,
						`Template \`{name}-converted.pdf\` works correctly`,
						`Refuses to overwrite existing file without \`--force\``,
					],
					codeGuidance: `
**Implementation Pattern**:
\`\`\`python
# In cli.py
@click.option("-o", "--output", type=click.Path(), help="Output file path")
@click.option("--output-dir", type=click.Path(), help="Output directory")
@click.option("--force", is_flag=True, help="Overwrite existing files")
def convert(input_file, output, output_dir, force):
    output_path = determine_output_path(input_file, output, output_dir)

    if output_path.exists() and not force:
        if not click.confirm(f"{output_path} exists. Overwrite?"):
            raise click.Abort()

    # Ensure directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

def determine_output_path(input_path: Path, output: str | None, output_dir: str | None) -> Path:
    if output:
        return Path(output)
    if output_dir:
        return Path(output_dir) / input_path.with_suffix(".pdf").name
    return input_path.with_suffix(".pdf")
\`\`\``,
				};
			}

			// Generic config
			return {
				deliverables: [
					`Define configuration schema with defaults`,
					`Support config file (${projectName}.toml or .${projectName}rc)`,
					`CLI options override config file values`,
					`Add \`--config\` option to specify config file path`,
					`Write tests for config loading and merging`,
				],
				filesToCreate: [`${projectUnderscore}/config.py`, `tests/test_config.py`],
				filesToModify: [`${projectUnderscore}/cli.py`],
				successCriteria: [
					`Config file is auto-discovered in current directory`,
					`CLI options take precedence over config file`,
					`Missing config file uses sensible defaults`,
				],
				codeGuidance: "",
			};
		}

		default: {
			// Generic feature - provide structure but let Claude Code fill details
			return {
				deliverables: [
					`Analyze feature requirements and design API/interface`,
					`Create module \`${projectUnderscore}/<feature_module>.py\``,
					`Implement core functionality with proper error handling`,
					`Add CLI integration (command or options)`,
					`Write comprehensive unit tests (>80% coverage)`,
					`Update README with feature documentation`,
				],
				filesToCreate: [`${projectUnderscore}/<feature_module>.py`, `tests/test_<feature>.py`],
				filesToModify: [`${projectUnderscore}/cli.py`, `README.md`],
				successCriteria: [
					`Feature works as described in PROJECT_BRIEF.md`,
					`All expected inputs produce correct outputs`,
					`Edge cases and errors are handled gracefully`,
					`Tests pass with good coverage`,
				],
				codeGuidance: `
**Note**: This is a custom feature. Before implementing:
1. Read PROJECT_BRIEF.md to understand exact requirements
2. Check existing code patterns in the project
3. Design the interface (function signatures, CLI options)
4. Write tests first (TDD approach)
5. Implement and iterate`,
			};
		}
	}
}

/**
 * Generate a short title for a feature (for prerequisite references).
 */
function getFeatureShortTitle(feature: string): string {
	// Extract key words and limit length
	const words = feature.split(/\s+/).slice(0, 4);
	return words.join(" ");
}

/**
 * Generate additional phases based on the project's specific MVP features.
 * Now with detailed, paint-by-numbers implementation guidance.
 */
function generateFeaturePhases(brief: ProjectBrief): string {
	if (brief.keyFeatures.length === 0) {
		return "";
	}

	// Start feature phases after foundation phases (typically phase 2+)
	const startPhase = 2;
	const techStack = brief.mustUseTech;

	// Track previous subtask for prerequisite chaining
	let previousSubtaskId = "1.1.1";
	let previousSubtaskTitle = "Click CLI Setup";

	const featurePhases = brief.keyFeatures.map((feature, index) => {
		const phaseNum = startPhase + index;
		const featureId = feature
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 30);
		const featureShortTitle = getFeatureShortTitle(feature);

		const impl = generateFeatureImplementation(feature, brief.projectName, phaseNum, techStack);

		const deliverables = impl.deliverables.map((d) => `- [ ] ${d}`).join("\n");
		const filesToCreate =
			impl.filesToCreate.length > 0
				? impl.filesToCreate.map((f) => `- \`${f}\``).join("\n")
				: "- None (modify existing files only)";
		const filesToModify =
			impl.filesToModify.length > 0
				? impl.filesToModify.map((f) => `- \`${f}\``).join("\n")
				: "- None";
		const successCriteria = impl.successCriteria.map((c) => `- [ ] ${c}`).join("\n");
		// Technology Decisions are mandatory - provide default if not specified
		const techDecisionsContent = impl.techDecisions && impl.techDecisions.length > 0
			? impl.techDecisions.map((t) => `- ${t}`).join("\n")
			: `- Follow project conventions established in Phase 0\n- Maintain consistency with existing codebase patterns\n- Prioritize readability and maintainability`;
		const techDecisions = `\n**Technology Decisions**:\n${techDecisionsContent}\n`;
		// Code guidance with implementation examples
		const codeGuidance = impl.codeGuidance ? `\n**Implementation Guide**:\n${impl.codeGuidance}\n` : "";

		// Generate prerequisite reference to previous subtask (marked [x] as it must be complete)
		const prerequisite = `- [x] ${previousSubtaskId}: ${previousSubtaskTitle}`;

		// Update for next iteration
		const currentSubtaskId = `${phaseNum}.1.1`;
		previousSubtaskId = currentSubtaskId;
		previousSubtaskTitle = featureShortTitle;

		return `## Phase ${phaseNum}: ${feature}

**Goal**: Implement ${feature.toLowerCase()}
**Duration**: 1-2 days

### Task ${phaseNum}.1: Core Implementation

**Git**: Create branch \`feature/${phaseNum}-1-${featureId}\` when starting. Commit after subtask. Squash merge to main when task complete.

**Subtask ${phaseNum}.1.1: ${featureShortTitle} (Single Session)**

**Prerequisites**:
${prerequisite}

**Deliverables**:
${deliverables}
${techDecisions}
**Files to Create**:
${filesToCreate}

**Files to Modify**:
${filesToModify}

**Success Criteria**:
${successCriteria}
${codeGuidance}
---

**Completion Notes**:
- **Implementation**: (describe what was done)
- **Files Created**:
  - (filename) - (line count) lines
- **Files Modified**:
  - (filename)
- **Tests**: (X tests, Y% coverage)
- **Build**: (ruff: pass/fail, mypy: pass/fail)
- **Branch**: feature/${phaseNum}-1-${featureId}
- **Notes**: (any additional context)

---

### Task ${phaseNum}.1 Complete - Squash Merge
- [ ] All subtasks complete
- [ ] All tests pass
- [ ] Squash merge to main: \`git checkout main && git merge --squash feature/${phaseNum}-1-${featureId}\`
- [ ] Delete branch: \`git branch -d feature/${phaseNum}-1-${featureId}\``;
	});

	return featurePhases.join("\n\n");
}

/**
 * Generate deferred phases for nice-to-have features (v2).
 * Uses Phase X.5 notation to indicate these are post-MVP.
 */
function generateDeferredPhases(brief: ProjectBrief): string {
	if (!brief.niceToHaveFeatures || brief.niceToHaveFeatures.length === 0) {
		return "";
	}

	// Calculate the starting phase number (after MVP features)
	const lastMvpPhaseNum = 2 + brief.keyFeatures.length - 1;

	const deferredPhases = brief.niceToHaveFeatures.map((feature, index) => {
		// Use X.5 notation to indicate post-MVP
		const phaseNum = `${lastMvpPhaseNum + index + 1}.5`;
		const featureId = feature
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.slice(0, 30);

		return `## Phase ${phaseNum} (v2): ${feature}

**Goal**: Implement ${feature.toLowerCase()} (post-MVP enhancement)
**Duration**: TBD (deferred)
**Status**: ⏸️ DEFERRED - Implement after MVP completion

### Task ${phaseNum}.1: Implementation (v2)

**Subtask ${phaseNum}.1.1: ${feature} (Deferred)**

**Prerequisites**:
- [ ] All MVP phases complete
- [ ] MVP tested and stable

**Deliverables**:
- [ ] (To be detailed after MVP completion)

**Success Criteria**:
- [ ] Feature works as specified
- [ ] All tests pass
- [ ] Documentation updated

---

**Note**: This phase is deferred until after MVP release. Requirements may be refined based on MVP learnings.

---`;
	});

	if (deferredPhases.length === 0) {
		return "";
	}

	return `## Deferred Phases (v2 Features)

The following phases are planned for v2, after MVP completion. They use Phase X.5 notation to indicate their deferred status.

${deferredPhases.join("\n\n")}`;
}

export function generateClaudeMd(
	briefContent: string,
	language: string = "python",
	testCoverage: number = 80
): string {
	const brief = parseBrief(briefContent);
	const isPython = language === "python";
	const projectUnderscore = brief.projectName.toLowerCase().replace(/-/g, "_");

	return `# CLAUDE.md - Project Rules for ${brief.projectName}

> This document defines HOW Claude Code should work on ${brief.projectName}.
> Read at the start of every session to maintain consistency.

## Core Operating Principles

### 1. Single Session Execution
- ✅ Complete the ENTIRE subtask in this session
- ✅ End every session with a git commit
- ❌ If blocked, document why and mark as BLOCKED

### 2. Read Before Acting
**Every session must begin with:**
1. Read DEVELOPMENT_PLAN.md completely
2. Locate the specific subtask ID from the prompt
3. Verify prerequisites are marked \`[x]\` complete
4. Read completion notes from prerequisites for context

### 3. File Management

**Project Structure:**
\`\`\`
${brief.projectName}/
├── ${projectUnderscore}/              # Main package
│   ├── __init__.py
│   ├── cli.py                   # Click CLI commands
│   └── ...                      # Feature modules
├── tests/
│   ├── __init__.py
│   ├── test_*.py               # Test modules
│   └── fixtures/               # Test data
├── pyproject.toml              # Project metadata
├── README.md
├── CLAUDE.md                   # This file
└── DEVELOPMENT_PLAN.md         # Development roadmap
\`\`\`

**Creating Files:**
- Use exact paths specified in subtask
- Add proper module docstrings
- Include type hints on all functions

**Modifying Files:**
- Only modify files listed in subtask
- Preserve existing functionality
- Update related tests

### 4. Testing Requirements

**Unit Tests:**
- Write tests for EVERY new function/class
- Place in \`tests/\` with \`test_\` prefix
- Minimum coverage: ${testCoverage}% overall
- Test success, failure, and edge cases

**Running Tests:**
\`\`\`bash
${isPython ? `# All tests
pytest tests/ -v --cov=${projectUnderscore} --cov-report=term-missing

# Specific test file
pytest tests/test_parser.py -v

# With coverage report
pytest --cov=${projectUnderscore} --cov-report=html` : `# All tests
npm test

# With coverage
npm test -- --coverage`}
\`\`\`

**Before Every Commit:**
- [ ] All tests pass
- [ ] Coverage >${testCoverage}%
- [ ] Linting passes (${isPython ? "ruff" : "eslint"})
- [ ] Type checking passes (${isPython ? "mypy" : "tsc"})

### 5. Completion Protocol

**When a subtask is complete:**

1. **Update DEVELOPMENT_PLAN.md** with completion notes:
\`\`\`markdown
**Completion Notes:**
- **Implementation**: Brief description of what was built
- **Files Created**:
  - \`${projectUnderscore}/parser.py\` (234 lines)
  - \`tests/test_parser.py\` (156 lines)
- **Files Modified**:
  - \`${projectUnderscore}/__init__.py\` (added parser import)
- **Tests**: 12 unit tests (85% coverage)
- **Build**: ✅ Success (all tests pass, linting clean)
- **Branch**: feature/subtask-X-Y-Z
- **Notes**: Any deviations, issues, or future work
\`\`\`

2. **Check all checkboxes** in the subtask (change \`[ ]\` to \`[x]\`)

3. **Git commit** with semantic message:
\`\`\`bash
git add .
git commit -m "feat(parser): Implement markdown parser

- Parse markdown with GFM support
- Extract all headings and code blocks
- Add comprehensive tests
- 85% coverage on parser module"
\`\`\`

4. **Report completion** with summary

### 6. Technology Stack

${isPython ? `**Tech Stack:**
- **Language**: Python 3.11+
- **CLI Framework**: Click 8.1+
- **Testing**: pytest 7.4+, pytest-cov
- **Linting**: ruff 0.1+
- **Type Checking**: mypy 1.7+

**Installing Dependencies:**
\`\`\`bash
pip install -e ".[dev]"  # Editable install with dev dependencies
\`\`\`` : `**Tech Stack:**
- **Language**: TypeScript/Node.js
- **Testing**: Jest or Vitest
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode

**Installing Dependencies:**
\`\`\`bash
npm install
\`\`\``}

### 7. Error Handling

**If you encounter an error:**
1. Attempt to fix using project patterns
2. If blocked, update DEVELOPMENT_PLAN.md:
   \`\`\`markdown
   **Completion Notes:**
   - **Status**: ❌ BLOCKED
   - **Error**: [Detailed error message]
   - **Attempted**: [What was tried]
   - **Root Cause**: [Analysis]
   - **Suggested Fix**: [What should be done]
   \`\`\`
3. Do NOT mark subtask complete if blocked
4. Do NOT commit broken code
5. Report immediately

### 8. Code Quality Standards

${isPython ? `**Python Style:**
- Follow PEP 8
- Type hints on all functions: \`def func(x: int) -> str:\`
- Docstrings: Google style
- Max line length: 100 characters
- Use \`ruff\` for linting
- Use \`mypy\` for type checking

**Example Function:**
\`\`\`python
def parse_brief(brief_path: Path) -> ProjectBrief:
    """Parse PROJECT_BRIEF.md file and extract requirements.

    Args:
        brief_path: Path to PROJECT_BRIEF.md file

    Returns:
        ProjectBrief object with all extracted fields

    Raises:
        FileNotFoundError: If brief file doesn't exist
        ValueError: If brief is malformed or missing required fields

    Example:
        >>> brief = parse_brief(Path("PROJECT_BRIEF.md"))
        >>> brief.project_name
        '${brief.projectName}'
    """
    if not brief_path.exists():
        raise FileNotFoundError(f"Brief file not found: {brief_path}")

    # Implementation...
\`\`\`

**Imports:**
- Standard library first
- Third-party second
- Local imports last
- Alphabetical within each group

**Prohibited:**
- \`print()\` for output (use Click.echo or logging)
- \`exit()\` (raise exceptions instead)
- Bare \`except:\` (catch specific exceptions)
- Global variables (use classes or pass parameters)` : `**TypeScript Style:**
- Use strict mode
- Type all function parameters and returns
- Use interfaces for complex types
- Max line length: 100 characters

**Prohibited:**
- \`console.log()\` in production (use proper logging)
- \`any\` type without explicit justification
- Ignoring Promise rejections`}

### 9. CLI Design Standards

${isPython ? `**Command Structure:**
\`\`\`bash
${brief.projectName.toLowerCase()} <command> [options] [arguments]
\`\`\`

**All commands must:**
- Have \`--help\` text with examples
- Use Click's option validation
- Provide clear error messages
- Support \`--verbose\` for debug output
- Return proper exit codes (0=success, 1=error)

**Example Command:**
\`\`\`python
@click.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.option('-o', '--output', type=click.Path(), help='Output file path')
@click.option('--verbose', is_flag=True, help='Enable verbose output')
def convert(input_file: str, output: str | None, verbose: bool):
    """Convert markdown file to PDF.

    Example:
        ${brief.projectName.toLowerCase()} convert README.md -o output.pdf
    """
    # Implementation...
\`\`\`` : `**All commands should:**
- Have clear help text
- Validate inputs
- Provide clear error messages
- Return proper exit codes`}

### 10. Build Verification

**Before marking subtask complete:**

\`\`\`bash
${isPython ? `# Linting
ruff check ${projectUnderscore} tests

# Type checking
mypy ${projectUnderscore}

# Tests
pytest tests/ -v --cov=${projectUnderscore} --cov-report=term-missing

# Build package
python -m build

# Install and test CLI
pip install -e .
${brief.projectName.toLowerCase()} --help` : `# Linting
npm run lint

# Type checking
npm run typecheck

# Tests
npm test

# Build
npm run build`}
\`\`\`

**All must pass with no errors.**

## Checklist: Starting a New Session

- [ ] Read DEVELOPMENT_PLAN.md completely
- [ ] Locate subtask ID from prompt
- [ ] Verify prerequisites marked \`[x]\`
- [ ] Read prerequisite completion notes
- [ ] Understand success criteria
- [ ] Ready to code!

## Checklist: Ending a Session

- [ ] All subtask checkboxes checked
- [ ] All tests pass (${isPython ? "pytest" : "npm test"})
- [ ] Linting clean (${isPython ? "ruff" : "eslint"})
- [ ] Type checking clean (${isPython ? "mypy" : "tsc"})
- [ ] Completion notes written
- [ ] Git commit with semantic message
- [ ] User notified

---

**Version**: 1.0
**Last Updated**: ${new Date().toISOString().split("T")[0]}
**Project**: ${brief.projectName}

*Generated by DevPlan MCP Server*
`;
}

function formatKey(key: string): string {
	return key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

export function validatePlan(content: string, strict: boolean = false): {
	valid: boolean;
	errors: string[];
	warnings: string[];
	suggestions: string[];
	stats: {
		phases: number;
		tasks: number;
		subtasks: number;
		completedSubtasks: number;
		percentComplete: number;
	};
} {
	const errors: string[] = [];
	const warnings: string[] = [];
	const suggestions: string[] = [];

	// Check for required sections
	if (!content.includes("# ") || !content.toLowerCase().includes("development plan")) {
		errors.push("Missing Development Plan header");
	}

	if (!content.includes("Technology Stack") && !content.includes("Tech Stack")) {
		errors.push("Missing Technology Stack section");
	}

	// Check for tech stack conflicts
	const techStack = extractTechFromPlan(content);
	const techConflicts = detectTechConflicts(techStack);
	warnings.push(...techConflicts);

	// Check for phases (support both ## Phase and ### Phase formats)
	const phaseMatches = content.match(/##+ Phase \d+/g);
	const phaseCount = phaseMatches?.length || 0;
	if (phaseCount === 0) {
		errors.push("No phases defined in the plan");
	} else if (phaseCount < 2) {
		warnings.push(`Only ${phaseCount} phase defined, consider adding more structure`);
	}

	// Check for Phase 0 Foundation
	if (!content.includes("Phase 0") || !content.toLowerCase().includes("foundation")) {
		warnings.push("Phase 0 should be titled 'Foundation'");
	}

	// Count tasks (Task X.Y pattern)
	const taskMatches = content.match(/### Task \d+\.\d+/g);
	const taskCount = taskMatches?.length || 0;

	// Count subtasks (Subtask X.Y.Z pattern or checkbox pattern - [ ] X.Y.Z)
	const subtaskHeaderMatches = content.match(/\*\*Subtask \d+\.\d+\.\d+/g);
	const subtaskCheckboxMatches = content.match(/- \[[ x]\] \d+\.\d+\.\d+/g);
	const subtaskCount = subtaskHeaderMatches?.length || subtaskCheckboxMatches?.length || 0;

	// Count completed subtasks (checkboxes marked [x])
	const completedMatches = content.match(/- \[x\] \d+\.\d+\.\d+/gi);
	const completedCount = completedMatches?.length || 0;

	// Calculate progress
	const percentComplete = subtaskCount > 0 ? Math.round((completedCount / subtaskCount) * 100) : 0;

	// Validate subtask structure
	const subtaskSections = content.split(/\*\*Subtask \d+\.\d+\.\d+/).slice(1);
	let subtasksWithIssues = 0;

	for (const section of subtaskSections) {
		const sectionEnd = section.indexOf("**Subtask") !== -1
			? section.indexOf("**Subtask")
			: section.indexOf("### Task") !== -1
				? section.indexOf("### Task")
				: section.length;
		const subtaskContent = section.slice(0, sectionEnd);

		// Check for required subtask sections
		const hasPrerequisites = subtaskContent.includes("**Prerequisites**");
		const hasDeliverables = subtaskContent.includes("**Deliverables**");
		const hasSuccessCriteria = subtaskContent.includes("**Success Criteria**");
		const hasCompletionNotes = subtaskContent.includes("**Completion Notes**");

		if (!hasPrerequisites || !hasDeliverables || !hasSuccessCriteria || !hasCompletionNotes) {
			subtasksWithIssues++;
		}

		// Check deliverables count (should be 3-7)
		const deliverableMatches = subtaskContent.match(/- \[[ x]\] /g);
		const deliverableCount = deliverableMatches?.length || 0;
		if (deliverableCount > 0 && (deliverableCount < 3 || deliverableCount > 7)) {
			// Only warn, don't error - some subtasks may legitimately have fewer/more
			if (deliverableCount < 3) {
				warnings.push(`A subtask has only ${deliverableCount} deliverables (recommended: 3-7)`);
			}
		}
	}

	if (subtasksWithIssues > 0) {
		warnings.push(`${subtasksWithIssues} subtask(s) missing required sections (Prerequisites, Deliverables, Success Criteria, or Completion Notes)`);
	}

	// Check for Task Complete sections (squash merge checklists)
	const taskCompleteMatches = content.match(/Task.*Complete.*Squash/gi);
	if (taskCount > 0 && (!taskCompleteMatches || taskCompleteMatches.length < taskCount)) {
		const missing = taskCount - (taskCompleteMatches?.length || 0);
		warnings.push(`${missing} task(s) missing "Task Complete - Squash Merge" section`);
	}

	// Validate prerequisite references
	const prereqPattern = /\[x\] (\d+\.\d+\.\d+)/g;
	const allSubtaskIds = new Set<string>();
	const subtaskIdMatches = content.matchAll(/\*\*Subtask (\d+\.\d+\.\d+)/g);
	for (const match of subtaskIdMatches) {
		allSubtaskIds.add(match[1]);
	}

	const prereqMatches = content.matchAll(prereqPattern);
	for (const match of prereqMatches) {
		const prereqId = match[1];
		if (!allSubtaskIds.has(prereqId) && prereqId !== "0.0.0") {
			warnings.push(`Prerequisite references non-existent subtask: ${prereqId}`);
		}
	}

	// Suggestions
	if (!content.includes("Git Workflow")) {
		suggestions.push("Consider adding a Git Workflow section");
	}

	if (!content.includes("Progress Tracking")) {
		suggestions.push("Consider adding a Progress Tracking section");
	}

	if (!content.includes("How to Use This Plan")) {
		suggestions.push("Consider adding a 'How to Use This Plan' section at the top");
	}

	// Check for code blocks with language tags
	const codeBlocksTotal = (content.match(/```/g) || []).length / 2;
	const codeBlocksWithLang = (content.match(/```[a-z]+/g) || []).length;
	if (codeBlocksTotal > 0 && codeBlocksWithLang < codeBlocksTotal * 0.8) {
		suggestions.push("Some code blocks are missing language tags for syntax highlighting");
	}

	const valid = strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0;

	return {
		valid,
		errors,
		warnings,
		suggestions,
		stats: {
			phases: phaseCount,
			tasks: taskCount,
			subtasks: subtaskCount,
			completedSubtasks: completedCount,
			percentComplete,
		}
	};
}

/**
 * Generate a progress summary from a development plan.
 * Returns statistics and the next actionable subtask.
 */
export function generateProgressSummary(planContent: string): {
	stats: {
		phases: number;
		tasks: number;
		subtasks: number;
		completedSubtasks: number;
		percentComplete: number;
	};
	phaseProgress: Array<{
		id: string;
		title: string;
		completed: number;
		total: number;
		percentComplete: number;
	}>;
	nextSubtask: {
		id: string;
		title: string;
		task: string;
		phase: string;
	} | null;
	recentlyCompleted: Array<{
		id: string;
		title: string;
	}>;
} {
	const validation = validatePlan(planContent, false);

	// Parse phase progress
	const phaseProgress: Array<{
		id: string;
		title: string;
		completed: number;
		total: number;
		percentComplete: number;
	}> = [];

	// Match phase headers and their subtasks
	const phasePattern = /##+ Phase (\d+):?\s*([^\n]+)/g;
	const phaseMatches = [...planContent.matchAll(phasePattern)];

	for (let i = 0; i < phaseMatches.length; i++) {
		const phaseMatch = phaseMatches[i];
		const phaseId = phaseMatch[1];
		const phaseTitle = phaseMatch[2].trim();
		const phaseStart = phaseMatch.index || 0;
		const phaseEnd = i < phaseMatches.length - 1 ? (phaseMatches[i + 1].index || planContent.length) : planContent.length;
		const phaseContent = planContent.slice(phaseStart, phaseEnd);

		// Count subtasks in this phase
		const totalInPhase = (phaseContent.match(/- \[[ x]\] \d+\.\d+\.\d+/g) || []).length;
		const completedInPhase = (phaseContent.match(/- \[x\] \d+\.\d+\.\d+/gi) || []).length;

		phaseProgress.push({
			id: phaseId,
			title: phaseTitle,
			completed: completedInPhase,
			total: totalInPhase,
			percentComplete: totalInPhase > 0 ? Math.round((completedInPhase / totalInPhase) * 100) : 0,
		});
	}

	// Find next actionable subtask (first unchecked with completed prerequisites)
	let nextSubtask: { id: string; title: string; task: string; phase: string } | null = null;

	// Get all subtask checkboxes in order
	const subtaskCheckboxPattern = /- \[( |x)\] (\d+)\.(\d+)\.(\d+):?\s*([^\n]+)/gi;
	const allSubtasks = [...planContent.matchAll(subtaskCheckboxPattern)];
	const completedIds = new Set<string>();

	for (const match of allSubtasks) {
		const isComplete = match[1].toLowerCase() === 'x';
		const id = `${match[2]}.${match[3]}.${match[4]}`;

		if (isComplete) {
			completedIds.add(id);
		}
	}

	// Find first incomplete subtask
	for (const match of allSubtasks) {
		const isComplete = match[1].toLowerCase() === 'x';
		if (isComplete) continue;

		const phase = match[2];
		const task = `${match[2]}.${match[3]}`;
		const id = `${match[2]}.${match[3]}.${match[4]}`;
		const title = match[5].trim();

		// Check if this subtask's prerequisites are complete
		// Look for the subtask section and extract prerequisites
		const subtaskHeaderPattern = new RegExp(`\\*\\*Subtask ${id.replace(/\./g, '\\.')}[^*]*\\*\\*Prerequisites\\*\\*:\\s*([^*]+)`, 's');
		const prereqMatch = planContent.match(subtaskHeaderPattern);

		let prerequisitesMet = true;
		if (prereqMatch) {
			const prereqSection = prereqMatch[1];
			const prereqIds = [...prereqSection.matchAll(/\[x\] (\d+\.\d+\.\d+)/g)];
			for (const prereq of prereqIds) {
				if (!completedIds.has(prereq[1])) {
					prerequisitesMet = false;
					break;
				}
			}
		}

		// First subtask (0.1.1) has no prerequisites
		if (id === '0.1.1' || prerequisitesMet) {
			nextSubtask = { id, title, task, phase };
			break;
		}
	}

	// Get recently completed (last 3)
	const recentlyCompleted: Array<{ id: string; title: string }> = [];
	const completedSubtasks = allSubtasks.filter(m => m[1].toLowerCase() === 'x');
	const recent = completedSubtasks.slice(-3).reverse();
	for (const match of recent) {
		recentlyCompleted.push({
			id: `${match[2]}.${match[3]}.${match[4]}`,
			title: match[5].trim(),
		});
	}

	return {
		stats: validation.stats,
		phaseProgress,
		nextSubtask,
		recentlyCompleted,
	};
}

export function getSubtask(
	planContent: string,
	subtaskId: string
): { found: boolean; subtask?: { id: string; title: string; phase: string; task: string } } {
	// Simple parser - looks for subtask pattern X.Y.Z
	const regex = new RegExp(`(\\d+)\\.(\\d+)\\.${subtaskId.split(".")[2]}[:\\s]+(.+)`, "g");
	const match = regex.exec(planContent);

	if (match) {
		return {
			found: true,
			subtask: {
				id: subtaskId,
				title: match[3]?.trim() || "Unknown",
				phase: match[1] || "0",
				task: `${match[1]}.${match[2]}`,
			},
		};
	}

	return { found: false };
}

export function updateProgress(
	planContent: string,
	subtaskId: string,
	completionNotes: string
): string {
	// Add completion marker to subtask
	const timestamp = new Date().toISOString().split("T")[0];
	const marker = `[COMPLETED ${timestamp}] ${completionNotes}`;

	// Find and update the subtask line
	const lines = planContent.split("\n");
	const updatedLines = lines.map((line) => {
		if (line.includes(subtaskId) && !line.includes("[COMPLETED")) {
			return `${line} ${marker}`;
		}
		return line;
	});

	return updatedLines.join("\n");
}

/**
 * Generate an executor agent file for the project.
 * The executor agent is a specialized Haiku-powered agent that executes subtasks
 * with full context of the project's planning documents.
 */
export function generateExecutorAgent(
	briefContent: string,
	language: string = "python"
): { content: string; filePath: string } {
	const brief = parseBrief(briefContent);
	const projectSlug = brief.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const projectUnderscore = brief.projectName.toLowerCase().replace(/-/g, "_");
	const isPython = language === "python";

	const filePath = `.claude/agents/${projectSlug}-executor.md`;

	const content = `---
name: ${projectSlug}-executor
description: >
  PROACTIVELY use this agent to execute ${brief.projectName} development subtasks.
  Expert at DEVELOPMENT_PLAN.md execution with cross-checking, git
  discipline, and verification. Invoke with "execute subtask X.Y.Z" to
  complete a subtask entirely in one session.
tools: Read, Write, Edit, Bash, Glob, Grep
model: haiku
---

# ${brief.projectName} Development Plan Executor

## Purpose

Execute development subtasks for **${brief.projectName}** with mechanical precision. Each subtask in the DEVELOPMENT_PLAN.md contains complete, copy-pasteable code that can be implemented without creative inference.

## Project Context

**Project**: ${brief.projectName}
**Type**: ${brief.projectType}
**Goal**: ${brief.primaryGoal}
**Target Users**: ${brief.targetUsers}

**Tech Stack**:
${isPython ? `- Language: Python 3.11+
- CLI Framework: Click
- Testing: pytest + pytest-cov
- Linting: ruff
- Type Checking: mypy` : `- Language: TypeScript
- Testing: Jest/Vitest
- Linting: ESLint + Prettier
- Type Checking: TypeScript strict mode`}

**Directory Structure**:
\`\`\`
${brief.projectName}/
├── ${projectUnderscore}/           # Main package
│   ├── __init__.py
│   ├── cli.py              # CLI commands
│   └── ...                 # Feature modules
├── tests/
│   └── test_*.py           # Test modules
├── PROJECT_BRIEF.md        # Requirements
├── DEVELOPMENT_PLAN.md     # This plan
└── CLAUDE.md               # Development rules
\`\`\`

## Haiku-Executable Expectations

Each subtask in the DEVELOPMENT_PLAN.md contains:
- **Complete code blocks** - Copy-pasteable, not pseudocode
- **Explicit file paths** - Exact locations for all files
- **Full imports** - All required imports listed
- **Type hints** - Complete function signatures
- **Verification commands** - Specific commands with expected outputs

## Mandatory Initialization Sequence

Before executing ANY subtask:

1. **Read core documents**:
   - Read CLAUDE.md completely
   - Read DEVELOPMENT_PLAN.md completely
   - Read PROJECT_BRIEF.md for context

2. **Parse the subtask ID** from the prompt (format: X.Y.Z)

3. **Verify prerequisites**:
   - Check that all prerequisite subtasks are marked \`[x]\` complete
   - Read completion notes from prerequisites for context
   - If prerequisites incomplete, STOP and report

4. **Check git state**:
   - Verify correct branch for the TASK (not subtask)
   - Create branch if starting a new task: \`feature/{phase}-{task}-{description}\`

## Execution Protocol

For each subtask:

### 1. Cross-Check Before Writing
- Read existing files that will be modified
- Understand current code patterns
- Verify no conflicts with existing code

### 2. Implement Deliverables
- Complete each deliverable checkbox in order
- Use exact code from DEVELOPMENT_PLAN.md when provided
- Match established patterns in the codebase
- Add type hints to all functions

### 3. Write Tests
- Create tests for all new functions/classes
- Target ${isPython ? "100%" : "high"} coverage on new code
- Test success cases, failures, and edge cases

### 4. Run Verification
\`\`\`bash
${isPython ? `# Linting
ruff check ${projectUnderscore} tests

# Type checking
mypy ${projectUnderscore}

# Tests with coverage
pytest tests/ -v --cov=${projectUnderscore} --cov-report=term-missing` : `# Linting
npm run lint

# Type checking
npm run typecheck

# Tests
npm test`}
\`\`\`

### 5. Update Documentation
- Mark all deliverable checkboxes \`[x]\` complete
- Fill in Completion Notes template with:
  - Implementation summary
  - Files created (with line counts)
  - Files modified
  - Test results and coverage
  - Build verification results

### 6. Commit
\`\`\`bash
git add .
git commit -m "feat(scope): description

- Bullet points of changes
- Test coverage: X%"
\`\`\`

### 7. Merge (if task complete)
When ALL subtasks in a task are done:
\`\`\`bash
git checkout main
git merge --squash feature/{branch-name}
git commit -m "feat: complete task X.Y - description"
git branch -d feature/{branch-name}
\`\`\`

## Git Discipline

**CRITICAL**: Branching is at the TASK level, not subtask level.

- **One branch per TASK** (e.g., \`feature/0-1-repository-setup\`)
- **One commit per SUBTASK** within the task branch
- **Squash merge** when task completes (all subtasks done)
- **Delete branch** after merge

Branch naming: \`feature/{phase}-{task}-{short-description}\`

## Error Handling

If blocked:
1. Do NOT commit broken code
2. Document in DEVELOPMENT_PLAN.md:
   \`\`\`markdown
   **Completion Notes**:
   - **Status**: ❌ BLOCKED
   - **Error**: [Detailed error message]
   - **Attempted**: [What was tried]
   - **Root Cause**: [Analysis]
   - **Suggested Fix**: [What should be done]
   \`\`\`
3. Report immediately to user

## Invocation

To execute a subtask, use:
\`\`\`
Use the ${projectSlug}-executor agent to execute subtask X.Y.Z
\`\`\`

The agent will:
1. Read all planning documents
2. Verify prerequisites
3. Implement the subtask completely
4. Run verification
5. Commit changes
6. Report completion

---

*Generated by DevPlan MCP Server*
`;

	return { content, filePath };
}

/**
 * Generate a verifier agent file for validating completed applications.
 * Uses Sonnet for deeper analytical capabilities to "try to break" the app.
 */
export function generateVerifierAgent(
	briefContent: string,
	language: string = "python"
): { content: string; filePath: string } {
	const brief = parseBrief(briefContent);
	const projectSlug = brief.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const isPython = language === "python";

	const filePath = `.claude/agents/${projectSlug}-verifier.md`;

	const content = `---
name: ${projectSlug}-verifier
description: >
  Use this agent to validate the completed ${brief.projectName} application against
  PROJECT_BRIEF.md requirements. Performs smoke tests, feature verification,
  edge case testing, and generates a comprehensive verification report.
tools: Read, Bash, Glob, Grep
model: sonnet
---

# ${brief.projectName} Verification Agent

## Purpose

Validate the completed **${brief.projectName}** application using critical analysis. Unlike the executor agent that checks off deliverables, this agent tries to **break the application** and find gaps between requirements and implementation.

## Project Context

**Project**: ${brief.projectName}
**Type**: ${brief.projectType}
**Goal**: ${brief.primaryGoal}
**Target Users**: ${brief.targetUsers}

## Verification Philosophy

| Executor Agent | Verifier Agent |
|----------------|----------------|
| Haiku model | Sonnet model |
| "Check off deliverables" | "Try to break it" |
| Follows DEVELOPMENT_PLAN.md | Validates against PROJECT_BRIEF.md |
| Outputs code + commits | Outputs verification report |

## Mandatory Initialization

Before ANY verification:

1. **Read PROJECT_BRIEF.md** completely - this is your source of truth
2. **Read CLAUDE.md** for project conventions
3. **Understand the MVP features** - these are what you verify
4. **Note constraints** - Must Use / Cannot Use technologies

## Verification Checklist

### 1. Smoke Tests
- [ ] Application starts without errors
- [ ] Basic commands respond correctly
- [ ] No crashes on standard input
- [ ] Help/version flags work (if CLI)

\`\`\`bash
${isPython ? `# Example smoke tests for Python CLI
${projectSlug} --version
${projectSlug} --help
echo "test input" | ${projectSlug}` : `# Example smoke tests for Node.js
npm start
npm run --help`}
\`\`\`

### 2. Feature Verification
For EACH feature in PROJECT_BRIEF.md:
- [ ] Feature exists and is accessible
- [ ] Feature works as specified
- [ ] Output matches expected format
- [ ] Feature handles typical use cases

### 3. Edge Case Testing
Test boundary conditions the plan may have missed:
- [ ] Empty input handling
- [ ] Extremely large input
- [ ] Invalid/malformed input
- [ ] Missing required arguments
- [ ] Invalid file paths (if applicable)
- [ ] Network failures (if applicable)
- [ ] Permission errors (if applicable)

### 4. Error Handling
- [ ] Errors produce helpful messages (not stack traces)
- [ ] Invalid input is rejected gracefully
- [ ] Application recovers from non-fatal errors
- [ ] Exit codes are appropriate (0 success, non-zero failure)

### 5. Non-Functional Requirements
- [ ] Performance: Reasonable response time
- [ ] Security: No obvious vulnerabilities (injection, path traversal, etc.)
- [ ] Documentation: README exists with usage instructions
- [ ] Tests: Test suite exists and passes

\`\`\`bash
${isPython ? `# Run full test suite
pytest tests/ -v --cov --cov-report=term-missing

# Check linting
ruff check .

# Check types
mypy ${projectSlug.replace(/-/g, "_")}` : `# Run full test suite
npm test

# Check linting
npm run lint

# Check types
npm run typecheck`}
\`\`\`

## Verification Report Template

After verification, produce this report:

\`\`\`markdown
# Verification Report: ${brief.projectName}

## Summary
- **Status**: PASS / PARTIAL / FAIL
- **Features Verified**: X/Y
- **Critical Issues**: N
- **Warnings**: M
- **Verification Date**: YYYY-MM-DD

## Smoke Tests
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| App starts | No errors | ... | ✅/❌ |
| --help flag | Shows usage | ... | ✅/❌ |
| --version flag | Shows version | ... | ✅/❌ |

## Feature Verification

### Feature: [Name from PROJECT_BRIEF.md]
- **Status**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL
- **Test**: [What was tested]
- **Expected**: [What should happen]
- **Actual**: [What happened]
- **Notes**: [Observations]

(Repeat for each MVP feature)

## Edge Case Testing
| Test Case | Input | Expected | Actual | Status |
|-----------|-------|----------|--------|--------|
| Empty input | "" | Error message | ... | ✅/❌ |
| Invalid input | "xyz" | Error message | ... | ✅/❌ |
| Large input | 10MB file | Handles gracefully | ... | ✅/❌ |

## Error Handling
| Scenario | Expected Behavior | Actual | Status |
|----------|-------------------|--------|--------|
| Missing args | Helpful error | ... | ✅/❌ |
| Invalid file | File not found msg | ... | ✅/❌ |

## Issues Found

### Critical (Must Fix Before Release)
1. [Issue description + reproduction steps]

### Warnings (Should Fix)
1. [Issue description]

### Observations (Nice to Have)
1. [Suggestion]

## Test Coverage
- **Lines**: X%
- **Branches**: Y%
- **Functions**: Z%

## Recommendations
1. [Priority recommendation]
2. [Secondary recommendation]

---
*Verified by ${projectSlug}-verifier agent*
\`\`\`

## Issue Resolution Workflow

After generating the report:

1. **Critical issues**: Must be fixed before deployment
   - Report to user immediately
   - Use standard Claude conversation for fixes

2. **Warnings**: Should be addressed before release
   - Can be batched for fixing

3. **Observations**: Nice-to-have improvements
   - Add to backlog or nice-to-have features

## Re-verification

After fixes are applied:
- Re-run verification on affected areas
- If extensive changes, run full verification
- Update report with new status

## Capture Lessons Learned

**IMPORTANT**: After completing verification, capture valuable lessons to improve future projects.

### When to Capture a Lesson

Capture a lesson when you find an issue that:
- Could have been prevented with better planning
- Is likely to recur in similar projects
- Reveals a pattern that should be documented

**Skip** one-off issues, typos, or project-specific edge cases.

### How to Capture Lessons

**Option 1: Automatic Extraction**
\`\`\`
Use devplan_extract_lessons_from_report with the verification report to automatically identify potential lessons
\`\`\`

**Option 2: Manual Capture**
For each valuable issue found, call \`devplan_add_lesson\` with:
\`\`\`json
{
  "issue": "What went wrong",
  "root_cause": "Why it happened (the underlying cause)",
  "fix": "How to prevent it (actionable guidance)",
  "pattern": "Short identifier (e.g., 'Missing empty input validation')",
  "project_types": ["${brief.projectType || "cli"}"],
  "severity": "critical|warning|info"
}
\`\`\`

### Severity Guide

| Severity | Use When |
|----------|----------|
| **critical** | Security issues, data loss, crashes |
| **warning** | Functionality gaps, poor UX, missing validation |
| **info** | Performance tips, best practices, nice-to-haves |

### Example Lesson

From verification finding: "App crashes on empty input"
\`\`\`json
{
  "issue": "Application crashes with unhandled exception when given empty input",
  "root_cause": "No input validation before processing - assumed non-empty input",
  "fix": "Always validate input at entry points: check for empty/null and return helpful error",
  "pattern": "Missing empty input validation",
  "project_types": ["cli", "api"],
  "severity": "critical"
}
\`\`\`

This lesson will automatically appear in future plans as a safeguard.

## Invocation

To verify the completed application:
\`\`\`
Use the ${projectSlug}-verifier agent to validate the application against PROJECT_BRIEF.md
\`\`\`

The agent will:
1. Read PROJECT_BRIEF.md for requirements
2. Run smoke tests
3. Verify each MVP feature
4. Test edge cases
5. Check error handling
6. Generate verification report
7. **Capture lessons learned** for issues that should be prevented in future projects

---

*Generated by DevPlan MCP Server*
`;

	return { content, filePath };
}

// ============================================================================
// LESSONS LEARNED SYSTEM
// ============================================================================

/**
 * Represents a lesson learned from verifier feedback.
 * These lessons are stored in KV and used to improve future plan generation.
 */
export interface Lesson {
	id: string;
	issue: string;           // What went wrong
	rootCause: string;       // Why it happened
	fix: string;             // How it was fixed
	pattern: string;         // Pattern to watch for
	projectTypes: string[];  // Which project types this applies to (e.g., ["cli", "api"])
	severity: "critical" | "warning" | "info";
	createdAt: string;       // ISO date string
}

/**
 * Generate a unique lesson ID.
 */
export function generateLessonId(): string {
	return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a lesson for display.
 */
export function formatLesson(lesson: Lesson): string {
	const severityIcon = lesson.severity === "critical" ? "🔴" : lesson.severity === "warning" ? "🟡" : "🔵";
	return `${severityIcon} **${lesson.pattern}**
- **Issue**: ${lesson.issue}
- **Root Cause**: ${lesson.rootCause}
- **Fix**: ${lesson.fix}
- **Applies to**: ${lesson.projectTypes.join(", ") || "all"}
- **Added**: ${lesson.createdAt}`;
}

/**
 * Filter lessons relevant to a specific project type.
 */
export function filterLessonsForProject(lessons: Lesson[], projectType: string): Lesson[] {
	const normalizedType = projectType.toLowerCase().replace(/[\s-]/g, "_");
	return lessons.filter(lesson =>
		lesson.projectTypes.length === 0 || // Empty means applies to all
		lesson.projectTypes.some(t => t.toLowerCase().replace(/[\s-]/g, "_") === normalizedType)
	);
}

/**
 * Generate a "lessons learned" safeguards section for a development plan.
 * This is included in generatePlan() when relevant lessons exist.
 */
export function generateLessonsSafeguards(lessons: Lesson[], projectType: string): string {
	const relevantLessons = filterLessonsForProject(lessons, projectType);

	if (relevantLessons.length === 0) {
		return "";
	}

	// Group by severity
	const critical = relevantLessons.filter(l => l.severity === "critical");
	const warnings = relevantLessons.filter(l => l.severity === "warning");
	const info = relevantLessons.filter(l => l.severity === "info");

	const sections: string[] = [];

	sections.push(`## ⚠️ Lessons Learned Safeguards

Based on previous project experiences, pay special attention to these patterns:
`);

	if (critical.length > 0) {
		sections.push(`### 🔴 Critical (Must Address)
${critical.map(l => `- **${l.pattern}**: ${l.fix}`).join("\n")}
`);
	}

	if (warnings.length > 0) {
		sections.push(`### 🟡 Warnings (Should Address)
${warnings.map(l => `- **${l.pattern}**: ${l.fix}`).join("\n")}
`);
	}

	if (info.length > 0) {
		sections.push(`### 🔵 Tips (Consider)
${info.map(l => `- **${l.pattern}**: ${l.fix}`).join("\n")}
`);
	}

	return sections.join("\n");
}

/**
 * Keywords that indicate what type of functionality a subtask involves.
 * Used to match lessons to relevant subtasks.
 */
const SUBTASK_KEYWORDS: Record<string, string[]> = {
	input: ["input", "parse", "read", "argument", "param", "flag", "option", "cli", "command"],
	file: ["file", "path", "read", "write", "load", "save", "export", "import", "directory", "folder"],
	validation: ["valid", "check", "verify", "sanitize", "clean", "format"],
	error: ["error", "exception", "fail", "crash", "handle", "catch", "try"],
	api: ["api", "endpoint", "request", "response", "http", "rest", "fetch", "call"],
	auth: ["auth", "login", "password", "token", "session", "permission", "access"],
	database: ["database", "db", "sql", "query", "model", "schema", "migrate"],
	test: ["test", "spec", "coverage", "mock", "stub", "fixture"],
	config: ["config", "setting", "option", "env", "environment"],
	output: ["output", "print", "display", "render", "format", "template"],
};

/**
 * Pattern keywords that indicate what type of issue a lesson addresses.
 */
const LESSON_PATTERN_KEYWORDS: Record<string, string[]> = {
	input: ["input", "empty", "null", "argument", "parameter", "missing"],
	file: ["file", "path", "directory", "not found", "permission", "access"],
	validation: ["valid", "invalid", "format", "type", "range", "boundary"],
	error: ["error", "exception", "crash", "handle", "unhandled", "graceful"],
	api: ["api", "endpoint", "request", "response", "timeout", "retry"],
	auth: ["auth", "password", "token", "session", "permission", "unauthorized"],
	database: ["database", "query", "connection", "transaction", "migration"],
	test: ["test", "coverage", "mock", "assertion"],
	config: ["config", "environment", "setting", "default"],
	output: ["output", "format", "encoding", "unicode", "display"],
};

/**
 * Determine the categories a subtask belongs to based on its content.
 */
export function categorizeSubtask(title: string, deliverables: string[]): string[] {
	const content = [title, ...deliverables].join(" ").toLowerCase();
	const categories: string[] = [];

	for (const [category, keywords] of Object.entries(SUBTASK_KEYWORDS)) {
		if (keywords.some(kw => content.includes(kw))) {
			categories.push(category);
		}
	}

	return categories;
}

/**
 * Determine the categories a lesson belongs to based on its pattern and issue.
 */
export function categorizeLesson(lesson: Lesson): string[] {
	const content = [lesson.pattern, lesson.issue, lesson.fix].join(" ").toLowerCase();
	const categories: string[] = [];

	for (const [category, keywords] of Object.entries(LESSON_PATTERN_KEYWORDS)) {
		if (keywords.some(kw => content.includes(kw))) {
			categories.push(category);
		}
	}

	return categories;
}

/**
 * Find lessons that are relevant to a specific subtask.
 * Returns lessons whose categories overlap with the subtask's categories.
 */
export function findRelevantLessons(
	subtaskTitle: string,
	subtaskDeliverables: string[],
	lessons: Lesson[],
	projectType: string
): Lesson[] {
	const filteredLessons = filterLessonsForProject(lessons, projectType);
	const subtaskCategories = categorizeSubtask(subtaskTitle, subtaskDeliverables);

	if (subtaskCategories.length === 0) {
		return [];
	}

	return filteredLessons.filter(lesson => {
		const lessonCategories = categorizeLesson(lesson);
		// Check if any category overlaps
		return lessonCategories.some(cat => subtaskCategories.includes(cat));
	});
}

/**
 * Generate additional success criteria for a subtask based on relevant lessons.
 * Returns an array of success criteria strings to be added to the subtask.
 */
export function generateLessonSuccessCriteria(lessons: Lesson[]): string[] {
	const criteria: string[] = [];
	const seenFixes = new Set<string>();

	// Prioritize by severity
	const sorted = [...lessons].sort((a, b) => {
		const order = { critical: 0, warning: 1, info: 2 };
		return order[a.severity] - order[b.severity];
	});

	for (const lesson of sorted) {
		// Normalize the fix to avoid near-duplicates
		const normalizedFix = lesson.fix.toLowerCase().trim();
		if (seenFixes.has(normalizedFix)) continue;
		seenFixes.add(normalizedFix);

		// Convert fix to a testable success criterion
		const severityPrefix = lesson.severity === "critical" ? "🔴 " : lesson.severity === "warning" ? "🟡 " : "";
		const criterion = `${severityPrefix}${lesson.fix} (from lesson: ${lesson.pattern})`;
		criteria.push(criterion);
	}

	// Limit to avoid overwhelming the subtask
	return criteria.slice(0, 3);
}
