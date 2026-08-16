/**
 * Interactive Web Dashboard HTML/CSS/JS generator for Windows Context MCP
 */

export function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Windows Context MCP - Live Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0c0f17;
      --bg-surface: #141a29;
      --bg-card: #1b2337;
      --bg-card-hover: #222c45;
      --border: #283452;
      --text-main: #f0f4fc;
      --text-muted: #8b9bb4;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.5;
      padding: 2rem 1.5rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }

    .brand h1 {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
      background: rgba(16, 185, 129, 0.12);
      color: var(--accent-green);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .btn {
      background: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn:hover {
      background: var(--bg-card-hover);
      border-color: var(--accent-blue);
    }

    /* Grid Layout */
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .card-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Active Window Banner */
    .col-12 { grid-column: span 12; }
    .col-8 { grid-column: span 8; }
    .col-6 { grid-column: span 6; }
    .col-4 { grid-column: span 4; }
    .col-3 { grid-column: span 3; }

    @media (max-width: 900px) {
      .col-8, .col-6, .col-4, .col-3 { grid-column: span 12; }
    }

    .active-window-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
      border: 1px solid rgba(59, 130, 246, 0.3);
      position: relative;
      overflow: hidden;
    }

    .active-window-title {
      font-size: 1.35rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.25rem;
      word-break: break-word;
    }

    .active-window-process {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--accent-cyan);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Telemetry Metrics */
    .metric-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .metric-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: var(--bg-card);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 0.75rem;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .fill-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-green { background: linear-gradient(90deg, #10b981, #34d399); }
    .fill-amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-rose { background: linear-gradient(90deg, #f43f5e, #fb7185); }

    /* App Usage List */
    .app-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .app-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.8rem;
      background: var(--bg-card);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.03);
    }

    .app-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .app-tag {
      font-size: 0.7rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .tag-productive { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
    .tag-browser { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); }
    .tag-communication { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
    .tag-entertainment { background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }
    .tag-utility { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    .transitions-chain {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-family: var(--font-mono);
      font-size: 0.85rem;
    }

    .transition-node {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      color: var(--accent-cyan);
    }

    .transition-arrow {
      color: var(--text-muted);
    }

    /* Code Block */
    pre {
      background: #090c14;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #93c5fd;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🪟</div>
        <div>
          <h1>Windows Context MCP</h1>
          <p>Real-Time Personal Context Stream for Gemini, ChatGPT & Claude</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="badge">
          <span class="badge-dot"></span>
          <span>Live Telemetry Active</span>
        </div>
        <button class="btn" onclick="copyMcpUrl()">📋 Copy MCP Endpoint</button>
      </div>
    </header>

    <!-- Active Window Banner -->
    <div class="grid">
      <div class="card col-12 active-window-card">
        <div class="card-title">Currently Focused Window</div>
        <div class="active-window-title" id="activeWindowTitle">Detecting...</div>
        <div class="active-window-process">
          <span id="activeProcessName">Process: --</span> &bull; 
          <span id="activeCategory">Category: --</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid">
      <div class="card col-3">
        <div class="card-title">Total PC Screen Time</div>
        <div class="metric-value" id="totalScreenTime">0m</div>
        <div class="metric-sub" id="productiveBreakdown">0m productive</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-blue" id="screenTimeBar" style="width: 0%"></div>
        </div>
      </div>

      <div class="card col-3">
        <div class="card-title">Productivity Score</div>
        <div class="metric-value" id="productivityScore">--</div>
        <div class="metric-sub" id="productivityAssessment">Calculating...</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-green" id="productivityBar" style="width: 0%"></div>
        </div>
      </div>

      <div class="card col-3">
        <div class="card-title">CPU Load</div>
        <div class="metric-value" id="cpuLoad">0%</div>
        <div class="metric-sub" id="cpuCores">Multi-core telemetry</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-amber" id="cpuBar" style="width: 0%"></div>
        </div>
      </div>

      <div class="card col-3">
        <div class="card-title">RAM Utilization</div>
        <div class="metric-value" id="ramUsage">0%</div>
        <div class="metric-sub" id="ramDetails">0 MB / 0 MB</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-rose" id="ramBar" style="width: 0%"></div>
        </div>
      </div>
    </div>

    <!-- App Usage & Transition Chain -->
    <div class="grid">
      <div class="card col-7">
        <div class="card-title">Top Applications Today</div>
        <ul class="app-list" id="appList">
          <li class="app-item">Loading application usage statistics...</li>
        </ul>
      </div>

      <div class="card col-5">
        <div class="card-title">Recent Application Switches</div>
        <div class="transitions-chain" id="transitionsChain">
          <span class="transition-node">Loading...</span>
        </div>
      </div>
    </div>

    <!-- AI Setup Box -->
    <div class="grid">
      <div class="card col-12">
        <div class="card-title">Model Context Protocol (MCP) Remote Endpoint</div>
        <pre><code>{
  "mcpServers": {
    "windowsContext": {
      "url": "http://localhost:3001/mcp",
      "transport": "http"
    }
  }
}</code></pre>
      </div>
    </div>
  </div>

  <script>
    async function fetchContext() {
      try {
        const res = await fetch('/api/context');
        if (!res.ok) return;
        const data = await res.json();

        // 1. Active Window
        document.getElementById('activeWindowTitle').innerText = data.activeWindow?.windowTitle || 'Desktop';
        document.getElementById('activeProcessName').innerText = 'Process: ' + (data.activeWindow?.processName || 'Desktop');
        document.getElementById('activeCategory').innerText = 'Category: ' + (data.activeWindow?.category || 'System');

        // 2. Summary Metrics
        const summary = data.todaySummary || {};
        document.getElementById('totalScreenTime').innerText = summary.totalScreenTimeFormatted || '0m';
        document.getElementById('productiveBreakdown').innerText = (summary.productiveFormatted || '0m') + ' productive / ' + (summary.entertainmentFormatted || '0m') + ' entertainment';

        const totalMin = summary.totalScreenTimeMinutes || 1;
        const prodMin = summary.productiveMinutes || 0;
        const score = Math.min(100, Math.max(0, Math.round((prodMin / totalMin) * 100)));
        document.getElementById('productivityScore').innerText = score + '/100';
        document.getElementById('productivityBar').style.width = score + '%';

        let assess = 'Balanced';
        if (score >= 75) assess = 'Highly Productive';
        else if (score >= 50) assess = 'Moderately Productive';
        else if (score >= 25) assess = 'Entertainment Leaning';
        else assess = 'High Distraction';
        document.getElementById('productivityAssessment').innerText = assess;

        // 3. Hardware Telemetry
        const perf = data.performance || {};
        document.getElementById('cpuLoad').innerText = (perf.cpuUsagePercent || 0) + '%';
        document.getElementById('cpuBar').style.width = (perf.cpuUsagePercent || 0) + '%';

        document.getElementById('ramUsage').innerText = (perf.usedMemoryPercent || 0) + '%';
        document.getElementById('ramBar').style.width = (perf.usedMemoryPercent || 0) + '%';
        document.getElementById('ramDetails').innerText = Math.round(perf.totalMemoryMB - perf.freeMemoryMB) + ' MB / ' + perf.totalMemoryMB + ' MB';

        // 4. App List
        const appListEl = document.getElementById('appList');
        if (summary.topApps && summary.topApps.length > 0) {
          appListEl.innerHTML = summary.topApps.map(app => {
            let tagClass = 'tag-utility';
            if (app.category === 'Productive') tagClass = 'tag-productive';
            else if (app.category === 'Browser') tagClass = 'tag-browser';
            else if (app.category === 'Communication') tagClass = 'tag-communication';
            else if (app.category === 'Entertainment') tagClass = 'tag-entertainment';

            return \`
              <li class="app-item">
                <div class="app-info">
                  <span class="app-tag \${tagClass}">\${app.category}</span>
                  <strong>\${app.displayName}</strong>
                </div>
                <div>
                  <span>\${app.durationMinutes}m</span>
                  <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">(\${app.percentageOfTotal}%)</span>
                </div>
              </li>
            \`;
          }).join('');
        } else {
          appListEl.innerHTML = '<li class="app-item">No tracked applications yet today.</li>';
        }

        // 5. Transitions
        const transitionsEl = document.getElementById('transitionsChain');
        if (summary.recentTransitions && summary.recentTransitions.length > 0) {
          transitionsEl.innerHTML = summary.recentTransitions.map((t, idx) => {
            return \`<span class="transition-node">\${t}</span>\${idx < summary.recentTransitions.length - 1 ? '<span class="transition-arrow">→</span>' : ''}\`;
          }).join(' ');
        }
      } catch (err) {
        console.error('Error fetching context:', err);
      }
    }

    function copyMcpUrl() {
      const url = window.location.origin + '/mcp';
      navigator.clipboard.writeText(url);
      alert('Copied MCP URL: ' + url);
    }

    // Refresh every 3 seconds
    fetchContext();
    setInterval(fetchContext, 3000);
  </script>
</body>
</html>`;
}
