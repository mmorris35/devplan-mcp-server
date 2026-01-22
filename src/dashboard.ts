/**
 * Dashboard Module
 *
 * Provides HTTP handlers for the usage dashboard UI and API endpoints.
 * Uses Cloudflare Zone Analytics for real unique visitor counts.
 */

import { fetchCloudflareAnalytics, type CloudflareAnalyticsEnv } from "./cloudflare-analytics";

// ============================================================================
// Types
// ============================================================================

interface DashboardEnv extends CloudflareAnalyticsEnv {
	DEVPLAN_KV: KVNamespace;
}

// ============================================================================
// Country Code to Name Mapping
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
	TW: "Taiwan",
};

function getCountryName(code: string): string {
	return COUNTRY_NAMES[code] || code;
}

// ============================================================================
// API Handler
// ============================================================================

export async function handleDashboardAPI(env: DashboardEnv): Promise<Response> {
	try {
		const data = await fetchCloudflareAnalytics(env);
		return new Response(JSON.stringify(data, null, 2), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "public, max-age=300",
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

export async function handleDashboard(request: Request, env: DashboardEnv): Promise<Response> {
	const data = await fetchCloudflareAnalytics(env);

	const chartLabels = data.dailyData.map((d) => d.date.slice(5));
	const chartVisitors = data.dailyData.map((d) => d.uniqueVisitors);
	const chartRequests = data.dailyData.map((d) => d.requests);

	const countryRows = data.countryData
		.map(
			(c, i) => `
        <tr class="border-b border-gray-700">
          <td class="py-2 px-3">${i + 1}</td>
          <td class="py-2 px-3">${c.countryName || getCountryName(c.countryCode)}</td>
          <td class="py-2 px-3 text-right">${c.requests.toLocaleString()}</td>
        </tr>
      `
		)
		.join("");

	const isConfigured = !data.lastUpdated.startsWith("Error:");
	const errorMessage = !isConfigured ? data.lastUpdated.replace("Error: ", "") : "";

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
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">DevPlan MCP Server</h1>
      <p class="text-gray-400">Usage Dashboard</p>
    </header>

    ${
		!isConfigured
			? `
    <div class="card rounded-lg p-6 mb-8 border border-yellow-600">
      <h2 class="text-xl font-semibold text-yellow-400 mb-2">Analytics Error</h2>
      <p class="text-gray-300">${errorMessage}</p>
      <p class="text-gray-400 mt-4 text-sm">
        Make sure CF_ANALYTICS_TOKEN and CF_ZONE_ID secrets are set, and the token has Zone Analytics:Read permission.
      </p>
    </div>
    `
			: ""
	}

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Unique Visitors (30 days)</div>
        <div class="text-3xl font-bold text-white">${data.totals.uniqueVisitors.toLocaleString()}</div>
        <div class="text-xs text-gray-500 mt-1">Real data from Cloudflare</div>
      </div>
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Total Requests (30 days)</div>
        <div class="text-3xl font-bold text-white">${data.totals.requests.toLocaleString()}</div>
      </div>
      <div class="card rounded-lg p-6">
        <div class="text-gray-400 text-sm mb-1">Countries</div>
        <div class="text-3xl font-bold text-white">${data.totals.countries}</div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-white mb-4">Daily Traffic</h2>
      <div style="height: 300px;">
        <canvas id="trafficChart"></canvas>
      </div>
    </div>

    <!-- Country Table -->
    <div class="card rounded-lg p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Top Countries</h2>
      ${
			data.countryData.length > 0
				? `
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-400 text-left border-b border-gray-700">
            <th class="py-2 px-3">#</th>
            <th class="py-2 px-3">Country</th>
            <th class="py-2 px-3 text-right">Requests</th>
          </tr>
        </thead>
        <tbody>
          ${countryRows}
        </tbody>
      </table>
      `
				: `<p class="text-gray-400">No traffic data yet. Visit devplanmcp.store to start collecting analytics.</p>`
		}
    </div>

    <footer class="mt-8 text-center text-gray-500 text-sm">
      <p>Last updated: ${isConfigured ? new Date(data.lastUpdated).toLocaleString() : "N/A"}</p>
      <p class="mt-1 text-xs">Data from Cloudflare Zone Analytics</p>
      <p class="mt-2">
        <a href="/" class="text-blue-400 hover:text-blue-300">API Status</a>
        &middot;
        <a href="https://github.com/mmorris35/devplan-mcp-server" class="text-blue-400 hover:text-blue-300" target="_blank">GitHub</a>
      </p>
    </footer>
  </div>

  <script>
    const ctx = document.getElementById('trafficChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartLabels)},
        datasets: [
          {
            label: 'Unique Visitors',
            data: ${JSON.stringify(chartVisitors)},
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
          },
          {
            label: 'Requests',
            data: ${JSON.stringify(chartRequests)},
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            labels: { color: '#9ca3af' }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Unique Visitors',
              color: '#9ca3af'
            },
            ticks: {
              color: '#9ca3af',
              callback: function(value) { return value.toLocaleString(); }
            },
            grid: { color: '#374151' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Requests',
              color: '#9ca3af'
            },
            ticks: {
              color: '#9ca3af',
              callback: function(value) { return value.toLocaleString(); }
            },
            grid: { drawOnChartArea: false }
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
			"Cache-Control": "public, max-age=300",
		},
	});
}
