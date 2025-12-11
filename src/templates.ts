/**
 * Project templates and defaults for DevPlan MCP Server.
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
