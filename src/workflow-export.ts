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
	WorkflowNode,
	WorkflowNodeData,
	WorkflowEdge,
	WorkflowExport,
	WorkflowMetadata,
	ExportOptions,
	MermaidExport,
} from "./workflow-types";

// ============================================
// Plan Parser
// ============================================

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
	const phaseRegex = /^##\s+Phase\s+(\d+):\s*(.+?)(?=\n)/gm;
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
	const taskRegex = /^###\s+Task\s+(\d+\.\d+):\s*(.+?)(?=\n)/gm;
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

// ============================================
// Node Generation
// ============================================

/**
 * Generate ReactFlow nodes from a parsed plan.
 * Positions are placeholders - use applyLayout() for final positioning.
 *
 * @param plan - Parsed plan structure
 * @param options - Export options
 * @returns Array of workflow nodes
 */
export function generateNodes(plan: ParsedPlan, options: ExportOptions = {}): WorkflowNode[] {
	const nodes: WorkflowNode[] = [];
	const includeCompleted = options.includeCompleted ?? true;
	const includeSuccessCriteria = options.includeSuccessCriteria ?? false;

	for (const phase of plan.phases) {
		// Create phase node
		const phaseId = `phase-${phase.number}`;
		const phaseStatus = getPhaseStatus(phase);

		nodes.push({
			id: phaseId,
			type: "phase",
			position: { x: 0, y: 0 },
			data: {
				label: `Phase ${phase.number}: ${phase.title}`,
				description: phase.goal,
				status: phaseStatus,
				planId: String(phase.number),
				duration: phase.duration,
			},
		});

		for (const task of phase.tasks) {
			// Create task node
			const taskId = `task-${task.id}`;
			const taskStatus = getTaskStatus(task);

			nodes.push({
				id: taskId,
				type: "task",
				position: { x: 0, y: 0 },
				parentNode: phaseId,
				data: {
					label: `Task ${task.id}: ${task.title}`,
					status: taskStatus,
					planId: task.id,
				},
			});

			for (const subtask of task.subtasks) {
				// Skip completed subtasks if option is set
				if (!includeCompleted && subtask.completed) {
					continue;
				}

				// Create subtask node
				const subtaskNodeId = `subtask-${subtask.id}`;
				const subtaskStatus: "pending" | "in_progress" | "completed" =
					subtask.completed ? "completed" : "pending";

				const nodeData: WorkflowNodeData = {
					label: `${subtask.id}: ${subtask.title}`,
					description: subtask.description,
					status: subtaskStatus,
					planId: subtask.id,
				};

				if (includeSuccessCriteria && subtask.successCriteria.length > 0) {
					nodeData.successCriteria = subtask.successCriteria;
				}

				nodes.push({
					id: subtaskNodeId,
					type: "subtask",
					position: { x: 0, y: 0 },
					parentNode: taskId,
					data: nodeData,
				});
			}
		}
	}

	return nodes;
}

/**
 * Determine phase status based on task completion.
 */
function getPhaseStatus(phase: ParsedPhase): "pending" | "in_progress" | "completed" {
	const allSubtasks = phase.tasks.flatMap((t) => t.subtasks);
	const completedCount = allSubtasks.filter((s) => s.completed).length;

	if (completedCount === 0) return "pending";
	if (completedCount === allSubtasks.length) return "completed";
	return "in_progress";
}

/**
 * Determine task status based on subtask completion.
 */
function getTaskStatus(task: ParsedTask): "pending" | "in_progress" | "completed" {
	const completedCount = task.subtasks.filter((s) => s.completed).length;

	if (completedCount === 0) return "pending";
	if (completedCount === task.subtasks.length) return "completed";
	return "in_progress";
}

// ============================================
// Edge Generation
// ============================================

/**
 * Generate ReactFlow edges from a parsed plan.
 * Creates dependency edges based on prerequisites and hierarchical edges for structure.
 *
 * @param plan - Parsed plan structure
 * @param options - Export options
 * @returns Array of workflow edges
 */
export function generateEdges(plan: ParsedPlan, options: ExportOptions = {}): WorkflowEdge[] {
	const edges: WorkflowEdge[] = [];
	const includeCompleted = options.includeCompleted ?? true;

	// Build a map of subtask IDs for quick lookup
	const subtaskMap = new Map<string, ParsedSubtask>();
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				subtaskMap.set(subtask.id, subtask);
			}
		}
	}

	// Create dependency edges from prerequisites
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				// Skip completed subtasks if option is set
				if (!includeCompleted && subtask.completed) {
					continue;
				}

				for (const prereqId of subtask.prerequisites) {
					const prereqSubtask = subtaskMap.get(prereqId);

					// Skip edge if prerequisite is completed and we're filtering
					if (!includeCompleted && prereqSubtask?.completed) {
						continue;
					}

					edges.push({
						id: `edge-${prereqId}-to-${subtask.id}`,
						source: `subtask-${prereqId}`,
						target: `subtask-${subtask.id}`,
						type: "smoothstep",
						animated: !prereqSubtask?.completed,
						style: prereqSubtask?.completed
							? { stroke: "#22c55e" }
							: { stroke: "#6b7280" },
					});
				}
			}
		}
	}

	// Create phase-to-phase edges (sequential flow)
	for (let i = 0; i < plan.phases.length - 1; i++) {
		const current = plan.phases[i];
		const next = plan.phases[i + 1];

		edges.push({
			id: `edge-phase-${current.number}-to-${next.number}`,
			source: `phase-${current.number}`,
			target: `phase-${next.number}`,
			type: "smoothstep",
			style: { stroke: "#3b82f6", strokeWidth: 2 },
		});
	}

	return edges;
}

// ============================================
// Layout Engine
// ============================================

/**
 * Layout configuration for node positioning.
 */
interface LayoutConfig {
	nodeWidth: number;
	nodeHeight: number;
	horizontalGap: number;
	verticalGap: number;
}

const DEFAULT_LAYOUT: LayoutConfig = {
	nodeWidth: 250,
	nodeHeight: 60,
	horizontalGap: 50,
	verticalGap: 40,
};

/**
 * Apply hierarchical layout to workflow nodes.
 * Uses a simple top-down layout algorithm.
 *
 * @param nodes - Nodes to position
 * @param edges - Edges (unused, for future dependency-based layout)
 * @param config - Layout configuration
 * @returns Nodes with updated positions
 */
export function applyLayout(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
	config: Partial<LayoutConfig> = {}
): WorkflowNode[] {
	const layout = { ...DEFAULT_LAYOUT, ...config };
	const positioned = [...nodes];

	// Group nodes by type
	const phases = positioned.filter((n) => n.type === "phase");
	const tasks = positioned.filter((n) => n.type === "task");
	const subtasks = positioned.filter((n) => n.type === "subtask");

	// Calculate positions based on hierarchy
	let currentY = 0;

	for (const phase of phases) {
		// Position phase node
		phase.position = { x: 0, y: currentY };

		// Find tasks in this phase
		const phaseTasks = tasks.filter((t) => t.parentNode === phase.id);
		let taskY = currentY + layout.nodeHeight + layout.verticalGap;

		for (const task of phaseTasks) {
			// Position task node (indented)
			task.position = { x: layout.horizontalGap, y: taskY };

			// Find subtasks in this task
			const taskSubtasks = subtasks.filter((s) => s.parentNode === task.id);
			let subtaskY = taskY + layout.nodeHeight + layout.verticalGap;

			for (const subtask of taskSubtasks) {
				// Position subtask node (further indented)
				subtask.position = { x: layout.horizontalGap * 2, y: subtaskY };
				subtaskY += layout.nodeHeight + layout.verticalGap;
			}

			// Update taskY based on subtask count
			const subtaskHeight = taskSubtasks.length * (layout.nodeHeight + layout.verticalGap);
			taskY += Math.max(layout.nodeHeight + layout.verticalGap, subtaskHeight);
		}

		// Update currentY based on phase content
		const phaseHeight = phaseTasks.reduce((acc, t) => {
			const ts = subtasks.filter((s) => s.parentNode === t.id);
			return (
				acc +
				Math.max(
					layout.nodeHeight + layout.verticalGap,
					ts.length * (layout.nodeHeight + layout.verticalGap)
				)
			);
		}, 0);

		currentY += Math.max(
			layout.nodeHeight + layout.verticalGap * 2,
			phaseHeight + layout.nodeHeight + layout.verticalGap * 2
		);
	}

	return positioned;
}

// ============================================
// Main Export Function
// ============================================

/**
 * Export result type for JSON format.
 */
export type ExportResult =
	| { success: true; workflow: WorkflowExport }
	| { success: false; error: string };

/**
 * Export result type for Mermaid format.
 */
export type MermaidExportResult =
	| { success: true; mermaid: MermaidExport }
	| { success: false; error: string };

/**
 * Generate Mermaid flowchart diagram from parsed plan.
 *
 * @param plan - Parsed plan structure
 * @param options - Export options
 * @returns Mermaid diagram syntax
 */
export function generateMermaidDiagram(plan: ParsedPlan, options: ExportOptions = {}): string {
	const lines: string[] = [];
	const includeCompleted = options.includeCompleted !== false;

	lines.push("flowchart TD");

	// Track subtask IDs for dependency edges
	const subtaskIds: string[] = [];

	for (const phase of plan.phases) {
		// Create subgraph for each phase
		const phaseId = `P${phase.number}`;
		lines.push(`    subgraph ${phaseId}["Phase ${phase.number}: ${escapeLabel(phase.title)}"]`);

		for (const task of phase.tasks) {
			const taskId = `T${task.id.replace(/\./g, "_")}`;

			for (const subtask of task.subtasks) {
				if (!includeCompleted && subtask.completed) continue;

				const subtaskId = `S${subtask.id.replace(/\./g, "_")}`;
				const status = subtask.completed ? "DONE" : "TODO";
				const shortTitle = truncateLabel(subtask.title, 30);
				lines.push(`        ${subtaskId}["${status}: ${subtask.id} ${escapeLabel(shortTitle)}"]`);
				subtaskIds.push(subtask.id);
			}

			// Link subtasks sequentially within task
			const taskSubtasks = task.subtasks.filter(s => includeCompleted || !s.completed);
			for (let i = 0; i < taskSubtasks.length - 1; i++) {
				const fromId = `S${taskSubtasks[i].id.replace(/\./g, "_")}`;
				const toId = `S${taskSubtasks[i + 1].id.replace(/\./g, "_")}`;
				lines.push(`        ${fromId} --> ${toId}`);
			}
		}

		lines.push("    end");
	}

	// Add phase-to-phase edges
	for (let i = 0; i < plan.phases.length - 1; i++) {
		const fromPhase = `P${plan.phases[i].number}`;
		const toPhase = `P${plan.phases[i + 1].number}`;
		lines.push(`    ${fromPhase} --> ${toPhase}`);
	}

	// Add cross-phase prerequisite edges (dashed)
	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				if (!includeCompleted && subtask.completed) continue;

				for (const prereqId of subtask.prerequisites) {
					const prereqPhase = prereqId.split(".")[0];
					const subtaskPhase = subtask.id.split(".")[0];
					if (prereqPhase !== subtaskPhase && subtaskIds.includes(prereqId)) {
						const fromId = `S${prereqId.replace(/\./g, "_")}`;
						const toId = `S${subtask.id.replace(/\./g, "_")}`;
						lines.push(`    ${fromId} -.-> ${toId}`);
					}
				}
			}
		}
	}

	// Add styling
	lines.push("    classDef done fill:#22c55e,stroke:#16a34a,color:#fff");
	lines.push("    classDef todo fill:#94a3b8,stroke:#64748b,color:#000");

	// Apply styles to nodes
	const completedNodes: string[] = [];
	const pendingNodes: string[] = [];

	for (const phase of plan.phases) {
		for (const task of phase.tasks) {
			for (const subtask of task.subtasks) {
				if (!includeCompleted && subtask.completed) continue;
				const subtaskId = `S${subtask.id.replace(/\./g, "_")}`;
				if (subtask.completed) {
					completedNodes.push(subtaskId);
				} else {
					pendingNodes.push(subtaskId);
				}
			}
		}
	}

	if (completedNodes.length > 0) {
		lines.push(`    class ${completedNodes.join(",")} done`);
	}
	if (pendingNodes.length > 0) {
		lines.push(`    class ${pendingNodes.join(",")} todo`);
	}

	return lines.join("\n");
}

/**
 * Escape special characters for Mermaid labels.
 * Uses quoted label format ["text"] to allow special characters.
 */
function escapeLabel(text: string): string {
	// Inside quoted labels, only need to escape quotes and backslashes
	return text.replace(/\\/g, "\\\\").replace(/"/g, "#quot;");
}

/**
 * Truncate label to max length.
 */
function truncateLabel(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + "...";
}

/**
 * Export plan as Mermaid diagram.
 *
 * @param planContent - Raw DEVELOPMENT_PLAN.md content
 * @param options - Export options
 * @returns Mermaid export result
 */
export function exportMermaid(planContent: string, options: ExportOptions = {}): MermaidExportResult {
	const parseResult = parsePlanToStructure(planContent);
	if (!parseResult.success || !parseResult.plan) {
		return { success: false, error: parseResult.error || "Unknown parse error" };
	}

	const plan = parseResult.plan;
	const diagram = generateMermaidDiagram(plan, options);

	const allSubtasks = plan.phases.flatMap(p => p.tasks.flatMap(t => t.subtasks));
	const filteredSubtasks = options.includeCompleted !== false
		? allSubtasks
		: allSubtasks.filter(s => !s.completed);

	const metadata: WorkflowMetadata = {
		planName: plan.projectName,
		exportedAt: new Date().toISOString(),
		version: "1.0.0",
		platform: "mermaid",
		nodeCount: filteredSubtasks.length + plan.phases.length + plan.phases.flatMap(p => p.tasks).length,
		edgeCount: 0, // Not easily countable for Mermaid
	};

	return {
		success: true,
		mermaid: {
			diagram,
			metadata,
		},
	};
}

/**
 * Main export function - combines parsing, node/edge generation, and layout.
 *
 * @param planContent - Raw DEVELOPMENT_PLAN.md content
 * @param options - Export options
 * @returns Complete workflow export or error
 */
export function exportWorkflow(planContent: string, options: ExportOptions = {}): ExportResult {
	// Parse the plan
	const parseResult = parsePlanToStructure(planContent);
	if (!parseResult.success || !parseResult.plan) {
		return { success: false, error: parseResult.error || "Unknown parse error" };
	}

	const plan = parseResult.plan;

	// Generate nodes and edges
	const nodes = generateNodes(plan, options);
	const edges = generateEdges(plan, options);

	// Apply layout
	const layoutedNodes = applyLayout(nodes, edges);

	// Build metadata
	const metadata: WorkflowMetadata = {
		planName: plan.projectName,
		exportedAt: new Date().toISOString(),
		version: "1.0.0",
		platform: options.platform || "reactflow",
		nodeCount: layoutedNodes.length,
		edgeCount: edges.length,
	};

	return {
		success: true,
		workflow: {
			nodes: layoutedNodes,
			edges,
			viewport: { x: 0, y: 0, zoom: 1 },
			metadata,
		},
	};
}
