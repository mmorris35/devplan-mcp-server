/**
 * ReactFlow-compatible types for visual workflow export.
 * These types match the ReactFlow node/edge format used by Sim.ai.
 * @see https://reactflow.dev/docs/api/types/
 */

// ============================================
// ReactFlow Types
// ============================================

/**
 * Position in 2D space for node placement.
 */
export interface Position {
	x: number;
	y: number;
}

/**
 * Data payload for workflow nodes.
 */
export interface WorkflowNodeData {
	/** Display label (e.g., "Phase 0: Foundation") */
	label: string;
	/** Full description text */
	description?: string;
	/** Completion status */
	status: "pending" | "in_progress" | "completed";
	/** Original ID from plan (e.g., "0.1.1") */
	planId: string;
	/** Estimated duration if available */
	duration?: string;
	/** Success criteria list */
	successCriteria?: string[];
}

/**
 * Base ReactFlow node structure.
 */
export interface WorkflowNode {
	/** Unique identifier (e.g., "phase-0", "task-0.1", "subtask-0.1.1") */
	id: string;
	/** Node type for rendering (phase, task, subtask) */
	type: "phase" | "task" | "subtask";
	/** Position calculated by layout engine */
	position: Position;
	/** Node data for display */
	data: WorkflowNodeData;
	/** Parent node ID for grouping (optional) */
	parentNode?: string;
	/** Extent for child nodes ('parent' constrains to parent bounds) */
	extent?: "parent";
}

/**
 * ReactFlow edge connecting nodes.
 */
export interface WorkflowEdge {
	/** Unique edge identifier */
	id: string;
	/** Source node ID */
	source: string;
	/** Target node ID */
	target: string;
	/** Edge type for styling */
	type?: "default" | "smoothstep" | "step" | "straight";
	/** Whether edge is animated */
	animated?: boolean;
	/** Edge label (optional) */
	label?: string;
	/** Custom style */
	style?: Record<string, string | number>;
}

/**
 * Metadata about the exported workflow.
 */
export interface WorkflowMetadata {
	/** Source plan name */
	planName: string;
	/** Export timestamp */
	exportedAt: string;
	/** DevPlan MCP version */
	version: string;
	/** Target platform */
	platform: "sim" | "n8n" | "reactflow" | "generic";
	/** Total node count */
	nodeCount: number;
	/** Total edge count */
	edgeCount: number;
}

/**
 * Complete workflow export structure.
 */
export interface WorkflowExport {
	/** ReactFlow nodes array */
	nodes: WorkflowNode[];
	/** ReactFlow edges array */
	edges: WorkflowEdge[];
	/** Viewport settings */
	viewport?: {
		x: number;
		y: number;
		zoom: number;
	};
	/** Metadata about the export */
	metadata: WorkflowMetadata;
}

/**
 * Options for workflow export.
 */
export interface ExportOptions {
	/** Target platform format */
	platform?: "sim" | "n8n" | "reactflow" | "generic";
	/** Include completed subtasks */
	includeCompleted?: boolean;
	/** Node spacing for layout */
	nodeSpacing?: {
		horizontal: number;
		vertical: number;
	};
	/** Whether to include success criteria in node data */
	includeSuccessCriteria?: boolean;
}

// ============================================
// Plan Parser Types
// ============================================

/**
 * Parsed subtask from DEVELOPMENT_PLAN.md
 */
export interface ParsedSubtask {
	/** Subtask ID (e.g., "0.1.1") */
	id: string;
	/** Subtask title */
	title: string;
	/** Full description */
	description: string;
	/** Completion status from checkbox */
	completed: boolean;
	/** Prerequisites (IDs of blocking subtasks) */
	prerequisites: string[];
	/** Deliverables list */
	deliverables: string[];
	/** Success criteria list */
	successCriteria: string[];
}

/**
 * Parsed task containing subtasks
 */
export interface ParsedTask {
	/** Task ID (e.g., "0.1") */
	id: string;
	/** Task title */
	title: string;
	/** Git branch name */
	gitBranch?: string;
	/** Subtasks within this task */
	subtasks: ParsedSubtask[];
}

/**
 * Parsed phase containing tasks
 */
export interface ParsedPhase {
	/** Phase number (e.g., 0, 1, 2) */
	number: number;
	/** Phase title (e.g., "Foundation") */
	title: string;
	/** Phase goal description */
	goal: string;
	/** Estimated duration */
	duration?: string;
	/** Tasks within this phase */
	tasks: ParsedTask[];
}

/**
 * Complete parsed plan structure
 */
export interface ParsedPlan {
	/** Project name from plan header */
	projectName: string;
	/** Project goal */
	goal: string;
	/** All phases in order */
	phases: ParsedPhase[];
	/** Current phase indicator */
	currentPhase?: number;
	/** Next subtask ID to work on */
	nextSubtask?: string;
}

/**
 * Result of parsing a plan
 */
export interface ParseResult {
	/** Whether parsing succeeded */
	success: boolean;
	/** Parsed plan structure (if success) */
	plan?: ParsedPlan;
	/** Error message (if failed) */
	error?: string;
	/** Warnings during parsing */
	warnings: string[];
}
