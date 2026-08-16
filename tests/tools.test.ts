import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WindowsUsageTracker } from '../src/tracker.js';
import { WindowsSystemCollector } from '../src/collector.js';
import { WINDOWS_MCP_TOOLS_DEFINITIONS, executeWindowsMcpTool } from '../src/tools.js';

const TEST_DIR = './test_data_win_tools';

describe('Windows MCP Tools', () => {
  let tracker: WindowsUsageTracker;
  let collector: WindowsSystemCollector;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    tracker = new WindowsUsageTracker(TEST_DIR);
    collector = new WindowsSystemCollector();

    tracker.recordSample({
      processName: 'Code.exe',
      windowTitle: 'server.ts - VS Code',
      executablePath: 'C:\\VSCode\\Code.exe',
      category: 'Productive',
      timestamp: new Date().toISOString()
    });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should list all 6 MCP tools', () => {
    assert.equal(WINDOWS_MCP_TOOLS_DEFINITIONS.length, 6);
    const names = WINDOWS_MCP_TOOLS_DEFINITIONS.map(t => t.name);
    assert.ok(names.includes('get_current_windows_context'));
    assert.ok(names.includes('get_active_window'));
    assert.ok(names.includes('get_pc_screen_time'));
    assert.ok(names.includes('get_pc_performance'));
    assert.ok(names.includes('get_productivity_score'));
    assert.ok(names.includes('search_window_history'));
  });

  it('should execute get_active_window', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_active_window');
    assert.ok(res);
    assert.ok(typeof res.processName === 'string');
    assert.ok(typeof res.windowTitle === 'string');
  });

  it('should execute get_pc_screen_time', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_pc_screen_time');
    assert.ok(res);
    assert.ok(typeof res.screen_time_today_minutes === 'number');
    assert.ok(typeof res.productive_time_minutes === 'number');
  });

  it('should execute get_pc_performance', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_pc_performance');
    assert.ok(res);
    assert.ok(typeof res.cpuUsagePercent === 'number');
    assert.ok(typeof res.totalMemoryMB === 'number');
  });

  it('should execute get_productivity_score', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_productivity_score');
    assert.ok(res);
    assert.ok(typeof res.productivity_score === 'number');
    assert.ok(typeof res.assessment === 'string');
  });

  it('should execute search_window_history', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'search_window_history', { query: 'code' });
    assert.equal(res.match_count, 1);
    assert.equal(res.results[0].processName, 'Code.exe');
  });
});
