/**
 * Session expiry for DevPlanMCP Durable Objects.
 *
 * The agents SDK creates one SQLite-backed Durable Object per MCP session and never deletes it,
 * so storage only grows (60 GB / 1.35M objects by 2026-11-20). Each session therefore gets ONE
 * expiry schedule when it first starts. The schedule is never re-created while it is pending and
 * never rescheduled after it fires: the earlier hourly self-rescheduling alarm is what blew the
 * free-tier write limit.
 */

/** The callback name the expiry schedule calls on the agent. */
export const EXPIRY_CALLBACK = "checkExpiration";

/** The slice of the agents SDK `Agent` that expiry needs (kept small so it can be tested). */
export interface ScheduleHost {
	getSchedules(): Array<{ callback: string }>;
	schedule(when: number, callback: string): Promise<unknown>;
}

/** Session lifetime in seconds from the SESSION_TTL_HOURS var; 24 h when unset or invalid. */
export function sessionTtlSeconds(hours: string | undefined): number {
	const parsed = Number.parseFloat(hours ?? "");
	return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 3600) : 24 * 3600;
}

/**
 * Schedule the session's expiry once. Returns true when it scheduled one, false when one was
 * already pending (onStart runs on every wake, so this is called many times per session).
 */
export async function ensureSessionExpiry(host: ScheduleHost, ttlSeconds: number): Promise<boolean> {
	const pending = host.getSchedules().some((schedule) => schedule.callback === EXPIRY_CALLBACK);
	if (pending) return false;
	await host.schedule(ttlSeconds, EXPIRY_CALLBACK);
	return true;
}
