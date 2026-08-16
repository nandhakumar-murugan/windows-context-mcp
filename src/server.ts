import express, { Request, Response } from 'express';
import cors from 'cors';
import { WindowsUsageTracker } from './tracker.js';
import { WindowsSystemCollector } from './collector.js';
import { WINDOWS_MCP_TOOLS_DEFINITIONS, executeWindowsMcpTool } from './tools.js';

export function createServer(tracker: WindowsUsageTracker, collector: WindowsSystemCollector) {
  const app = express();
  const SERVER_VERSION = '1.0.0';

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // 1. Health Diagnostics
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Windows Context MCP Server',
      version: SERVER_VERSION,
      platform: 'windows',
      uptime_seconds: Math.floor(process.uptime()),
      tools: WINDOWS_MCP_TOOLS_DEFINITIONS.map(t => t.name)
    });
  });

  // 2. Direct Context Inspection
  app.get('/api/context', (req: Request, res: Response) => {
    const telemetry = collector.getPerformanceTelemetry();
    res.json(tracker.getCurrentContext(telemetry));
  });

  // 3. MCP JSON-RPC 2.0 Handler (/mcp)
  app.post('/mcp', async (req: Request, res: Response) => {
    const { jsonrpc, method, params, id } = req.body || {};

    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request: Expected jsonrpc 2.0' },
        id: id || null
      });
    }

    try {
      switch (method) {
        case 'initialize': {
          return res.json({
            jsonrpc: '2.0',
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'windows-context-mcp', version: SERVER_VERSION }
            },
            id
          });
        }

        case 'ping': {
          return res.json({ jsonrpc: '2.0', result: {}, id });
        }

        case 'tools/list': {
          return res.json({
            jsonrpc: '2.0',
            result: { tools: WINDOWS_MCP_TOOLS_DEFINITIONS },
            id
          });
        }

        case 'tools/call': {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};

          if (!toolName) {
            return res.status(400).json({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Missing tool name' },
              id
            });
          }

          const toolResult = executeWindowsMcpTool(tracker, collector, toolName, toolArgs);

          return res.json({
            jsonrpc: '2.0',
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2)
                }
              ],
              isError: false
            },
            id
          });
        }

        default: {
          return res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id
          });
        }
      }
    } catch (err: any) {
      return res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: err.message || 'Internal tool execution error' },
        id
      });
    }
  });

  // 4. SSE Streamable Endpoint
  app.get('/mcp/sse', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`event: endpoint\ndata: /mcp\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  return app;
}
