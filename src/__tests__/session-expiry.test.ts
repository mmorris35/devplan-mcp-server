import { describe, expect, it } from "vitest";
import { ensureSessionExpiry, EXPIRY_CALLBACK, sessionTtlSeconds } from "../session-expiry";

/** A stand-in for the agents SDK schedule table: schedule() adds a row, getSchedules() lists them. */
function fakeHost() {
	const rows: Array<{ callback: string; when: number }> = [];
	return {
		rows,
		getSchedules: () => rows.map((row) => ({ callback: row.callback })),
		schedule: async (when: number, callback: string) => {
			rows.push({ callback, when });
		},
	};
}

describe("session expiry", () => {
	it("schedules exactly one expiry however many times the session wakes", async () => {
		const host = fakeHost();
		const ttl = sessionTtlSeconds("24");
		const first = await ensureSessionExpiry(host, ttl);
		const again = await ensureSessionExpiry(host, ttl);
		const third = await ensureSessionExpiry(host, ttl);
		expect([first, again, third]).toEqual([true, false, false]);
		expect(host.rows).toEqual([{ callback: EXPIRY_CALLBACK, when: 86400 }]);
	});

	it("leaves other schedules alone and still adds the expiry once", async () => {
		const host = fakeHost();
		host.rows.push({ callback: "somethingElse", when: 60 });
		await ensureSessionExpiry(host, 3600);
		await ensureSessionExpiry(host, 3600);
		expect(host.rows.filter((row) => row.callback === EXPIRY_CALLBACK)).toHaveLength(1);
	});

	it("reads the TTL from SESSION_TTL_HOURS, 24 h when unset or invalid", () => {
		expect(sessionTtlSeconds("24")).toBe(86400);
		expect(sessionTtlSeconds("1.5")).toBe(5400);
		expect(sessionTtlSeconds(undefined)).toBe(86400);
		expect(sessionTtlSeconds("0")).toBe(86400);
		expect(sessionTtlSeconds("abc")).toBe(86400);
	});
});
