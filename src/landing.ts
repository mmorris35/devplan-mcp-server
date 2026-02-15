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
  <title>DevPlan MCP Server - Turn Ideas into Working Code with Claude</title>
  <meta name="description" content="Stop losing context. Stop repeating mistakes. DevPlan helps Claude Code build your projects right the first time.">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0f172a; }
    .card { background-color: #1e293b; }
    .gradient-text { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    code { background-color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre { background-color: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    .benefit-icon { font-size: 2rem; }
  </style>
</head>
<body class="min-h-screen text-gray-100">
  <!-- Hero -->
  <div class="bg-gradient-to-b from-blue-900/50 to-transparent">
    <div class="max-w-4xl mx-auto px-6 py-20 text-center">
      <h1 class="text-5xl md:text-6xl font-bold text-white mb-6">
        Build Projects <span class="gradient-text">Right the First Time</span>
      </h1>
      <p class="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
        DevPlan supercharges <strong>Claude Code, Cursor, Aider, Cline, and Windsurf</strong> with structured planning, automatic validation, and lessons learned from every project.
      </p>
      <p class="text-lg text-gray-400 mb-8">
        No more lost context. No more repeated mistakes. No more debugging AI-generated code for hours.
      </p>
      <div class="flex justify-center gap-4 flex-wrap">
        <a href="#install" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition">
          Get Started Free
        </a>
        <a href="/dashboard" class="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition">
          View Dashboard
        </a>
      </div>
    </div>
  </div>

  <!-- Multi-Target Banner -->
  <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-y border-purple-500/30">
    <div class="max-w-4xl mx-auto px-6 py-4 text-center">
      <p class="text-lg text-purple-200">
        <span class="mr-2">🎯</span><span class="font-bold text-white">Works with Your Favorite AI Tool</span>
        <span class="text-gray-300">— Claude Code • Cursor • Aider • Cline • Windsurf — same methodology, native integrations.</span>
      </p>
    </div>
  </div>

  <!-- Latest Improvements -->
  <div class="max-w-4xl mx-auto px-6 pt-8 pb-2">
    <div class="card rounded-lg p-4 border border-blue-500/20 text-sm">
      <p class="text-blue-300 font-semibold mb-2">What's New <span class="text-gray-500 font-normal">— Feb 2026</span></p>
      <ul class="text-gray-400 space-y-1">
        <li><span class="text-green-400 mr-1">+</span> <strong class="text-gray-300">Full polyglot support</strong> — Plans, agents, and CLAUDE.md now generate with correct tooling for Java, Kotlin, C#, Rust, Go, and more</li>
        <li><span class="text-green-400 mr-1">+</span> <strong class="text-gray-300">Smarter v2 roadmaps</strong> — Nice-to-have features get clean v2.1, v2.2 numbering under a dedicated roadmap section</li>
        <li><span class="text-green-400 mr-1">+</span> <strong class="text-gray-300">Language-aware scaffolds</strong> — File paths, test commands, and project structure match your tech stack out of the box</li>
      </ul>
    </div>
  </div>

  <div class="max-w-5xl mx-auto px-6 pb-20 pt-8">
    <!-- Problem/Solution -->
    <section class="mb-20">
      <div class="grid md:grid-cols-2 gap-8">
        <div class="card rounded-xl p-8 border border-red-900/30">
          <h3 class="text-xl font-bold text-red-400 mb-4">Without DevPlan</h3>
          <ul class="space-y-3 text-gray-400">
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>Claude loses context between sessions</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>Inconsistent code quality across files</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>Same mistakes repeated in every project</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>Hours debugging AI-generated code</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>Bugs discovered in production</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-red-400">✗</span>
              <span>No record of what was built or why</span>
            </li>
          </ul>
        </div>
        <div class="card rounded-xl p-8 border border-green-900/30">
          <h3 class="text-xl font-bold text-green-400 mb-4">With DevPlan</h3>
          <ul class="space-y-3 text-gray-400">
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>Plans preserve full context forever</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>Validated plans = consistent results</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>Lessons learned prevent recurrence</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>Real-time progress with Task tools</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>Verification catches issues early</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-green-400">✓</span>
              <span>As-built docs you can reference forever</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="mb-20">
      <h2 class="text-3xl font-bold text-white text-center mb-12">What You Get</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="benefit-icon mb-4">🎯</div>
          <h3 class="text-xl font-semibold text-white mb-2">Plans That Actually Work</h3>
          <p class="text-gray-400">Every plan is validated before execution. No more vague instructions that Claude interprets differently each time.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">🧠</div>
          <h3 class="text-xl font-semibold text-white mb-2">AI That Learns</h3>
          <p class="text-gray-400">Issues found during verification become lessons that automatically improve future projects.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">⚡</div>
          <h3 class="text-xl font-semibold text-white mb-2">Faster Development</h3>
          <p class="text-gray-400">Haiku executes plans mechanically while Sonnet verifies. You focus on what matters.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">🔄</div>
          <h3 class="text-xl font-semibold text-white mb-2">Resumable Sessions</h3>
          <p class="text-gray-400">Pick up exactly where you left off. Plans preserve complete context across any number of sessions.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">🐛</div>
          <h3 class="text-xl font-semibold text-white mb-2">GitHub Issue Integration</h3>
          <p class="text-gray-400">Turn bug reports and feature requests directly into structured remediation tasks.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">🤖</div>
          <h3 class="text-xl font-semibold text-white mb-2">Custom Agents</h3>
          <p class="text-gray-400">Auto-generates executor and verifier agents tailored to your project's tech stack.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">📊</div>
          <h3 class="text-xl font-semibold text-white mb-2">Real-Time Progress</h3>
          <p class="text-gray-400">Integrates with Claude Code's Task tools. See live spinners and progress without scrolling.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">📋</div>
          <h3 class="text-xl font-semibold text-white mb-2">As-Built Documentation</h3>
          <p class="text-gray-400">PROJECT_BRIEF.md and DEVELOPMENT_PLAN.md become permanent records. Return months later and understand every decision.</p>
        </div>
        <div class="text-center">
          <div class="benefit-icon mb-4">🔧</div>
          <h3 class="text-xl font-semibold text-white mb-2">Works Everywhere</h3>
          <p class="text-gray-400">Claude Code, Cursor, Aider, Cline, Windsurf — DevPlan generates native config files for each tool. Same methodology, your choice of editor.</p>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="mb-20">
      <h2 class="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
      <p class="text-gray-400 text-center mb-12 max-w-2xl mx-auto">DevPlan uses a scaffold → enhance → validate workflow that ensures every plan is ready for execution.</p>
      <div class="grid md:grid-cols-4 gap-6">
        <div class="card rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-blue-400 mb-2">1</div>
          <h3 class="font-semibold text-white mb-2">Interview</h3>
          <p class="text-gray-400 text-sm">DevPlan asks questions to understand your project requirements.</p>
        </div>
        <div class="card rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-purple-400 mb-2">2</div>
          <h3 class="font-semibold text-white mb-2">Plan</h3>
          <p class="text-gray-400 text-sm">Generates a scaffold, then enhances it with complete code.</p>
        </div>
        <div class="card rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-green-400 mb-2">3</div>
          <h3 class="font-semibold text-white mb-2">Validate</h3>
          <p class="text-gray-400 text-sm">Checks the plan is complete and ready for mechanical execution.</p>
        </div>
        <div class="card rounded-xl p-6 text-center">
          <div class="text-3xl font-bold text-orange-400 mb-2">4</div>
          <h3 class="font-semibold text-white mb-2">Execute</h3>
          <p class="text-gray-400 text-sm">Haiku implements with live progress tracking. Sonnet verifies. Lessons captured.</p>
        </div>
      </div>
    </section>

    <!-- Install -->
    <section class="mb-20" id="install">
      <h2 class="text-3xl font-bold text-white text-center mb-4">Get Started in 30 Seconds</h2>
      <p class="text-gray-400 text-center mb-8">Works with your favorite AI coding tool.</p>
      <div class="card rounded-xl p-8 max-w-3xl mx-auto">
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-3">Claude Code</h3>
          <pre class="text-green-400"><code>claude mcp add devplan --transport sse https://mcp.devplanmcp.store/sse --scope user</code></pre>
        </div>
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-3">Cursor</h3>
          <p class="text-gray-400 text-sm mb-2">Add to <code>.cursor/mcp.json</code>:</p>
          <pre class="text-green-400"><code>{ "mcpServers": { "devplan": { "url": "https://mcp.devplanmcp.store/sse" } } }</code></pre>
        </div>
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-3">Aider</h3>
          <pre class="text-green-400"><code>aider --mcp-server https://mcp.devplanmcp.store/sse</code></pre>
        </div>
        <div class="mb-8">
          <h3 class="text-lg font-semibold text-white mb-3">Cline / Windsurf</h3>
          <p class="text-gray-400 text-sm">Native MCP support — add <code>https://mcp.devplanmcp.store/sse</code> as an MCP server in settings.</p>
        </div>
        <div class="border-t border-gray-700 pt-6">
          <p class="text-gray-400 mb-4">Then use the executor agent to implement your plan:</p>
          <pre class="text-blue-300 mb-6"><code>You: "Use the my-project-executor agent to execute subtask 0.1.1"</code></pre>
          <p class="text-gray-400 mb-4">When it's done, use the verifier agent to check your work:</p>
          <pre class="text-blue-300"><code>You: "Use the my-project-verifier agent to validate the application"</code></pre>
        </div>
      </div>
    </section>

    <!-- Social Proof -->
    <section class="mb-20">
      <div class="card rounded-xl p-8 text-center">
        <p class="text-2xl text-white mb-4">"DevPlan changed how I use Claude Code. Projects that used to take days of debugging now work on the first try."</p>
        <p class="text-gray-400">— A developer who was tired of context loss</p>
      </div>
    </section>

    <!-- Testimonial Form -->
    <section class="mb-20" id="testimonial">
      <div class="card rounded-xl p-8 border border-purple-500/30">
        <div class="text-center mb-8">
          <div class="text-4xl mb-4">💬</div>
          <h3 class="text-2xl font-bold text-white mb-3">Love DevPlan?</h3>
          <p class="text-gray-400 max-w-lg mx-auto">
            Share your experience! Your testimonial helps other developers discover better ways to work with AI.
          </p>
        </div>
        <form id="testimonial-form" class="max-w-xl mx-auto space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-300 mb-2">Name or Nickname</label>
            <input type="text" id="name" name="entry.2051456297" required
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition"
              placeholder="Your name, handle, or favorite igneous rock...">
          </div>
          <div>
            <label for="testimonial" class="block text-sm font-medium text-gray-300 mb-2">Your Experience</label>
            <textarea id="testimonial" name="entry.1732259482" required rows="4"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition resize-none"
              placeholder="How has DevPlan helped you? What do you like about it?"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">May we feature your testimonial on this page?</label>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="entry.49694324" value="Yes" required class="text-purple-500 focus:ring-purple-500 bg-gray-800 border-gray-700">
                <span class="text-gray-300">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="entry.49694324" value="No" class="text-purple-500 focus:ring-purple-500 bg-gray-800 border-gray-700">
                <span class="text-gray-300">No</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            Share Your Story →
          </button>
        </form>
        <div id="testimonial-thanks" class="hidden text-center py-8">
          <div class="text-4xl mb-4">🙏</div>
          <h3 class="text-2xl font-bold text-white mb-2">Thank you!</h3>
          <p class="text-gray-400">Your testimonial means a lot. We appreciate you taking the time to share your experience.</p>
        </div>
      </div>
    </section>
    <script>
      document.getElementById('testimonial-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        fetch('https://docs.google.com/forms/d/e/1FAIpQLSdge_JLhEze0nALzv9xnKqEtM9kWOLkN-w-VArwgPGesu08jg/formResponse', {
          method: 'POST',
          body: formData,
          mode: 'no-cors'
        }).then(() => {
          form.classList.add('hidden');
          document.getElementById('testimonial-thanks').classList.remove('hidden');
        }).catch(() => {
          form.classList.add('hidden');
          document.getElementById('testimonial-thanks').classList.remove('hidden');
        });
      });
    </script>

    <!-- CTA -->
    <section class="text-center mb-16">
      <h2 class="text-3xl font-bold text-white mb-4">Ready to Build Better?</h2>
      <p class="text-gray-400 mb-8">Join developers who ship faster with DevPlan.</p>
      <a href="#install" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition inline-block">
        Install DevPlan Now
      </a>
    </section>

    <!-- Links -->
    <section class="text-center border-t border-gray-800 pt-8">
      <div class="flex justify-center gap-6 text-sm mb-6">
        <a href="/dashboard" class="text-blue-400 hover:text-blue-300">Dashboard</a>
        <a href="/health" class="text-blue-400 hover:text-blue-300">API Health</a>
        <a href="https://github.com/mmorris35/devplan-mcp-server" class="text-blue-400 hover:text-blue-300" target="_blank">GitHub</a>
        <a href="https://github.com/mmorris35/ClaudeCode-DevPlanBuilder" class="text-blue-400 hover:text-blue-300" target="_blank">Methodology</a>
      </div>
      <p class="text-gray-500 text-sm">
        Built for AI coding tools using the <a href="https://modelcontextprotocol.io" class="text-gray-400 hover:text-gray-300">Model Context Protocol</a>
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
