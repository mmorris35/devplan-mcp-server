/**
 * Adapter registry and factory for multi-model support.
 *
 * This module provides a centralized registry of output adapters and
 * factory functions to retrieve the appropriate adapter for a given target.
 */

import type { AdapterTarget, OutputAdapter } from "./types";
import { claudeAdapter } from "./claude";

// Re-export all types
export * from "./types";
export { claudeAdapter } from "./claude";

/**
 * Registry of all available adapters.
 * Unimplemented adapters fall back to Claude adapter.
 */
const ADAPTERS: Record<AdapterTarget, OutputAdapter> = {
	claude: claudeAdapter,
	cursor: claudeAdapter, // TODO: Replace with CursorAdapter in Phase 6
	aider: claudeAdapter, // TODO: Replace with AiderAdapter in Phase 7
	cline: claudeAdapter, // TODO: Replace with ClineAdapter in Phase 8
	windsurf: claudeAdapter, // TODO: Replace with WindsurfAdapter in Phase 8
	generic: claudeAdapter, // TODO: Replace with GenericAdapter in Phase 8
};

/**
 * Set of targets that have native (non-fallback) adapter implementations.
 * Updated as new adapters are added.
 */
const NATIVE_ADAPTERS = new Set<AdapterTarget>(["claude"]);

/**
 * Get the adapter for a target tool.
 * Falls back to Claude adapter for unimplemented targets.
 *
 * @param target - Target tool identifier
 * @returns OutputAdapter instance for the target
 *
 * @example
 * const adapter = getAdapter('cursor');
 * const file = adapter.generateAgentFile(briefContent, config);
 */
export function getAdapter(target: AdapterTarget = "claude"): OutputAdapter {
	return ADAPTERS[target] ?? claudeAdapter;
}

/**
 * Check if a target has a dedicated adapter implementation.
 * Returns false for targets that fall back to Claude adapter.
 *
 * @param target - Target tool identifier
 * @returns true if target has native implementation
 *
 * @example
 * if (!hasNativeAdapter('cursor')) {
 *   console.warn('Using Claude adapter as fallback');
 * }
 */
export function hasNativeAdapter(target: AdapterTarget): boolean {
	return NATIVE_ADAPTERS.has(target);
}

/**
 * List all supported target tools.
 *
 * @returns Array of all AdapterTarget values
 *
 * @example
 * const targets = listTargets();
 * // ['claude', 'cursor', 'aider', 'cline', 'windsurf', 'generic']
 */
export function listTargets(): AdapterTarget[] {
	return Object.keys(ADAPTERS) as AdapterTarget[];
}

/**
 * List targets that have native (non-fallback) adapter implementations.
 *
 * @returns Array of targets with native adapters
 *
 * @example
 * const native = listNativeTargets();
 * // ['claude'] - initially, grows as adapters are added
 */
export function listNativeTargets(): AdapterTarget[] {
	return listTargets().filter(hasNativeAdapter);
}

/**
 * Register a new adapter in the registry.
 * Used by adapter implementations to register themselves.
 *
 * @param target - Target identifier to register
 * @param adapter - OutputAdapter implementation
 * @param isNative - Whether this is a native (non-fallback) implementation
 *
 * @internal
 */
export function registerAdapter(target: AdapterTarget, adapter: OutputAdapter, isNative = true): void {
	ADAPTERS[target] = adapter;
	if (isNative) {
		NATIVE_ADAPTERS.add(target);
	}
}
