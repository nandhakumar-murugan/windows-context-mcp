import dotenv from 'dotenv';
import { WindowsSystemCollector } from './collector.js';
import { WindowsUsageTracker } from './tracker.js';
import { createServer } from './server.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL_SECONDS = parseInt(process.env.POLL_INTERVAL_SECONDS || '5', 10);
const DATA_DIR = process.env.DATA_DIR || './data';

const collector = new WindowsSystemCollector();
const tracker = new WindowsUsageTracker(DATA_DIR);

// Start sampling loop for Windows active window
console.log(`[Windows Collector] Initialized background polling every ${POLL_INTERVAL_SECONDS}s`);
setInterval(() => {
  try {
    const activeWindow = collector.getActiveWindow();
    tracker.recordSample(activeWindow);
  } catch (err) {
    console.error('[Windows Collector Error]', err);
  }
}, POLL_INTERVAL_SECONDS * 1000);

// Sample immediately on start
try {
  const initialWindow = collector.getActiveWindow();
  tracker.recordSample(initialWindow);
} catch (e) {
  // Ignored
}

// Start MCP Server
const app = createServer(tracker, collector);

app.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🪟 Windows Context MCP Server running at http://${HOST}:${PORT}`);
  console.log(`📡 MCP Streamable HTTP Endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`🩺 Diagnostics Endpoint: http://${HOST}:${PORT}/health`);
  console.log(`🔍 Quick Context View: http://${HOST}:${PORT}/api/context`);
  console.log(`=======================================================`);
});
