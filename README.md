# Windows Context MCP 🪟⚡

**Windows Context MCP** is a high-performance, native backend service and **Model Context Protocol (MCP)** server for Windows. It exposes real-time PC activity, focused foreground application telemetry, system resource stats, and historical productivity analytics to AI agents like **Google Gemini**, **OpenAI ChatGPT**, and **Claude**.

---

## 🌟 Backend Features & Architecture

- **🗄️ Zero-Dependency SQLite Time-Series Engine (`src/db.ts`)**: Built on native `node:sqlite` for high-throughput persistence, indexed minute-by-minute focus session recording, and fast historical aggregations.
- **🔄 Dual Transport Support**:
  - **Streamable HTTP / JSON-RPC 2.0 (`src/server.ts`)**: REST + JSON-RPC on port `3001` for remote AI assistants (Gemini remote MCP & ChatGPT Actions).
  - **Native STDIO Transport (`src/stdio.ts`)**: Fast standard I/O stream for Claude Desktop, Cursor, and local CLI agents (`node dist/index.js --stdio`).
- **🪟 Win32 Native Interop (`src/collector.ts`)**: Direct User32 / CIM queries for active window titles, process binaries, CPU delta utilization, RAM usage, user idle detection, and battery telemetry.
- **📈 Advanced Productivity & Transition Tracking (`src/tracker.ts`)**: Hourly breakdown curves, 24-hour timelines, transition chains, and multi-day date range analytics.
- **🧪 Automated Test Suite**: 17 unit and integration tests across storage, telemetry, and tools (`npm test`).

---

## 🛠️ MCP Tools Reference (12 Tools)

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `get_current_windows_context` | Real-time | Full real-time snapshot: active window, screen time, CPU/RAM telemetry, battery. |
| `get_active_window` | Real-time | Focused foreground window title, process name, and category. |
| `get_pc_screen_time` | Aggregation | Today's screen time categorized by Productive, Entertainment, Communication, Browsing. |
| `get_pc_performance` | Telemetry | CPU load %, RAM total/free/used %, battery charge %, and AC state. |
| `get_productivity_score` | Analytics | Automated productivity score (0-100), balance ratio, and top distraction apps. |
| `search_window_history` | Search | Search application usage history today by process or window title query. |
| `get_idle_status` | Presence | User presence & idle duration (detects if user is actively typing or away). |
| `get_recent_transitions` | Chain | Chronological sequence of recent window and application switches. |
| `get_system_health` | Diagnostics | System resource health check, memory pressure level, and uptime. |
| `get_top_distractions` | Analytics | Identifies entertainment and distraction apps consuming the most time today. |
| `get_hourly_breakdown` | Historical | 24-hour timeline of productive vs entertainment minutes per hour for any date. |
| `get_historical_usage` | Historical | Multi-day productivity scores, duration trends, and top apps across a date range. |

---

## 🚀 Quick Start

### 1. Build
```bash
npm install
npm run build
```

### 2. Run Tests
```bash
npm test
```

### 3. Run Backend in HTTP Mode (for Gemini & ChatGPT)
```bash
npm start
```
*HTTP server starts on port `3001` with endpoint `http://localhost:3001/mcp`.*

### 4. Run Backend in STDIO Mode (for Claude Desktop & Local MCP Clients)
```bash
node dist/index.js --stdio
```

---

## 🔗 Claude Desktop Configuration (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "windowsContext": {
      "command": "node",
      "args": ["C:/Users/smnk2/.gemini/antigravity/scratch/windows-context-mcp/dist/index.js", "--stdio"]
    }
  }
}
```

---

## 🔗 Google Gemini Configuration

```json
{
  "mcpServers": {
    "windowsContext": {
      "url": "http://localhost:3001/mcp",
      "transport": "http"
    }
  }
}
```

---

## 📄 License
MIT License.
