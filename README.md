# Windows Context MCP 🪟⚡

**Windows Context MCP** is a high-performance, native Windows service, **Model Context Protocol (MCP)** server, and **Unified Personal Context Hub** connecting Windows desktop activity and Android mobile telemetry directly into conversational AI assistants like **Google Gemini**, **OpenAI ChatGPT**, and **Claude**.

---

## 🌟 Features & Architecture

- **🗄️ Zero-Dependency SQLite Time-Series (`src/db.ts`)**: Built on native `node:sqlite` for persistent indexed focus sessions, 24-hour hourly distributions, and multi-day range analytics.
- **📱 Unified Cross-Device Hub (`src/aggregator.ts`)**: Ingests Android screen time and telemetry via `/api/sync`, calculating combined multi-device screen time, cross-device top applications, and device fleet health.
- **🔄 Dual Protocol Transports**:
  - **Streamable HTTP / JSON-RPC 2.0 (`src/server.ts`)**: Remote MCP gateway on port `3001` for Google Gemini & ChatGPT Custom GPT Actions.
  - **Native STDIO Transport (`src/stdio.ts`)**: Standard I/O stream for Claude Desktop, Cursor, and local CLI agents (`node dist/index.js --stdio`).
- **🪟 Native Win32 API Queries (`src/collector.ts`)**: Direct User32 / CIM queries for active window titles, process binaries, CPU delta utilization, RAM usage, user idle detection, and battery telemetry.
- **🧪 Comprehensive Test Suite**: 23 automated unit and integration tests across SQLite database, cross-device aggregation, and tool executions (`npm test`).

---

## 🛠️ MCP Tools Reference (15 Tools)

| Tool Name | Type | Description |
| :--- | :--- | :--- |
| `get_current_windows_context` | Real-time | Full real-time snapshot: active window, screen time, CPU/RAM telemetry, battery. |
| `get_active_window` | Real-time | Focused foreground window title, process name, and category. |
| `get_pc_screen_time` | Aggregation | Today's PC screen time categorized by Productive, Entertainment, Communication, Browsing. |
| `get_pc_performance` | Telemetry | CPU load %, RAM total/free/used %, battery charge %, and AC state. |
| `get_productivity_score` | Analytics | Automated productivity score (0-100), balance ratio, and top distraction apps. |
| `search_window_history` | Search | Search application usage history today by process or window title query. |
| `get_idle_status` | Presence | User presence & idle duration (detects if user is actively typing or away). |
| `get_recent_transitions` | Chain | Chronological sequence of recent window and application switches. |
| `get_system_health` | Diagnostics | System resource health check, memory pressure level, and uptime. |
| `get_top_distractions` | Analytics | Identifies entertainment and distraction apps consuming the most time today. |
| `get_hourly_breakdown` | Historical | 24-hour timeline of productive vs entertainment minutes per hour for any date. |
| `get_historical_usage` | Historical | Multi-day productivity scores, duration trends, and top apps across a date range. |
| `get_unified_context` | Cross-Device | Combined snapshot merging PC desktop activity with synced Android phone context. |
| `get_cross_device_screen_time` | Cross-Device | Total combined screen time across PC and mobile with device breakdown. |
| `get_device_fleet` | Cross-Device | Lists all connected devices (Windows PC + Android phones) with sync status. |

---

## 🚀 Quick Start

### 1. Run via NPX (1-Click Execution)
```bash
npx windows-context-mcp --stdio
```

### 2. Build & Test Locally
```bash
npm install
npm test
npm run build
npm start
```
*HTTP server starts on port `3001` with endpoint `http://localhost:3001/mcp` and live UI at `http://localhost:3001`.*

---

## 🔗 AI Assistant Setup

### Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json`)
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

### Google Gemini / ChatGPT (HTTP Mode)
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
