# Connecting Windows Context MCP to ChatGPT

## Custom GPT Action Schema

In ChatGPT -> **Create a GPT** -> **Actions**:

```yaml
openapi: 3.1.0
info:
  title: Windows Context API
  description: Connects real-time Windows PC context, active window, and screen time to ChatGPT.
  version: 1.0.0
servers:
  - url: http://localhost:3001
paths:
  /api/context:
    get:
      operationId: getWindowsContext
      summary: Retrieve current Windows PC screen time, active application, and performance
      responses:
        '200':
          description: Windows Context Snapshot
          content:
            application/json:
              schema:
                type: object
```
