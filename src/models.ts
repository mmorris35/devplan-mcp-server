/**
 * Data models for DevPlan MCP Server.
 * Ported from ClaudeCode-DevPlanBuilder Python models.
 */

import { z } from "zod";

// Zod schemas for validation
export const ProjectBriefSchema = z.object({
	projectName: z.string().min(1, "project_name is required"),
	projectType: z.string().min(1, "project_type is required"),
	primaryGoal: z.string().min(1, "primary_goal is required"),
	targetUsers: z.string().min(1, "target_users is required"),
	timeline: z.string().min(1, "timeline is required"),
	teamSize: z.string().default("1"),
	keyFeatures: z.array(z.string()).default([]),
	niceToHaveFeatures: z.array(z.string()).default([]),
	mustUseTech: z.array(z.string()).default([]),
	cannotUseTech: z.array(z.string()).default([]),
	deploymentTarget: z.string().optional(),
	budgetConstraints: z.string().optional(),
	performanceRequirements: z.record(z.string()).default({}),
	securityRequirements: z.record(z.string()).default({}),
	scalabilityRequirements: z.record(z.string()).default({}),
	availabilityRequirements: z.record(z.string()).default({}),
	teamComposition: z.string().optional(),
	existingKnowledge: z.array(z.string()).default([]),
	learningBudget: z.string().optional(),
	infrastructureAccess: z.array(z.string()).default([]),
	successCriteria: z.array(z.string()).default([]),
	externalSystems: z.array(z.record(z.string())).default([]),
	dataSources: z.array(z.record(z.string())).default([]),
	dataDestinations: z.array(z.record(z.string())).default([]),
	knownChallenges: z.array(z.string()).default([]),
	referenceMaterials: z.array(z.string()).default([]),
	questionsAndClarifications: z.array(z.string()).default([]),
	architectureVision: z.string().optional(),
	useCases: z.array(z.string()).default([]),
	deliverables: z.array(z.string()).default([]),
});

export type ProjectBrief = z.infer<typeof ProjectBriefSchema>;

export const GitStrategySchema = z.object({
	branchName: z.string(),
	branchFrom: z.string().default("main"),
	commitPrefix: z.string().default("feat"),
	mergeStrategy: z.enum(["merge", "squash", "rebase"]).default("squash"),
	prRequired: z.boolean().default(false),
});

export type GitStrategy = z.infer<typeof GitStrategySchema>;

export const SubtaskSchema = z.object({
	id: z.string().regex(/^\d+\.\d+\.\d+$/, "Subtask ID must be in format X.Y.Z"),
	title: z.string(),
	deliverables: z.array(z.string()).default([]),
	prerequisites: z.array(z.string()).default([]),
	filesToCreate: z.array(z.string()).default([]),
	filesToModify: z.array(z.string()).default([]),
	successCriteria: z.array(z.string()).default([]),
	technologyDecisions: z.array(z.string()).default([]),
	status: z.enum(["pending", "in_progress", "completed", "blocked"]).default("pending"),
	completionNotes: z.record(z.string()).default({}),
});

export type Subtask = z.infer<typeof SubtaskSchema>;

export const TaskSchema = z.object({
	id: z.string().regex(/^\d+\.\d+$/, "Task ID must be in format X.Y"),
	title: z.string(),
	description: z.string().default(""),
	gitStrategy: GitStrategySchema.optional(),
	subtasks: z.array(SubtaskSchema).default([]),
});

export type Task = z.infer<typeof TaskSchema>;

export const PhaseSchema = z.object({
	id: z.string().regex(/^\d+$/, "Phase ID must be a number"),
	title: z.string(),
	goal: z.string(),
	days: z.string().default(""),
	description: z.string().default(""),
	tasks: z.array(TaskSchema).default([]),
});

export type Phase = z.infer<typeof PhaseSchema>;

export const TechStackSchema = z.object({
	language: z.string().min(1, "language is required"),
	framework: z.string().default(""),
	database: z.string().default(""),
	testing: z.string().default(""),
	linting: z.string().default(""),
	typeChecking: z.string().default(""),
	deployment: z.string().default(""),
	ciCd: z.string().default(""),
	additionalTools: z.record(z.string()).default({}),
});

export type TechStack = z.infer<typeof TechStackSchema>;

export const DevelopmentPlanSchema = z.object({
	projectName: z.string().min(1, "project_name is required"),
	phases: z.array(PhaseSchema).default([]),
	techStack: TechStackSchema.optional(),
});

export type DevelopmentPlan = z.infer<typeof DevelopmentPlanSchema>;

// Validation helpers
export function validateSubtask(subtask: Subtask): string[] {
	const errors: string[] = [];

	if (!subtask.title.includes("(Single Session)")) {
		errors.push("Subtask title should include '(Single Session)' suffix");
	}

	if (subtask.deliverables.length < 3) {
		errors.push(`Subtask has ${subtask.deliverables.length} deliverables, recommended minimum is 3`);
	} else if (subtask.deliverables.length > 7) {
		errors.push(`Subtask has ${subtask.deliverables.length} deliverables, recommended maximum is 7`);
	}

	return errors;
}

export function validateTask(task: Task): string[] {
	const errors: string[] = [];

	if (task.subtasks.length === 0) {
		errors.push(`Task '${task.id}' must have at least one subtask`);
	}

	for (const subtask of task.subtasks) {
		const subtaskErrors = validateSubtask(subtask);
		errors.push(...subtaskErrors.map((e) => `Subtask ${subtask.id}: ${e}`));
	}

	return errors;
}

export function validatePhase(phase: Phase): string[] {
	const errors: string[] = [];

	if (phase.id === "0" && !phase.title.includes("Foundation")) {
		errors.push(`Phase 0 should be titled 'Foundation', got '${phase.title}' (warning)`);
	}

	if (phase.tasks.length === 0) {
		errors.push(`Phase '${phase.id}' must have at least one task`);
	}

	for (const task of phase.tasks) {
		const taskErrors = validateTask(task);
		errors.push(...taskErrors.map((e) => `Task ${task.id}: ${e}`));
	}

	return errors;
}

export function validateDevelopmentPlan(plan: DevelopmentPlan): string[] {
	const errors: string[] = [];

	if (plan.phases.length === 0) {
		errors.push("Development plan must have at least one phase");
	}

	// Validate each phase
	for (const phase of plan.phases) {
		errors.push(...validatePhase(phase));
	}

	// Validate tech stack if provided
	if (plan.techStack) {
		const stackResult = TechStackSchema.safeParse(plan.techStack);
		if (!stackResult.success) {
			errors.push(...stackResult.error.errors.map((e) => `TechStack: ${e.message}`));
		}
	}

	// Validate prerequisites exist
	const allSubtaskIds = getAllSubtaskIds(plan);
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				for (const prereq of subtask.prerequisites) {
					if (!allSubtaskIds.has(prereq)) {
						errors.push(`Subtask ${subtask.id}: prerequisite '${prereq}' does not exist in the plan`);
					}
				}
			}
		}
	}

	// Check for circular dependencies
	const cycleErrors = validateCircularDependencies(plan);
	errors.push(...cycleErrors);

	return errors;
}

export function getAllSubtaskIds(plan: DevelopmentPlan): Set<string> {
	const ids = new Set<string>();
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				ids.add(subtask.id);
			}
		}
	}
	return ids;
}

export function validateCircularDependencies(plan: DevelopmentPlan): string[] {
	const errors: string[] = [];

	// Build prerequisite graph
	const prereqGraph: Map<string, string[]> = new Map();
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				prereqGraph.set(subtask.id, subtask.prerequisites);
			}
		}
	}

	// Detect cycles using DFS
	const visited = new Set<string>();
	const recStack = new Set<string>();

	function hasCycle(node: string): boolean {
		visited.add(node);
		recStack.add(node);

		for (const neighbor of prereqGraph.get(node) || []) {
			if (!visited.has(neighbor)) {
				if (hasCycle(neighbor)) {
					return true;
				}
			} else if (recStack.has(neighbor)) {
				return true;
			}
		}

		recStack.delete(node);
		return false;
	}

	for (const subtaskId of prereqGraph.keys()) {
		if (!visited.has(subtaskId)) {
			if (hasCycle(subtaskId)) {
				errors.push(`Circular dependency detected involving subtask ${subtaskId}`);
			}
		}
	}

	return errors;
}
