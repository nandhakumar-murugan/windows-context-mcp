# Windows Context MCP 🪟⚡

**Windows Context MCP** connects live Windows desktop context (active foreground window, application screen time, RAM/CPU/Battery hardware telemetry) directly into conversational AI assistants such as **Google Gemini**, **OpenAI ChatGPT**, and **Claude** via the **Model Context Protocol (MCP)**.

---

## 🌟 Features

- **🪟 Active Foreground Window Tracking**: Native Win32 API interop querying active process name and window title.
- **⏱️ Daily Screen Time Accumulator**: Tracks active duration per application and classifies into Productive, Communication, Entertainment, and Browsing.
- **📊 Real-Time Web Dashboard**: Built-in interactive browser UI (`http://localhost:3001`) with live gauges, app charts, and transition chains.
- **⚡ Hardware Performance Telemetry**: CPU load percentage, RAM utilization, user idle detection, and battery state.
- **🤖 Native Model Context Protocol (MCP) Server**: Full Streamable HTTP MCP & JSON-RPC 2.0 endpoints for remote and local AI agents.
- **🧪 Comprehensive Test Suite**: 13 automated unit tests with `npm test`.
- **🚀 Windows Auto-Start**: Includes silent background startup scripts in `scripts/`.

---

## 🛠️ MCP Tools Reference (10 Tools)

| Tool Name | Description |
| :--- | :--- |
| `get_current_windows_context` | Full real-time Windows context snapshot (active window, today's PC screen time, top apps, battery/CPU). |
| `get_active_window` | Currently focused foreground window title and process name. |
| `get_pc_screen_time` | Total screen time today with categorized breakdown (Productive vs Entertainment vs Browsing). |
| `get_pc_performance` | CPU load %, RAM total/free/used %, and battery charging state. |
| `get_productivity_score` | Automated PC productivity score (0-100), balance assessment, and top distracting apps. |
| `search_window_history` | Searches application usage history today by process or window title. |
| `get_idle_status` | Returns whether the user is actively working on the PC or currently away/idle. |
| `get_recent_transitions` | Chronological sequence of recent window and application switches. |
| `get_system_health` | Checks overall system resource health, memory pressure, and uptime. |
| `get_top_distractions` | Pinpoints entertainment/gaming apps that consumed the most time on PC. |

---

## 🚀 Quick Start

### 1. Installation & Build
```bash
npm install
npm run build
```

### 2. Run Tests
```bash
npm test
```

### 3. Start Server & Live Dashboard
```bash
npm start
```
*Open `http://localhost:3001` in your browser to view the live dashboard!*

---

## 🔄 Windows Background & Startup Integration

To launch automatically on Windows login in silent background mode:

```powershell
# Register startup task:
powershell -ExecutionPolicy Bypass -File scripts\install-startup.ps1

# To remove:
powershell -ExecutionPolicy Bypass -File scripts\uninstall-startup.ps1
```

---

## 🔗 AI Integration

### Google Gemini
Configure the remote MCP server URL in Gemini or AI Studio settings:
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

### ChatGPT Actions & Claude Desktop
Add `http://localhost:3001/mcp` or create a Custom GPT Action pointing to `http://localhost:3001/api/context`.

---

## 📄 License
MIT License.
