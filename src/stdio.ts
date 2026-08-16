import readline from 'node:readline';
import { WindowsUsageTracker } from './tracker.js';
import { WindowsSystemCollector } from './collector.js';
import { WINDOWS_MCP_TOOLS_DEFINITIONS, executeWindowsMcpTool } from './tools.js';

export function startStdioTransport(tracker: WindowsUsageTracker, collector: WindowsSystemCollector) {
  const SERVER_VERSION = '1.0.0';
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const sendResponse = (response: Record<string, unknown>) => {
    process.stdout.write(JSON.stringify(response) + '\n');
  };

  rl.on('line', (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const msg = JSON.parse(trimmed);
      const { jsonrpc, method, params, id } = msg || {};

      if (jsonrpc !== '2.0') {
        return sendResponse({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid JSON-RPC 2.0 message' },
          id: id || null
        });
      }

      switch (method) {
        case 'initialize': {
          return sendResponse({
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
          return sendResponse({ jsonrpc: '2.0', result: {}, id });
        }

        case 'tools/list': {
          return sendResponse({
            jsonrpc: '2.0',
            result: { tools: WINDOWS_MCP_TOOLS_DEFINITIONS },
            id
          });
        }

        case 'tools/call': {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};

          if (!toolName) {
            return sendResponse({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Missing tool name' },
              id
            });
          }

          const toolResult = executeWindowsMcpTool(tracker, collector, toolName, toolArgs);

          return sendResponse({
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
          return sendResponse({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${method}` },
            id
          });
        }
      }
    } catch (err: any) {
      sendResponse({
        jsonrpc: '2.0',
        error: { code: -32700, message: `Parse error: ${err.message}` },
        id: null
      });
    }
  });

  process.stderr.write(`[Windows Context MCP] STDIO JSON-RPC 2.0 Transport Active\n`);
}
