/**
 * Landing Page Module
 *
 * Serves a styled landing page at the root URL.
 */

export function handleLanding(): Response {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevPlan MCP Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0f172a; }
    .card { background-color: #1e293b; }
    code { background-color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background-color: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
  </style>
</head>
<body class="min-h-screen text-gray-100">
  <!-- Hero -->
  <div class="bg-gradient-to-b from-blue-900/50 to-transparent">
    <div class="max-w-4xl mx-auto px-6 py-16 text-center">
      <h1 class="text-5xl font-bold text-white mb-4">DevPlan MCP Server</h1>
      <p class="text-xl text-gray-300 mb-8">Transform ideas into executable development plans</p>
      <div class="flex justify-center gap-4 flex-wrap">
        <a href="/dashboard" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
          View Dashboard
        </a>
        <a href="https://github.com/mmorris35/devplan-mcp-server" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition" target="_blank">
          GitHub
        </a>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-6 pb-16">
    <!-- Install -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">Install</h2>
      <pre class="text-green-400"><code>claude mcp add devplan --transport sse https://mcp.devplanmcp.store/sse</code></pre>
      <p class="text-gray-400 mt-4">Or add to <code>~/.claude/mcp.json</code>:</p>
      <pre class="mt-2"><code class="text-gray-300">{
  "mcpServers": {
    "devplan": {
      "type": "sse",
      "url": "https://mcp.devplanmcp.store/sse"
    }
  }
}</code></pre>
      <h3 class="text-lg font-semibold text-white mt-6 mb-2">Update Existing Installation</h3>
      <p class="text-gray-400 mb-2">If you already have DevPlan installed, remove and re-add:</p>
      <pre class="text-yellow-400"><code>claude mcp remove devplan && claude mcp add devplan --transport sse https://mcp.devplanmcp.store/sse</code></pre>
    </section>

    <!-- Quick Start -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-4">Quick Start</h2>
      <pre class="text-blue-300"><code>You: "Use devplan_start to help me build a CLI tool for managing dotfiles"</code></pre>
      <p class="text-gray-400 mt-4">That's it. DevPlan guides Claude through the entire process: interview, brief, plan, execute, verify, and capture lessons learned.</p>
    </section>

    <!-- Features -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">Key Features</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="card rounded-lg p-5">
          <h3 class="text-lg font-semibold text-white mb-2">Haiku-Executable Plans</h3>
          <p class="text-gray-400 text-sm">Plans so detailed that Claude Haiku can execute them mechanically.</p>
        </div>
        <div class="card rounded-lg p-5">
          <h3 class="text-lg font-semibold text-white mb-2">Lessons Learned</h3>
          <p class="text-gray-400 text-sm">Captures issues from verification and injects them into future plans.</p>
        </div>
        <div class="card rounded-lg p-5">
          <h3 class="text-lg font-semibold text-white mb-2">Issue Remediation</h3>
          <p class="text-gray-400 text-sm">Converts GitHub issues directly into structured remediation tasks.</p>
        </div>
        <div class="card rounded-lg p-5">
          <h3 class="text-lg font-semibold text-white mb-2">Executor & Verifier Agents</h3>
          <p class="text-gray-400 text-sm">Auto-generates specialized agents for your project.</p>
        </div>
      </div>
    </section>

    <!-- Tools -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">21 MCP Tools</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-blue-400 mb-2">Planning</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_start</code></li>
            <li><code>devplan_interview_questions</code></li>
            <li><code>devplan_create_brief</code></li>
            <li><code>devplan_parse_brief</code></li>
            <li><code>devplan_list_templates</code></li>
          </ul>
        </div>
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-green-400 mb-2">Generation</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_generate_plan</code></li>
            <li><code>devplan_generate_claude_md</code></li>
            <li><code>devplan_generate_executor</code></li>
            <li><code>devplan_generate_verifier</code></li>
          </ul>
        </div>
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-purple-400 mb-2">Execution</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_validate_plan</code></li>
            <li><code>devplan_get_subtask</code></li>
            <li><code>devplan_update_progress</code></li>
            <li><code>devplan_progress_summary</code></li>
          </ul>
        </div>
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-yellow-400 mb-2">Lessons</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_add_lesson</code></li>
            <li><code>devplan_list_lessons</code></li>
            <li><code>devplan_archive_lesson</code></li>
            <li><code>devplan_delete_lesson</code></li>
            <li><code>devplan_extract_lessons_from_report</code></li>
          </ul>
        </div>
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-red-400 mb-2">Remediation</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_parse_issue</code></li>
            <li><code>devplan_issue_to_task</code></li>
          </ul>
        </div>
        <div class="card rounded-lg p-4">
          <h3 class="font-semibold text-cyan-400 mb-2">Analytics</h3>
          <ul class="text-gray-400 space-y-1">
            <li><code>devplan_usage_stats</code></li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Links -->
    <section class="text-center">
      <div class="flex justify-center gap-6 text-sm">
        <a href="/dashboard" class="text-blue-400 hover:text-blue-300">Dashboard</a>
        <a href="/health" class="text-blue-400 hover:text-blue-300">API Health</a>
        <a href="https://github.com/mmorris35/devplan-mcp-server" class="text-blue-400 hover:text-blue-300" target="_blank">GitHub</a>
        <a href="https://github.com/mmorris35/ClaudeCode-DevPlanBuilder" class="text-blue-400 hover:text-blue-300" target="_blank">Methodology</a>
      </div>
      <p class="text-gray-500 text-sm mt-6">
        Built for <a href="https://modelcontextprotocol.io" class="text-gray-400 hover:text-gray-300">Model Context Protocol</a>
        on <a href="https://workers.cloudflare.com" class="text-gray-400 hover:text-gray-300">Cloudflare Workers</a>
      </p>
    </section>
  </div>
</body>
</html>`;

	return new Response(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
