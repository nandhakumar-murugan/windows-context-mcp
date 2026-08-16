# Connecting Windows Context MCP to Google Gemini

## MCP Configuration for Gemini

In your Gemini Developer or MCP Gateway settings:

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

### Example Gemini Queries

- *"What application am I currently focusing on on my PC?"* -> Gemini calls `get_active_window`.
- *"How many hours did I code today versus browsing?"* -> Gemini calls `get_pc_screen_time`.
- *"What is my PC's battery and CPU load right now?"* -> Gemini calls `get_pc_performance`.
