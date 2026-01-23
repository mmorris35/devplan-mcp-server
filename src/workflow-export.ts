/**
 * Workflow export functionality for DevPlan MCP Server.
 * Converts DEVELOPMENT_PLAN.md to ReactFlow-compatible JSON.
 */

import type {
	ParsedPlan,
	ParsedPhase,
	ParsedTask,
	ParsedSubtask,
	ParseResult,
} from "./workflow-types";

/**
 * Parse a DEVELOPMENT_PLAN.md file into structured data.
 *
 * @param planContent - Raw markdown content of the plan
 * @returns ParseResult with structured plan or error
 */
export function parsePlanToStructure(planContent: string): ParseResult {
	const warnings: string[] = [];

	try {
		// Extract project name from first heading
		const projectNameMatch = planContent.match(/^#\s+(.+?)\s*[-–—]\s*Development Plan/m);
		const projectName = projectNameMatch?.[1]?.trim() || "Unknown Project";

		// Extract goal from Project Overview section
		const goalMatch = planContent.match(/\*\*Goal\*\*:\s*(.+?)(?:\n|$)/);
		const goal = goalMatch?.[1]?.trim() || "";

		// Extract current phase/next subtask indicators
		const currentMatch = planContent.match(/\*\*Current\*\*:\s*(?:Phase\s*)?(\d+)/i);
		const currentPhase = currentMatch ? parseInt(currentMatch[1]) : undefined;

		const nextMatch = planContent.match(/\*\*Next\*\*:\s*(\d+\.\d+\.\d+)/);
		const nextSubtask = nextMatch?.[1];

		// Parse phases
		const phases = parsePhases(planContent, warnings);

		if (phases.length === 0) {
			return {
				success: false,
				error: "No phases found in plan. Expected '## Phase N: Title' headers.",
				warnings,
			};
		}

		return {
			success: true,
			plan: {
				projectName,
				goal,
				phases,
				currentPhase,
				nextSubtask,
			},
			warnings,
		};
	} catch (error) {
		return {
			success: false,
			error: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
			warnings,
		};
	}
}

/**
 * Parse all phases from plan content.
 */
function parsePhases(content: string, warnings: string[]): ParsedPhase[] {
	const phases: ParsedPhase[] = [];

	// Match phase sections: ## Phase N: Title
	const phaseRegex = /##\s+Phase\s+(\d+):\s*(.+?)(?=\n)/g;
	const phaseMatches = [...content.matchAll(phaseRegex)];

	for (let i = 0; i < phaseMatches.length; i++) {
		const match = phaseMatches[i];
		const phaseNumber = parseInt(match[1]);
		const phaseTitle = match[2].trim();
		const phaseStart = match.index!;

		// Find the end of this phase (next phase or end of content)
		const nextPhaseStart = phaseMatches[i + 1]?.index ?? content.length;
		const phaseContent = content.slice(phaseStart, nextPhaseStart);

		// Extract goal
		const goalMatch = phaseContent.match(/\*\*Goal\*\*:\s*(.+?)(?:\n|$)/);
		const goal = goalMatch?.[1]?.trim() || "";

		// Extract duration
		const durationMatch = phaseContent.match(/\*\*Duration\*\*:\s*(.+?)(?:\n|$)/);
		const duration = durationMatch?.[1]?.trim();

		// Parse tasks within this phase
		const tasks = parseTasks(phaseContent, phaseNumber, warnings);

		phases.push({
			number: phaseNumber,
			title: phaseTitle,
			goal,
			duration,
			tasks,
		});
	}

	return phases;
}

/**
 * Parse tasks within a phase.
 */
function parseTasks(phaseContent: string, phaseNumber: number, warnings: string[]): ParsedTask[] {
	const tasks: ParsedTask[] = [];

	// Match task sections: ### Task N.M: Title
	const taskRegex = /###\s+Task\s+(\d+\.\d+):\s*(.+?)(?=\n)/g;
	const taskMatches = [...phaseContent.matchAll(taskRegex)];

	for (let i = 0; i < taskMatches.length; i++) {
		const match = taskMatches[i];
		const taskId = match[1];
		const taskTitle = match[2].trim();
		const taskStart = match.index!;

		// Find end of this task
		const nextTaskStart = taskMatches[i + 1]?.index ?? phaseContent.length;
		const taskContent = phaseContent.slice(taskStart, nextTaskStart);

		// Extract git branch
		const branchMatch = taskContent.match(/\*\*Git\*\*:\s*(?:Create branch\s+)?`([^`]+)`/);
		const gitBranch = branchMatch?.[1];

		// Parse subtasks
		const subtasks = parseSubtasks(taskContent, warnings);

		tasks.push({
			id: taskId,
			title: taskTitle,
			gitBranch,
			subtasks,
		});
	}

	return tasks;
}

/**
 * Parse subtasks within a task.
 */
function parseSubtasks(taskContent: string, warnings: string[]): ParsedSubtask[] {
	const subtasks: ParsedSubtask[] = [];

	// Match subtask sections: **Subtask N.M.P: Title**
	const subtaskRegex = /\*\*Subtask\s+(\d+\.\d+\.\d+):\s*(.+?)\*\*/g;
	const subtaskMatches = [...taskContent.matchAll(subtaskRegex)];

	for (let i = 0; i < subtaskMatches.length; i++) {
		const match = subtaskMatches[i];
		const subtaskId = match[1];
		const subtaskTitle = match[2].trim();
		const subtaskStart = match.index!;

		// Find end of this subtask
		const nextSubtaskStart = subtaskMatches[i + 1]?.index ?? taskContent.length;
		const subtaskContent = taskContent.slice(subtaskStart, nextSubtaskStart);

		// Check completion status from Progress Tracking section
		// Look for checkbox pattern: - [x] N.M.P or - [ ] N.M.P
		const completedRegex = new RegExp(`-\\s*\\[x\\]\\s*${subtaskId.replace(/\./g, "\\.")}`);
		const completed = completedRegex.test(taskContent);

		// Extract prerequisites
		const prerequisites = parsePrerequisites(subtaskContent);

		// Extract deliverables
		const deliverables = parseDeliverables(subtaskContent);

		// Extract success criteria
		const successCriteria = parseSuccessCriteria(subtaskContent);

		// Build description from first paragraph after title
		const descMatch = subtaskContent.match(/\*\*\s*\n\n(.+?)(?:\n\n|\*\*Prerequisites)/s);
		const description = descMatch?.[1]?.trim() || "";

		subtasks.push({
			id: subtaskId,
			title: subtaskTitle,
			description,
			completed,
			prerequisites,
			deliverables,
			successCriteria,
		});
	}

	return subtasks;
}

/**
 * Parse prerequisites from subtask content.
 */
function parsePrerequisites(content: string): string[] {
	const prerequisites: string[] = [];

	// Find Prerequisites section
	const prereqMatch = content.match(/\*\*Prerequisites\*\*:\s*\n([\s\S]*?)(?=\n\*\*|$)/);
	if (!prereqMatch) return prerequisites;

	// Extract checked items: - [x] N.M.P: Title
	const prereqRegex = /-\s*\[x\]\s*(\d+\.\d+\.\d+)/g;
	const matches = [...prereqMatch[1].matchAll(prereqRegex)];

	for (const match of matches) {
		prerequisites.push(match[1]);
	}

	return prerequisites;
}

/**
 * Parse deliverables from subtask content.
 */
function parseDeliverables(content: string): string[] {
	const deliverables: string[] = [];

	// Find Deliverables section
	const delivMatch = content.match(/\*\*Deliverables\*\*:\s*\n([\s\S]*?)(?=\n\*\*|$)/);
	if (!delivMatch) return deliverables;

	// Extract checkbox items
	const itemRegex = /-\s*\[[ x]\]\s*(.+?)(?:\n|$)/g;
	const matches = [...delivMatch[1].matchAll(itemRegex)];

	for (const match of matches) {
		deliverables.push(match[1].trim());
	}

	return deliverables;
}

/**
 * Parse success criteria from subtask content.
 */
function parseSuccessCriteria(content: string): string[] {
	const criteria: string[] = [];

	// Find Success Criteria section
	const criteriaMatch = content.match(/\*\*Success Criteria\*\*:\s*\n([\s\S]*?)(?=\n\*\*|---)/);
	if (!criteriaMatch) return criteria;

	// Extract checkbox items
	const itemRegex = /-\s*\[[ x]\]\s*(.+?)(?:\n|$)/g;
	const matches = [...criteriaMatch[1].matchAll(itemRegex)];

	for (const match of matches) {
		criteria.push(match[1].trim());
	}

	return criteria;
}
