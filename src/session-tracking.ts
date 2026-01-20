/**
 * Session Tracking Module
 *
 * Provides types, schemas, and utilities for tracking MCP session metadata
 * and aggregating analytics to KV storage.
 */

// ============================================================================
// Types
// ============================================================================

export interface SessionMetadata {
	sessionId: string;
	createdAt: number;
	lastActivityAt: number;
	countryCode: string | null;
	regionCode: string | null;
	continent: string | null;
	toolCalls: number;
	transportType: string;
}

export interface AnalyticsTotals {
	totalSessions: number;
	totalToolCalls: number;
	lastUpdated: string;
}

export interface DailyStats {
	date: string;
	sessions: number;
	toolCalls: number;
	countries: string[];
}

export interface CountryStats {
	countryCode: string;
	sessions: number;
	toolCalls: number;
	regions: Record<string, number>; // region code -> session count
	lastSeen: string;
}

// ============================================================================
// SQLite Schema
// ============================================================================

/**
 * SQLite schema for session metadata.
 * Run this in onStart() to initialize the database.
 */
export const SESSION_METADATA_SCHEMA = `
CREATE TABLE IF NOT EXISTS session_metadata (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  session_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  country_code TEXT,
  region_code TEXT,
  continent TEXT,
  tool_calls INTEGER DEFAULT 0,
  transport_type TEXT
)
`;

// ============================================================================
// KV Key Helpers
// ============================================================================

export const KV_KEYS = {
	totals: "analytics:totals",
	daily: (date: string) => `analytics:daily:${date}`,
	country: (code: string) => `analytics:country:${code}`,
};

// ============================================================================
// Session Lifecycle Functions
// ============================================================================

/**
 * Extract geolocation data from Cloudflare request headers.
 */
export function extractGeoFromRequest(request: Request): {
	countryCode: string | null;
	regionCode: string | null;
	continent: string | null;
} {
	// Cloudflare provides these headers automatically
	const cf = (request as unknown as { cf?: IncomingRequestCfProperties }).cf;
	return {
		countryCode: cf?.country ?? null,
		regionCode: cf?.region ?? null,
		continent: cf?.continent ?? null,
	};
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 10);
	return `session_${timestamp}_${random}`;
}

/**
 * Initialize session metadata in SQLite.
 */
export function createSessionMetadataSQL(
	sessionId: string,
	geo: { countryCode: string | null; regionCode: string | null; continent: string | null },
	transportType: string
): string {
	const now = Date.now();
	return `
INSERT OR REPLACE INTO session_metadata (id, session_id, created_at, last_activity_at, country_code, region_code, continent, tool_calls, transport_type)
VALUES ('singleton', '${sessionId}', ${now}, ${now}, ${geo.countryCode ? `'${geo.countryCode}'` : "NULL"}, ${geo.regionCode ? `'${geo.regionCode}'` : "NULL"}, ${geo.continent ? `'${geo.continent}'` : "NULL"}, 0, '${transportType}')
`;
}

/**
 * Update activity timestamp and increment tool calls.
 */
export function updateActivitySQL(): string {
	return `
UPDATE session_metadata
SET last_activity_at = ${Date.now()}, tool_calls = tool_calls + 1
WHERE id = 'singleton'
`;
}

/**
 * Get session metadata from SQLite result.
 */
export function parseSessionMetadata(row: Record<string, unknown>): SessionMetadata {
	return {
		sessionId: row.session_id as string,
		createdAt: row.created_at as number,
		lastActivityAt: row.last_activity_at as number,
		countryCode: row.country_code as string | null,
		regionCode: row.region_code as string | null,
		continent: row.continent as string | null,
		toolCalls: row.tool_calls as number,
		transportType: row.transport_type as string,
	};
}

// ============================================================================
// Expiration Logic
// ============================================================================

/**
 * Check if a session should be expired.
 * @param metadata Session metadata
 * @param inactivityDays Days of inactivity before expiration (default: 7)
 * @param absoluteDays Maximum session age in days (default: 30)
 */
export function shouldExpireSession(
	metadata: SessionMetadata,
	inactivityDays = 7,
	absoluteDays = 30
): boolean {
	const now = Date.now();
	const inactivityMs = inactivityDays * 24 * 60 * 60 * 1000;
	const absoluteMs = absoluteDays * 24 * 60 * 60 * 1000;

	const inactiveTooLong = now - metadata.lastActivityAt > inactivityMs;
	const tooOld = now - metadata.createdAt > absoluteMs;

	return inactiveTooLong || tooOld;
}

// ============================================================================
// Analytics Aggregation
// ============================================================================

/**
 * Aggregate session data into analytics totals.
 */
export async function aggregateSessionToKV(
	kv: KVNamespace,
	metadata: SessionMetadata
): Promise<void> {
	const today = new Date().toISOString().split("T")[0];

	// Update global totals
	const totalsKey = KV_KEYS.totals;
	let totals: AnalyticsTotals;
	try {
		const existing = await kv.get<AnalyticsTotals>(totalsKey, "json");
		totals = existing ?? { totalSessions: 0, totalToolCalls: 0, lastUpdated: today };
	} catch {
		totals = { totalSessions: 0, totalToolCalls: 0, lastUpdated: today };
	}
	totals.totalSessions += 1;
	totals.totalToolCalls += metadata.toolCalls;
	totals.lastUpdated = today;
	await kv.put(totalsKey, JSON.stringify(totals));

	// Update daily stats (with 90-day TTL)
	const dailyKey = KV_KEYS.daily(today);
	let daily: DailyStats;
	try {
		const existing = await kv.get<DailyStats>(dailyKey, "json");
		daily = existing ?? { date: today, sessions: 0, toolCalls: 0, countries: [] };
	} catch {
		daily = { date: today, sessions: 0, toolCalls: 0, countries: [] };
	}
	daily.sessions += 1;
	daily.toolCalls += metadata.toolCalls;
	if (metadata.countryCode && !daily.countries.includes(metadata.countryCode)) {
		daily.countries.push(metadata.countryCode);
	}
	await kv.put(dailyKey, JSON.stringify(daily), { expirationTtl: 90 * 24 * 60 * 60 }); // 90 days TTL

	// Update country stats
	if (metadata.countryCode) {
		const countryKey = KV_KEYS.country(metadata.countryCode);
		let country: CountryStats;
		try {
			const existing = await kv.get<CountryStats>(countryKey, "json");
			country = existing ?? {
				countryCode: metadata.countryCode,
				sessions: 0,
				toolCalls: 0,
				regions: {},
				lastSeen: today,
			};
		} catch {
			country = {
				countryCode: metadata.countryCode,
				sessions: 0,
				toolCalls: 0,
				regions: {},
				lastSeen: today,
			};
		}
		country.sessions += 1;
		country.toolCalls += metadata.toolCalls;
		country.lastSeen = today;
		if (metadata.regionCode) {
			country.regions[metadata.regionCode] = (country.regions[metadata.regionCode] ?? 0) + 1;
		}
		await kv.put(countryKey, JSON.stringify(country));
	}
}

// ============================================================================
// Dashboard Data Fetching
// ============================================================================

/**
 * Fetch analytics data for the dashboard.
 */
export async function fetchDashboardData(kv: KVNamespace): Promise<{
	totals: AnalyticsTotals;
	recentDays: DailyStats[];
	topCountries: CountryStats[];
}> {
	// Fetch totals from analytics:totals (populated by session expiration)
	let totals: AnalyticsTotals = {
		totalSessions: 0,
		totalToolCalls: 0,
		lastUpdated: new Date().toISOString(),
	};
	try {
		const existing = await kv.get<AnalyticsTotals>(KV_KEYS.totals, "json");
		if (existing) {
			totals = existing;
		}
	} catch {
		// Use defaults
	}

	// Fetch last 30 days of daily stats from analytics:daily:* keys
	// These are populated by aggregateSessionToKV() on session expiration
	const recentDays: DailyStats[] = [];
	const today = new Date();

	for (let i = 0; i < 30; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split("T")[0];

		try {
			const daily = await kv.get<DailyStats>(KV_KEYS.daily(dateStr), "json");
			if (daily && daily.sessions > 0) {
				recentDays.push(daily);
			}
		} catch {
			// Skip days with errors
		}
	}
	recentDays.reverse(); // Oldest first for charting

	// Fetch country stats (list all keys with prefix and get top 10)
	const topCountries: CountryStats[] = [];
	try {
		const countryList = await kv.list({ prefix: "analytics:country:" });
		const countryPromises = countryList.keys.slice(0, 50).map(async (key) => {
			const stats = await kv.get<CountryStats>(key.name, "json");
			return stats;
		});
		const countryResults = await Promise.all(countryPromises);
		const validCountries = countryResults.filter((c): c is CountryStats => c !== null);
		validCountries.sort((a, b) => b.sessions - a.sessions);
		topCountries.push(...validCountries.slice(0, 10));
	} catch {
		// No country data yet
	}

	return { totals, recentDays, topCountries };
}
