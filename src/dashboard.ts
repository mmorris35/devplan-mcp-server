/**
 * Dashboard Module
 *
 * Provides HTTP handlers for the usage dashboard UI and API endpoints.
 */

import { fetchDashboardData, type AnalyticsTotals, type DailyStats, type CountryStats } from "./session-tracking";

// ============================================================================
// Types
// ============================================================================

interface DashboardEnv {
	DEVPLAN_KV: KVNamespace;
}

interface DashboardAPIResponse {
	totals: AnalyticsTotals;
	recentDays: DailyStats[];
	topCountries: CountryStats[];
}

// ============================================================================
// Country Code to Name Mapping (top 50 countries)
// ============================================================================

const COUNTRY_NAMES: Record<string, string> = {
	US: "United States",
	CN: "China",
	JP: "Japan",
	DE: "Germany",
	GB: "United Kingdom",
	FR: "France",
	IN: "India",
	IT: "Italy",
	BR: "Brazil",
	CA: "Canada",
	RU: "Russia",
	KR: "South Korea",
	AU: "Australia",
	ES: "Spain",
	MX: "Mexico",
	ID: "Indonesia",
	NL: "Netherlands",
	SA: "Saudi Arabia",
	TR: "Turkey",
	CH: "Switzerland",
	PL: "Poland",
	TH: "Thailand",
	SE: "Sweden",
	BE: "Belgium",
	AR: "Argentina",
	NO: "Norway",
	AT: "Austria",
	AE: "UAE",
	IL: "Israel",
	SG: "Singapore",
	HK: "Hong Kong",
	DK: "Denmark",
	FI: "Finland",
	NZ: "New Zealand",
	IE: "Ireland",
	PT: "Portugal",
	CZ: "Czechia",
	RO: "Romania",
	VN: "Vietnam",
	PH: "Philippines",
	MY: "Malaysia",
	CO: "Colombia",
	CL: "Chile",
	ZA: "South Africa",
	UA: "Ukraine",
	PK: "Pakistan",
	EG: "Egypt",
	NG: "Nigeria",
	BD: "Bangladesh",
	PE: "Peru",
};

function getCountryName(code: string): string {
	return COUNTRY_NAMES[code] || code;
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * Handle /dashboard/api/stats requests.
 * Returns JSON with analytics data.
 */
export async function handleDashboardAPI(env: DashboardEnv): Promise<Response> {
	try {
		const data = await fetchDashboardData(env.DEVPLAN_KV);
		const response: DashboardAPIResponse = {
			totals: data.totals,
			recentDays: data.recentDays,
			topCountries: data.topCountries,
		};
		return new Response(JSON.stringify(response, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=60", // Cache for 1 minute
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: "Failed to fetch analytics data" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

// ============================================================================
// Dashboard UI Handler
// ============================================================================

/**
 * Handle /dashboard requests.
 * Returns HTML page with usage dashboard.
 */
export async function handleDashboard(request: Request, env: DashboardEnv): Promise<Response> {
	// Fetch data for initial render
	const data = await fetchDashboardData(env.DEVPLAN_KV);

	// Generate chart data JSON
	const chartLabels = data.recentDays.map((d) => d.date.slice(5)); // MM-DD format
	const chartSessions = data.recentDays.map((d) => d.sessions);
	const chartToolCalls = data.recentDays.map((d) => d.toolCalls);

	// Generate country table rows
	const countryRows = data.topCountries
		.map(
			(c, i) => `
        <tr class="border-b border-gray-700">
          <td class="py-2 px-3">${i + 1}</td>
          <td class="py-2 px-3">${getCountryName(c.countryCode)}</td>
          <td class="py-2 px-3 text-right">${c.sessions.toLocaleString()}</td>
          <td class="py-2 px-3 text-right">${c.toolCalls.toLocaleString()}</td>
        </tr>
      `
		)
		.join("");

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPlan MCP Server - Usage Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { background-color: #0f172a; }
    .card { background-color: #1e293b; }
  </style>
</head>
<body class="min-h-screen text-gray-100 p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">DevPlan MCP Server</h1>
      <p class="text-gray-400">Usage Dashboard</p>
    </header>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Total Sessions</div>
        <div class="text-3xl font-bold text-white">${data.totals.totalSessions.toLocaleString()}</div>
      </div>
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Total Tool Calls</div>
        <div class="text-3xl font-bold text-white">${data.totals.totalToolCalls.toLocaleString()}</div>
      </div>
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Countries Reached</div>
        <div class="text-3xl font-bold text-white">${data.topCountries.length}</div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Sessions Over Last 30 Days</h2>
      <div style="height: 300px;">
        <canvas id="sessionsChart"></canvas>
      </div>
    </div>

    <!-- Country Table -->
    <div class="card rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Top Countries</h2>
      ${
			data.topCountries.length > 0
				? `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-400 text-left border-b border-gray-700">
            <th class="py-2 px-3">#</th>
            <th class="py-2 px-3">Country</th>
            <th class="py-2 px-3 text-right">Sessions</th>
            <th class="py-2 px-3 text-right">Tool Calls</th>
          </tr>
        </thead>
        <tbody>
          ${countryRows}
        </tbody>
      </table>
      `
				: `<p class="text-gray-400">No geographic data available yet.</p>`
		}
    </div>

    <!-- Footer -->
    <footer class="mt-8 text-center text-gray-500 text-sm">
      <p>Last updated: ${data.totals.lastUpdated || "Never"}</p>
      <p class="mt-2">
        <a href="/" class="text-blue-400 hover:text-blue-300">API Status</a>
        &middot;
        <a href="https://github.com/mmorris35/devplan-mcp-server" class="text-blue-400 hover:text-blue-300" target="_blank">GitHub</a>
      </p>
    </footer>
  </div>

  <script>
    // Chart.js configuration
    const ctx = document.getElementById('sessionsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartLabels)},
        datasets: [
          {
            label: 'Sessions',
            data: ${JSON.stringify(chartSessions)},
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Tool Calls',
            data: ${JSON.stringify(chartToolCalls)},
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#9ca3af' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' }
          }
        }
      }
    });
  </script>
</body>
</html>`;

	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=60", // Cache for 1 minute
		},
	});
}
