/**
 * Cloudflare Analytics API Module
 *
 * Fetches analytics data from Cloudflare's GraphQL Analytics API.
 * Uses Zone Analytics for real unique visitor counts (requires custom domain).
 * This is a zero-write solution - Cloudflare already collects the data.
 */

// ============================================================================
// Types
// ============================================================================

export interface CloudflareAnalyticsEnv {
	CF_ANALYTICS_TOKEN: string;
	CF_ACCOUNT_ID: string;
	CF_ZONE_ID: string;
}

export interface DailyVisitors {
	date: string;
	uniqueVisitors: number;
	requests: number;
}

export interface CountryData {
	countryCode: string;
	countryName: string;
	requests: number;
	uniqueVisitors: number;
}

export interface AnalyticsData {
	dailyData: DailyVisitors[];
	countryData: CountryData[];
	totals: {
		uniqueVisitors: number;
		requests: number;
		countries: number;
	};
	lastUpdated: string;
}

// Cloudflare Zone Analytics GraphQL response types
interface ZoneHttpRequest1dGroup {
	dimensions: {
		date: string;
	};
	uniq: {
		uniques: number;
	};
	sum: {
		requests: number;
		countryMap: Array<{
			clientCountryName: string;
			requests: number;
		}>;
	};
}

interface CFZoneGraphQLResponse {
	data?: {
		viewer: {
			zones: Array<{
				httpRequests1dGroups: ZoneHttpRequest1dGroup[];
			}>;
		};
	};
	errors?: Array<{ message: string; path?: string[] }>;
}

// ============================================================================
// Country Code Mapping
// ============================================================================

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
	"United States": "US",
	"China": "CN",
	"Japan": "JP",
	"Germany": "DE",
	"United Kingdom": "GB",
	"France": "FR",
	"India": "IN",
	"Italy": "IT",
	"Brazil": "BR",
	"Canada": "CA",
	"Russia": "RU",
	"South Korea": "KR",
	"Australia": "AU",
	"Spain": "ES",
	"Mexico": "MX",
	"Indonesia": "ID",
	"Netherlands": "NL",
	"Saudi Arabia": "SA",
	"Turkey": "TR",
	"Switzerland": "CH",
	"Poland": "PL",
	"Thailand": "TH",
	"Sweden": "SE",
	"Belgium": "BE",
	"Argentina": "AR",
	"Norway": "NO",
	"Austria": "AT",
	"United Arab Emirates": "AE",
	"Israel": "IL",
	"Singapore": "SG",
	"Hong Kong": "HK",
	"Denmark": "DK",
	"Finland": "FI",
	"New Zealand": "NZ",
	"Ireland": "IE",
	"Portugal": "PT",
	"Czechia": "CZ",
	"Romania": "RO",
	"Vietnam": "VN",
	"Philippines": "PH",
	"Malaysia": "MY",
	"Colombia": "CO",
	"Chile": "CL",
	"South Africa": "ZA",
	"Ukraine": "UA",
	"Pakistan": "PK",
	"Egypt": "EG",
	"Nigeria": "NG",
	"Bangladesh": "BD",
	"Peru": "PE",
	"Taiwan": "TW",
	"Hong Kong SAR China": "HK",
	"Korea": "KR",
	"Republic of Korea": "KR",
};

function getCountryCode(name: string): string {
	return COUNTRY_NAME_TO_CODE[name] || name.slice(0, 2).toUpperCase();
}

// ============================================================================
// Analytics Fetching
// ============================================================================

/**
 * Fetch analytics data from Cloudflare's GraphQL API.
 * Uses Zone Analytics for real unique visitor counts.
 */
export async function fetchCloudflareAnalytics(env: CloudflareAnalyticsEnv): Promise<AnalyticsData> {
	// Check if credentials are configured
	if (!env.CF_ANALYTICS_TOKEN || !env.CF_ZONE_ID) {
		return getEmptyAnalytics("Analytics not configured - missing CF_ANALYTICS_TOKEN or CF_ZONE_ID");
	}

	// Calculate date range (last 30 days)
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 30);

	const formatDate = (d: Date) => d.toISOString().split("T")[0];

	// Zone Analytics query - gets all traffic for the zone
	const query = `
		query GetZoneAnalytics($zoneTag: string!, $startDate: Date!, $endDate: Date!) {
			viewer {
				zones(filter: { zoneTag: $zoneTag }) {
					httpRequests1dGroups(
						limit: 31
						filter: {
							date_geq: $startDate,
							date_leq: $endDate
						}
						orderBy: [date_ASC]
					) {
						dimensions {
							date
						}
						uniq {
							uniques
						}
						sum {
							requests
							countryMap {
								clientCountryName
								requests
							}
						}
					}
				}
			}
		}
	`;

	const variables = {
		zoneTag: env.CF_ZONE_ID,
		startDate: formatDate(startDate),
		endDate: formatDate(endDate),
	};

	try {
		const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`,
			},
			body: JSON.stringify({ query, variables }),
		});

		if (!response.ok) {
			console.error(`Cloudflare API error: ${response.status} ${response.statusText}`);
			return getEmptyAnalytics(`API error: ${response.status}`);
		}

		const result = (await response.json()) as CFZoneGraphQLResponse;

		if (result.errors && result.errors.length > 0) {
			console.error("Cloudflare GraphQL errors:", result.errors);
			return getEmptyAnalytics(result.errors[0].message);
		}

		const groups = result.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
		if (!groups || groups.length === 0) {
			return getEmptyAnalytics("No data returned - zone may not have traffic yet");
		}

		// Process daily data with REAL unique visitors
		const dailyData: DailyVisitors[] = groups.map((g) => ({
			date: g.dimensions.date,
			uniqueVisitors: g.uniq.uniques, // REAL unique visitors from Cloudflare
			requests: g.sum.requests,
		}));

		// Aggregate country data across all days
		const countryAggregates = new Map<string, { requests: number; name: string }>();
		for (const group of groups) {
			for (const country of group.sum.countryMap) {
				const existing = countryAggregates.get(country.clientCountryName) || {
					requests: 0,
					name: country.clientCountryName,
				};
				existing.requests += country.requests;
				countryAggregates.set(country.clientCountryName, existing);
			}
		}

		// Convert to sorted array (top 20 countries)
		const countryData: CountryData[] = Array.from(countryAggregates.entries())
			.map(([name, data]) => ({
				countryCode: getCountryCode(name),
				countryName: name,
				requests: data.requests,
				uniqueVisitors: 0, // Per-country uniques not available in this query
			}))
			.sort((a, b) => b.requests - a.requests)
			.slice(0, 20);

		// Calculate totals
		const totals = {
			uniqueVisitors: dailyData.reduce((sum, d) => sum + d.uniqueVisitors, 0),
			requests: dailyData.reduce((sum, d) => sum + d.requests, 0),
			countries: countryData.length,
		};

		return {
			dailyData,
			countryData,
			totals,
			lastUpdated: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Failed to fetch Cloudflare analytics:", error);
		return getEmptyAnalytics(error instanceof Error ? error.message : "Unknown error");
	}
}

function getEmptyAnalytics(reason: string): AnalyticsData {
	return {
		dailyData: [],
		countryData: [],
		totals: {
			uniqueVisitors: 0,
			requests: 0,
			countries: 0,
		},
		lastUpdated: `Error: ${reason}`,
	};
}
