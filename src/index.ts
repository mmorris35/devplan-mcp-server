import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

import {
	createBrief,
	generateClaudeMd,
	generatePlan,
	getSubtask,
	parseBrief,
	updateProgress,
	validatePlan,
} from "./generators";
import { INTERVIEW_QUESTIONS, listTemplates } from "./templates";

export class DevPlanMCP extends McpAgent {
	server = new McpServer({
		name: "DevPlan",
		version: "1.0.0",
	});

	async init() {
		// Tool 1: devplan_interview_questions
		this.server.tool(
			"devplan_interview_questions",
			{},
			async () => ({
				content: [
					{
						type: "text",
						text: JSON.stringify(INTERVIEW_QUESTIONS, null, 2),
					},
				],
			})
		);

		// Tool 2: devplan_create_brief
		this.server.tool(
			"devplan_create_brief",
			{
				name: z.string().describe("Project name"),
				project_type: z.string().describe("Project type: cli, web_app, api, or library"),
				goal: z.string().describe("One-sentence project description"),
				target_users: z.array(z.string()).describe("Target user types"),
				features: z.array(z.string()).describe("Must-have MVP features"),
				tech_stack: z
					.object({
						must_use: z.array(z.string()).optional(),
						cannot_use: z.array(z.string()).optional(),
					})
					.optional()
					.describe("Technology preferences"),
				timeline: z.string().optional().describe("Project timeline"),
				constraints: z.array(z.string()).optional().describe("Constraints/requirements"),
			},
			async ({ name, project_type, goal, target_users, features, tech_stack, timeline, constraints }) => {
				const brief = createBrief({
					name,
					projectType: project_type,
					goal,
					targetUsers: target_users,
					features,
					techStack: tech_stack
						? {
								mustUse: tech_stack.must_use,
								cannotUse: tech_stack.cannot_use,
							}
						: undefined,
					timeline,
					constraints,
				});
				return {
					content: [{ type: "text", text: brief }],
				};
			}
		);

		// Tool 3: devplan_parse_brief
		this.server.tool(
			"devplan_parse_brief",
			{
				content: z.string().describe("Full PROJECT_BRIEF.md content"),
				response_format: z.enum(["json", "markdown"]).default("json").describe("Output format"),
			},
			async ({ content, response_format }) => {
				const parsed = parseBrief(content);
				const output =
					response_format === "json"
						? JSON.stringify(parsed, null, 2)
						: `# Parsed Brief\n\n**Project**: ${parsed.projectName}\n**Type**: ${parsed.projectType}\n**Goal**: ${parsed.primaryGoal}`;
				return {
					content: [{ type: "text", text: output }],
				};
			}
		);

		// Tool 4: devplan_generate_plan
		this.server.tool(
			"devplan_generate_plan",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md or JSON brief"),
				template: z.string().optional().describe("Template override"),
			},
			async ({ brief_content }) => {
				const plan = generatePlan(brief_content);
				return {
					content: [{ type: "text", text: plan }],
				};
			}
		);

		// Tool 5: devplan_generate_claude_md
		this.server.tool(
			"devplan_generate_claude_md",
			{
				brief_content: z.string().describe("PROJECT_BRIEF.md or JSON brief"),
				language: z.string().default("python").describe("Primary language"),
				test_coverage: z.number().default(80).describe("Required coverage percentage"),
			},
			async ({ brief_content, language, test_coverage }) => {
				const claudeMd = generateClaudeMd(brief_content, language, test_coverage);
				return {
					content: [{ type: "text", text: claudeMd }],
				};
			}
		);

		// Tool 6: devplan_list_templates
		this.server.tool(
			"devplan_list_templates",
			{
				project_type: z.string().optional().describe("Filter by type"),
				response_format: z.enum(["json", "markdown"]).default("json").describe("Output format"),
			},
			async ({ project_type, response_format }) => {
				let templates = listTemplates();
				if (project_type) {
					templates = templates.filter((t) => t.type === project_type);
				}

				const output =
					response_format === "json"
						? JSON.stringify(templates, null, 2)
						: templates.map((t) => `- **${t.name}** (${t.type}): ${t.description}`).join("\n");

				return {
					content: [{ type: "text", text: output }],
				};
			}
		);

		// Tool 7: devplan_validate_plan
		this.server.tool(
			"devplan_validate_plan",
			{
				content: z.string().describe("DEVELOPMENT_PLAN.md content"),
				strict: z.boolean().default(false).describe("Treat warnings as errors"),
			},
			async ({ content, strict }) => {
				const result = validatePlan(content, strict);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Tool 8: devplan_get_subtask
		this.server.tool(
			"devplan_get_subtask",
			{
				plan_content: z.string().describe("DEVELOPMENT_PLAN.md content"),
				subtask_id: z.string().describe("ID in format X.Y.Z"),
			},
			async ({ plan_content, subtask_id }) => {
				const result = getSubtask(plan_content, subtask_id);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}
		);

		// Tool 9: devplan_update_progress
		this.server.tool(
			"devplan_update_progress",
			{
				plan_content: z.string().describe("Current plan content"),
				subtask_id: z.string().describe("ID to mark complete"),
				completion_notes: z.string().describe("Notes about completion"),
			},
			async ({ plan_content, subtask_id, completion_notes }) => {
				const updated = updateProgress(plan_content, subtask_id, completion_notes);
				return {
					content: [{ type: "text", text: updated }],
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return DevPlanMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return DevPlanMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("DevPlan MCP Server - Transform project ideas into development plans", {
			status: 200,
		});
	},
};
