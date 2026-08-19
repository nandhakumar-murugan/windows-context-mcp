import express, { Request, Response } from 'express';
import cors from 'cors';
import { WindowsUsageTracker } from './tracker.js';
import { WindowsSystemCollector } from './collector.js';
import { CrossDeviceAggregator } from './aggregator.js';
import { WINDOWS_MCP_TOOLS_DEFINITIONS, executeWindowsMcpTool } from './tools.js';
import { renderDashboardHtml } from './dashboard.js';

export function createServer(
  tracker: WindowsUsageTracker,
  collector: WindowsSystemCollector,
  aggregator: CrossDeviceAggregator = new CrossDeviceAggregator()
) {
  const app = express();
  const SERVER_VERSION = '1.1.0';

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // 1. Interactive Real-Time Web Dashboard
  app.get('/', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderDashboardHtml());
  });

  // 2. Health Diagnostics
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Windows Context MCP Unified Hub',
      version: SERVER_VERSION,
      platform: 'windows',
      uptime_seconds: Math.floor(process.uptime()),
      connected_android_devices: aggregator.getAllDevicesList().length,
      tools: WINDOWS_MCP_TOOLS_DEFINITIONS.map(t => t.name)
    });
  });

  // 3. Direct PC Context Inspection
  app.get('/api/context', (req: Request, res: Response) => {
    const telemetry = collector.getPerformanceTelemetry();
    res.json(tracker.getCurrentContext(telemetry));
  });

  // 4. Unified Cross-Device Context Inspection
  app.get('/api/context/unified', (req: Request, res: Response) => {
    res.json(aggregator.getUnifiedContext(tracker, collector));
  });

  // 5. Ingestion endpoint for Android & external client sync
  app.post('/api/sync', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Empty payload' });
      }
      const snapshot = aggregator.ingestAndroidPayload(payload);
      return res.status(200).json({
        success: true,
        message: 'Context snapshot merged into Windows Hub',
        deviceId: snapshot.deviceId,
        receivedAt: Date.now()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Sync processing failed' });
    }
  });

  // 6. MCP JSON-RPC 2.0 Handler (/mcp)
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

          const toolResult = executeWindowsMcpTool(tracker, collector, toolName, toolArgs, aggregator);

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

  // 7. SSE Streamable Endpoint
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
