/**
 * README Mermaid Diagram Generation for DevPlan MCP Server.
 * Generates project-appropriate Mermaid diagrams from ProjectBrief data
 * to be included in generated development plans for richer README documentation.
 */

import type { ProjectBrief } from "./models";

/**
 * Collection of Mermaid diagrams generated for a project's README.
 */
export interface ReadmeDiagrams {
	/** Component/architecture overview diagram */
	architecture?: string;
	/** Data flow diagram showing external system interactions */
	dataFlow?: string;
	/** CLI command structure (CLI projects only) */
	commandTree?: string;
	/** API endpoint map (API projects only) */
	endpoints?: string;
	/** Page/component structure (web_app projects only) */
	pageFlow?: string;
	/** Module overview (library projects only) */
	moduleStructure?: string;
}

/**
 * Escape special characters for Mermaid node labels.
 */
function escapeLabel(text: string): string {
	return text
		.replace(/"/g, "'")
		.replace(/[[\]]/g, "")
		.replace(/[()]/g, "")
		.replace(/[<>]/g, "")
		.replace(/[{}]/g, "");
}

/**
 * Convert a feature string to a valid Mermaid node ID.
 */
function toNodeId(text: string, prefix: string = ""): string {
	const id = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 20);
	return prefix ? `${prefix}_${id}` : id;
}

/**
 * Extract command names from CLI features.
 * Looks for patterns like "convert command", "validate files", etc.
 */
function extractCliCommands(features: string[]): string[] {
	const commands: string[] = [];
	const commandPatterns = [
		/^(\w+)\s+command/i,
		/^(\w+)\s+files?/i,
		/^(\w+)\s+(?:markdown|pdf|json|yaml|csv|xml)/i,
		/^run\s+(\w+)/i,
		/^(\w+)\s+output/i,
		/^(\w+)\s+config/i,
		/^(\w+)\s+(?:mode|option)/i,
	];

	for (const feature of features) {
		for (const pattern of commandPatterns) {
			const match = feature.match(pattern);
			if (match) {
				commands.push(match[1].toLowerCase());
				break;
			}
		}
	}

	// If no commands found, derive from feature descriptions
	if (commands.length === 0) {
		for (const feature of features.slice(0, 4)) {
			const words = feature.toLowerCase().split(/\s+/);
			const verb = words.find((w) =>
				["convert", "parse", "generate", "validate", "export", "import", "process", "transform", "analyze", "build"].includes(w)
			);
			if (verb && !commands.includes(verb)) {
				commands.push(verb);
			}
		}
	}

	// Ensure at least some default commands
	if (commands.length === 0) {
		commands.push("run", "config");
	}

	return [...new Set(commands)].slice(0, 5);
}

/**
 * Extract API endpoints from feature descriptions.
 */
function extractApiEndpoints(features: string[]): Array<{ method: string; path: string; description: string }> {
	const endpoints: Array<{ method: string; path: string; description: string }> = [];
	const resourcePatterns = [
		/(?:list|get|fetch|retrieve)\s+(\w+)/i,
		/(?:create|add|new)\s+(\w+)/i,
		/(?:update|modify|edit)\s+(\w+)/i,
		/(?:delete|remove)\s+(\w+)/i,
		/(\w+)\s+(?:endpoint|api|route)/i,
		/(\w+)\s+(?:crud|operations?)/i,
	];

	const resources = new Set<string>();
	for (const feature of features) {
		for (const pattern of resourcePatterns) {
			const match = feature.match(pattern);
			if (match) {
				const resource = match[1].toLowerCase();
				if (!["the", "a", "an", "all", "new", "data"].includes(resource)) {
					resources.add(resource);
				}
			}
		}
	}

	// Generate CRUD endpoints for each resource
	for (const resource of resources) {
		const plural = resource.endsWith("s") ? resource : `${resource}s`;
		endpoints.push(
			{ method: "GET", path: `/${plural}`, description: `List ${plural}` },
			{ method: "POST", path: `/${plural}`, description: `Create ${resource}` },
			{ method: "GET", path: `/${plural}/:id`, description: `Get ${resource}` },
			{ method: "PUT", path: `/${plural}/:id`, description: `Update ${resource}` },
			{ method: "DELETE", path: `/${plural}/:id`, description: `Delete ${resource}` }
		);
	}

	// If no resources found, add health endpoint
	if (endpoints.length === 0) {
		endpoints.push({ method: "GET", path: "/health", description: "Health check" });
	}

	return endpoints.slice(0, 15);
}

/**
 * Extract page/component names from web app features.
 */
function extractWebPages(features: string[]): string[] {
	const pages: string[] = [];
	const pagePatterns = [
		/(\w+)\s+page/i,
		/(\w+)\s+(?:screen|view|component)/i,
		/(?:display|show|render)\s+(\w+)/i,
		/(\w+)\s+dashboard/i,
		/(\w+)\s+form/i,
		/(\w+)\s+list/i,
	];

	for (const feature of features) {
		for (const pattern of pagePatterns) {
			const match = feature.match(pattern);
			if (match) {
				const page = match[1].toLowerCase();
				if (!["the", "a", "an", "all", "user", "data"].includes(page) && !pages.includes(page)) {
					pages.push(page);
				}
			}
		}
	}

	// Default pages if none found
	if (pages.length === 0) {
		pages.push("home", "dashboard");
	}

	return pages.slice(0, 6);
}

/**
 * Extract module names from library features.
 */
function extractModules(features: string[], projectName: string): string[] {
	const modules: string[] = [];
	const modulePatterns = [
		/(\w+)\s+(?:module|class|function|utility)/i,
		/(?:provide|export|expose)\s+(\w+)/i,
		/(\w+)\s+(?:api|interface)/i,
		/(\w+)\s+(?:helper|util)/i,
	];

	for (const feature of features) {
		for (const pattern of modulePatterns) {
			const match = feature.match(pattern);
			if (match) {
				const mod = match[1].toLowerCase();
				if (!["the", "a", "an", "all", "main", "core"].includes(mod) && !modules.includes(mod)) {
					modules.push(mod);
				}
			}
		}
	}

	// Default modules based on common library structure
	if (modules.length === 0) {
		modules.push("core", "utils");
	}

	return modules.slice(0, 5);
}

/**
 * Generate an architecture overview diagram.
 * Adapts to project type to show relevant components.
 */
export function generateArchitectureDiagram(brief: ProjectBrief): string {
	const projectName = brief.projectName || "Project";
	const projectType = brief.projectType.toLowerCase();
	const lines: string[] = ["flowchart TD"];

	if (projectType === "cli") {
		// CLI architecture: Entry point -> Parser -> Commands -> Output
		const commands = extractCliCommands(brief.keyFeatures);

		lines.push(`    CLI["${escapeLabel(projectName)} CLI"]`);
		lines.push(`    CLI --> Parser[Argument Parser]`);
		lines.push(`    Parser --> Commands`);
		lines.push(`    subgraph Commands`);
		for (const cmd of commands) {
			const nodeId = toNodeId(cmd, "cmd");
			lines.push(`        ${nodeId}[${cmd} command]`);
		}
		lines.push(`    end`);
		lines.push(`    Commands --> Output[Output/Result]`);
	} else if (projectType === "api") {
		// API architecture: Client -> API -> Business Logic -> Database
		lines.push(`    Client[Client] --> API["${escapeLabel(projectName)} API"]`);
		lines.push(`    API --> Router[Router]`);
		lines.push(`    Router --> Controllers[Controllers]`);
		lines.push(`    Controllers --> Services[Business Logic]`);
		lines.push(`    Services --> Models[Data Models]`);
		lines.push(`    Models --> DB[(Database)]`);
	} else if (projectType === "web_app") {
		// Web app architecture: Browser -> Frontend -> API -> Backend
		const pages = extractWebPages(brief.keyFeatures);

		lines.push(`    Browser[Browser] --> Frontend["${escapeLabel(projectName)}"]`);
		lines.push(`    subgraph Frontend`);
		lines.push(`        Router[Router]`);
		for (const page of pages.slice(0, 4)) {
			const nodeId = toNodeId(page, "page");
			lines.push(`        ${nodeId}[${page} Page]`);
		}
		lines.push(`    end`);
		lines.push(`    Frontend --> API[API Layer]`);
		lines.push(`    API --> Backend[Backend Services]`);
		lines.push(`    Backend --> DB[(Database)]`);
	} else if (projectType === "library") {
		// Library architecture: User Code -> Public API -> Internal Modules
		const modules = extractModules(brief.keyFeatures, projectName);

		lines.push(`    UserCode[User Code] --> PubAPI["${escapeLabel(projectName)}"]`);
		lines.push(`    subgraph PubAPI[Public API]`);
		for (const mod of modules) {
			const nodeId = toNodeId(mod, "mod");
			lines.push(`        ${nodeId}[${mod}]`);
		}
		lines.push(`    end`);
		lines.push(`    PubAPI --> Internal[Internal Utilities]`);
	} else {
		// Generic architecture
		lines.push(`    Input[Input] --> Core["${escapeLabel(projectName)}"]`);
		lines.push(`    Core --> Processing[Processing]`);
		lines.push(`    Processing --> Output[Output]`);
	}

	return lines.join("\n");
}

/**
 * Generate a data flow diagram showing external system interactions.
 * Only generated if the project has external systems or data sources.
 */
export function generateDataFlowDiagram(brief: ProjectBrief): string | undefined {
	const hasExternalSystems = brief.externalSystems && brief.externalSystems.length > 0;
	const hasDataSources = brief.dataSources && brief.dataSources.length > 0;
	const hasDataDestinations = brief.dataDestinations && brief.dataDestinations.length > 0;

	// Check features for external integration keywords
	const featureLower = brief.keyFeatures.join(" ").toLowerCase();
	const hasExternalKeywords =
		featureLower.includes("api") ||
		featureLower.includes("webhook") ||
		featureLower.includes("external") ||
		featureLower.includes("integration") ||
		featureLower.includes("fetch") ||
		featureLower.includes("sync");

	if (!hasExternalSystems && !hasDataSources && !hasDataDestinations && !hasExternalKeywords) {
		return undefined;
	}

	const projectName = brief.projectName || "Project";
	const lines: string[] = ["flowchart LR"];

	// Add data sources
	if (hasDataSources && brief.dataSources) {
		lines.push(`    subgraph Sources[Data Sources]`);
		brief.dataSources.slice(0, 3).forEach((source, i) => {
			const name = typeof source === "object" ? (source.name || `Source ${i + 1}`) : String(source);
			lines.push(`        src${i}[("${escapeLabel(name)}")]`);
		});
		lines.push(`    end`);
		lines.push(`    Sources --> Core`);
	}

	// Core system
	lines.push(`    Core["${escapeLabel(projectName)}"]`);

	// Add external systems
	if (hasExternalSystems && brief.externalSystems) {
		lines.push(`    subgraph External[External Systems]`);
		brief.externalSystems.slice(0, 3).forEach((system, i) => {
			const name = typeof system === "object" ? (system.name || `System ${i + 1}`) : String(system);
			lines.push(`        ext${i}["${escapeLabel(name)}"]`);
		});
		lines.push(`    end`);
		lines.push(`    Core <--> External`);
	}

	// Add data destinations
	if (hasDataDestinations && brief.dataDestinations) {
		lines.push(`    subgraph Destinations[Data Destinations]`);
		brief.dataDestinations.slice(0, 3).forEach((dest, i) => {
			const name = typeof dest === "object" ? (dest.name || `Dest ${i + 1}`) : String(dest);
			lines.push(`        dest${i}[("${escapeLabel(name)}")]`);
		});
		lines.push(`    end`);
		lines.push(`    Core --> Destinations`);
	}

	// If only keywords detected, add generic external block
	if (!hasExternalSystems && !hasDataSources && !hasDataDestinations && hasExternalKeywords) {
		lines.push(`    External["External Services"]`);
		lines.push(`    Core <--> External`);
	}

	return lines.join("\n");
}

/**
 * Generate a CLI command tree diagram.
 * Shows the command structure with subcommands and common options.
 */
export function generateCliCommandTree(features: string[], projectName: string): string {
	const cliName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const commands = extractCliCommands(features);
	const lines: string[] = ["flowchart LR"];

	lines.push(`    CLI[${cliName}]`);

	for (const cmd of commands) {
		const nodeId = toNodeId(cmd, "cmd");
		lines.push(`    CLI --> ${nodeId}[${cmd}]`);

		// Add common options for certain command types
		if (["convert", "export", "generate", "build"].includes(cmd)) {
			lines.push(`    ${nodeId} --> ${nodeId}_out["--output"]`);
		}
		if (["convert", "parse", "process"].includes(cmd)) {
			lines.push(`    ${nodeId} --> ${nodeId}_in["--input"]`);
		}
		if (cmd === "config") {
			lines.push(`    ${nodeId} --> ${nodeId}_show["show"]`);
			lines.push(`    ${nodeId} --> ${nodeId}_set["set"]`);
		}
	}

	// Add global options
	lines.push(`    CLI --> help["--help"]`);
	lines.push(`    CLI --> version["--version"]`);

	return lines.join("\n");
}

/**
 * Generate an API endpoint diagram.
 * Shows available endpoints grouped by resource.
 */
export function generateApiEndpointDiagram(features: string[], projectName: string): string {
	const endpoints = extractApiEndpoints(features);
	const lines: string[] = ["flowchart TD"];

	lines.push(`    API["${escapeLabel(projectName)} API"]`);

	// Group endpoints by base path
	const groups = new Map<string, typeof endpoints>();
	for (const ep of endpoints) {
		const basePath = ep.path.split("/")[1] || "root";
		if (!groups.has(basePath)) {
			groups.set(basePath, []);
		}
		groups.get(basePath)!.push(ep);
	}

	// Create subgraphs for each resource group
	let groupIndex = 0;
	for (const [basePath, eps] of groups) {
		const groupId = toNodeId(basePath, "grp");
		lines.push(`    subgraph ${groupId}["/${basePath}"]`);
		for (const ep of eps.slice(0, 5)) {
			const epId = `ep${groupIndex++}`;
			const label = `${ep.method} ${ep.path}`;
			lines.push(`        ${epId}["${escapeLabel(label)}"]`);
		}
		lines.push(`    end`);
		lines.push(`    API --> ${groupId}`);
	}

	return lines.join("\n");
}

/**
 * Generate a page flow diagram for web applications.
 * Shows navigation between pages/screens.
 */
export function generateWebPageFlowDiagram(features: string[], projectName: string): string {
	const pages = extractWebPages(features);
	const lines: string[] = ["flowchart TD"];

	lines.push(`    App["${escapeLabel(projectName)}"]`);

	// Create page nodes with common navigation patterns
	const homeNodeId = pages.includes("home") ? toNodeId("home", "page") : toNodeId(pages[0], "page");
	lines.push(`    App --> ${homeNodeId}["${pages.includes("home") ? "Home" : pages[0]} Page"]`);

	for (const page of pages) {
		if (page === "home" || page === pages[0]) continue;
		const nodeId = toNodeId(page, "page");
		lines.push(`    ${homeNodeId} --> ${nodeId}["${page} Page"]`);
	}

	// Add common navigation elements
	if (pages.length > 2) {
		lines.push(`    Nav[Navigation]`);
		lines.push(`    App --> Nav`);
		for (const page of pages.slice(0, 4)) {
			const nodeId = toNodeId(page, "page");
			lines.push(`    Nav --> ${nodeId}`);
		}
	}

	return lines.join("\n");
}

/**
 * Generate a module structure diagram for libraries.
 * Shows the public API and internal module organization.
 */
export function generateLibraryModuleDiagram(features: string[], projectName: string): string {
	const modules = extractModules(features, projectName);
	const lines: string[] = ["flowchart TD"];

	const pkgName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");

	lines.push(`    subgraph Package["${pkgName}"]`);
	lines.push(`        Init["__init__.py"]`);

	for (const mod of modules) {
		const nodeId = toNodeId(mod, "mod");
		lines.push(`        ${nodeId}["${mod}.py"]`);
		lines.push(`        Init --> ${nodeId}`);
	}

	lines.push(`    end`);

	// Add user code interaction
	lines.push(`    UserCode["User Code"]`);
	lines.push(`    UserCode --> Init`);

	return lines.join("\n");
}

/**
 * Generate all appropriate README diagrams for a project.
 * Selects diagram types based on project type and available data.
 *
 * @param brief - The project brief with features and metadata
 * @returns ReadmeDiagrams object with generated diagrams
 */
export function generateReadmeDiagrams(brief: ProjectBrief): ReadmeDiagrams {
	const diagrams: ReadmeDiagrams = {};
	const projectType = brief.projectType.toLowerCase();
	const projectName = brief.projectName || "Project";

	// Architecture diagram for all project types
	diagrams.architecture = generateArchitectureDiagram(brief);

	// Data flow diagram if external systems exist
	const dataFlow = generateDataFlowDiagram(brief);
	if (dataFlow) {
		diagrams.dataFlow = dataFlow;
	}

	// Project type-specific diagrams
	if (projectType === "cli") {
		diagrams.commandTree = generateCliCommandTree(brief.keyFeatures, projectName);
	} else if (projectType === "api") {
		diagrams.endpoints = generateApiEndpointDiagram(brief.keyFeatures, projectName);
	} else if (projectType === "web_app") {
		diagrams.pageFlow = generateWebPageFlowDiagram(brief.keyFeatures, projectName);
	} else if (projectType === "library") {
		diagrams.moduleStructure = generateLibraryModuleDiagram(brief.keyFeatures, projectName);
	}

	return diagrams;
}

/**
 * Format diagrams as markdown for inclusion in a development plan.
 * Creates a "Starter Mermaid Diagrams" section with all generated diagrams.
 *
 * @param diagrams - The ReadmeDiagrams object
 * @param projectType - The project type for labeling
 * @returns Formatted markdown string
 */
export function formatDiagramsAsMarkdown(diagrams: ReadmeDiagrams, projectType: string): string {
	const sections: string[] = [];

	if (diagrams.architecture) {
		sections.push(`**Architecture Overview:**
\`\`\`mermaid
${diagrams.architecture}
\`\`\``);
	}

	if (diagrams.commandTree && projectType.toLowerCase() === "cli") {
		sections.push(`**Command Structure:**
\`\`\`mermaid
${diagrams.commandTree}
\`\`\``);
	}

	if (diagrams.endpoints && projectType.toLowerCase() === "api") {
		sections.push(`**API Endpoints:**
\`\`\`mermaid
${diagrams.endpoints}
\`\`\``);
	}

	if (diagrams.pageFlow && projectType.toLowerCase() === "web_app") {
		sections.push(`**Page Flow:**
\`\`\`mermaid
${diagrams.pageFlow}
\`\`\``);
	}

	if (diagrams.moduleStructure && projectType.toLowerCase() === "library") {
		sections.push(`**Module Structure:**
\`\`\`mermaid
${diagrams.moduleStructure}
\`\`\``);
	}

	if (diagrams.dataFlow) {
		sections.push(`**Data Flow:**
\`\`\`mermaid
${diagrams.dataFlow}
\`\`\``);
	}

	if (sections.length === 0) {
		return "";
	}

	return `**Starter Mermaid Diagrams** (include these in README.md):

${sections.join("\n\n")}`;
}
