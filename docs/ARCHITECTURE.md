# Windows Context MCP Architecture 🪟⚙️

## System Overview

```mermaid
flowchart TD
    subgraph WindowsDesktop ["Windows Desktop Environment"]
        User["User Interaction & Applications"]
        Win32API["Win32 API (User32 / CIM / OS)"]
        User --> Win32API
    end

    subgraph WindowsMCP ["Windows Context MCP Service (:3001)"]
        Collector["WindowsSystemCollector (Native Polling)"]
        Tracker["WindowsUsageTracker (Time Accumulator)"]
        Store["File & Memory Persistence (./data)"]
        HTTPServer["Express + MCP JSON-RPC Server"]
        
        Win32API -->|Sample Window & Telemetry| Collector
        Collector -->|Record Tick| Tracker
        Tracker <-->|Persist / Load| Store
        Tracker -->|Aggregate Summary| HTTPServer
        Collector -->|Live Hardware Telemetry| HTTPServer
    end

    subgraph AIAssistants ["AI Clients"]
        Gemini["Google Gemini (Remote MCP Gateway)"]
        ChatGPT["OpenAI ChatGPT (Custom GPT Actions)"]
        Claude["Claude Desktop / Local MCP Clients"]
        
        HTTPServer <-->|Streamable HTTP /mcp| Gemini
        HTTPServer <-->|REST /api/context| ChatGPT
        HTTPServer <-->|JSON-RPC 2.0| Claude
    end
```

## Core Modules

1. **`WindowsSystemCollector` (`src/collector.ts`)**:
   - Queries `GetForegroundWindow`, `GetWindowText`, and `GetWindowThreadProcessId` via native PowerShell Win32 bindings.
   - Extracts CPU %, RAM total/free/used %, and battery charging states.

2. **`WindowsUsageTracker` (`src/tracker.ts`)**:
   - Accumulates active seconds per executable.
   - Categorizes apps into Productive, Communication, Entertainment, and Browsing.
   - Persists daily snapshots in `data/usage_YYYY-MM-DD.json`.

3. **`Server & MCP Handlers` (`src/server.ts` & `src/tools.ts`)**:
   - Provides standard JSON-RPC 2.0 protocol on `/mcp`.
   - Exposes 6 specialized MCP tools for AI productivity workflows.
