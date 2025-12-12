/**
 * Authentication and rate limiting middleware for DevPlan MCP Server.
 *
 * When AUTH_ENABLED=true:
 * - Requires X-API-Key header
 * - Validates key against KV store
 * - Enforces rate limits based on tier
 *
 * When AUTH_ENABLED=false (default):
 * - All requests pass through
 * - No rate limiting
 */

export interface ApiKeyData {
	tier: "free" | "pro" | "enterprise";
	email: string;
	createdAt: string;
	monthlyLimit: number;
}

export interface UsageData {
	count: number;
	resetAt: string; // ISO date for next reset
}

export interface AuthResult {
	authorized: boolean;
	error?: string;
	tier?: string;
	remaining?: number;
}

/**
 * Validate API key and check rate limits.
 * Returns immediately if auth is disabled.
 */
export async function validateRequest(
	request: Request,
	env: { AUTH_ENABLED: string; FREE_TIER_LIMIT: string; DEVPLAN_KV: KVNamespace }
): Promise<AuthResult> {
	// If auth is disabled, allow all requests
	if (env.AUTH_ENABLED !== "true") {
		return { authorized: true, tier: "unlimited" };
	}

	// Extract API key from header
	const apiKey = request.headers.get("X-API-Key");
	if (!apiKey) {
		return {
			authorized: false,
			error: "Missing X-API-Key header. Get your API key at https://devplan.helladynamic.com",
		};
	}

	// Look up API key in KV
	const keyData = await env.DEVPLAN_KV.get<ApiKeyData>(`key:${apiKey}`, "json");
	if (!keyData) {
		return {
			authorized: false,
			error: "Invalid API key. Get your API key at https://devplan.helladynamic.com",
		};
	}

	// Check rate limit
	const usageKey = `usage:${apiKey}:${getCurrentMonth()}`;
	const usage = await env.DEVPLAN_KV.get<UsageData>(usageKey, "json");
	const currentCount = usage?.count || 0;

	const limit = keyData.monthlyLimit || parseInt(env.FREE_TIER_LIMIT, 10);
	if (currentCount >= limit) {
		return {
			authorized: false,
			error: `Monthly limit reached (${limit} requests). Upgrade at https://devplan.helladynamic.com`,
			tier: keyData.tier,
			remaining: 0,
		};
	}

	// Increment usage counter
	await env.DEVPLAN_KV.put(
		usageKey,
		JSON.stringify({
			count: currentCount + 1,
			resetAt: getNextMonthReset(),
		}),
		{ expirationTtl: 60 * 60 * 24 * 35 } // 35 days TTL
	);

	return {
		authorized: true,
		tier: keyData.tier,
		remaining: limit - currentCount - 1,
	};
}

/**
 * Create error response for unauthorized requests.
 */
export function unauthorizedResponse(error: string): Response {
	return new Response(
		JSON.stringify({
			error: "Unauthorized",
			message: error,
			docs: "https://devplan.helladynamic.com/docs/api-keys",
		}),
		{
			status: 401,
			headers: {
				"Content-Type": "application/json",
				"WWW-Authenticate": 'ApiKey realm="DevPlan MCP"',
			},
		}
	);
}

/**
 * Add rate limit headers to response.
 */
export function addRateLimitHeaders(response: Response, authResult: AuthResult): Response {
	if (authResult.tier && authResult.remaining !== undefined) {
		const headers = new Headers(response.headers);
		headers.set("X-RateLimit-Tier", authResult.tier);
		headers.set("X-RateLimit-Remaining", String(authResult.remaining));
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}
	return response;
}

// Helper functions
function getCurrentMonth(): string {
	const now = new Date();
	return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getNextMonthReset(): string {
	const now = new Date();
	const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
	return nextMonth.toISOString();
}

/**
 * Admin function to create a new API key.
 * Call via: POST /admin/keys with admin secret
 */
export async function createApiKey(
	env: { DEVPLAN_KV: KVNamespace },
	email: string,
	tier: "free" | "pro" | "enterprise" = "free"
): Promise<string> {
	const apiKey = generateApiKey();
	const limits: Record<string, number> = {
		free: 100,
		pro: 10000,
		enterprise: 1000000,
	};

	const keyData: ApiKeyData = {
		tier,
		email,
		createdAt: new Date().toISOString(),
		monthlyLimit: limits[tier],
	};

	await env.DEVPLAN_KV.put(`key:${apiKey}`, JSON.stringify(keyData));
	await env.DEVPLAN_KV.put(`email:${email}`, apiKey);

	return apiKey;
}

function generateApiKey(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const prefix = "dvp_";
	let key = prefix;
	for (let i = 0; i < 32; i++) {
		key += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return key;
}
