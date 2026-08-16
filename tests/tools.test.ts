import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WindowsUsageTracker } from '../src/tracker.js';
import { WindowsSystemCollector } from '../src/collector.js';
import { WINDOWS_MCP_TOOLS_DEFINITIONS, executeWindowsMcpTool } from '../src/tools.js';

const TEST_DIR = './test_data_win_tools';

describe('Windows MCP Tools (12 Tools Suite)', () => {
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

    tracker.recordSample({
      processName: 'Spotify.exe',
      windowTitle: 'Spotify Free',
      executablePath: 'C:\\Spotify\\Spotify.exe',
      category: 'Entertainment',
      timestamp: new Date().toISOString()
    });
  });

  afterEach(() => {
    tracker.close();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should list all 12 MCP tools', () => {
    assert.equal(WINDOWS_MCP_TOOLS_DEFINITIONS.length, 12);
    const names = WINDOWS_MCP_TOOLS_DEFINITIONS.map(t => t.name);
    assert.ok(names.includes('get_current_windows_context'));
    assert.ok(names.includes('get_active_window'));
    assert.ok(names.includes('get_pc_screen_time'));
    assert.ok(names.includes('get_pc_performance'));
    assert.ok(names.includes('get_productivity_score'));
    assert.ok(names.includes('search_window_history'));
    assert.ok(names.includes('get_idle_status'));
    assert.ok(names.includes('get_recent_transitions'));
    assert.ok(names.includes('get_system_health'));
    assert.ok(names.includes('get_top_distractions'));
    assert.ok(names.includes('get_hourly_breakdown'));
    assert.ok(names.includes('get_historical_usage'));
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
  });

  it('should execute get_pc_performance', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_pc_performance');
    assert.ok(res);
    assert.ok(typeof res.cpuUsagePercent === 'number');
  });

  it('should execute get_productivity_score', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_productivity_score');
    assert.ok(res);
    assert.ok(typeof res.productivity_score === 'number');
  });

  it('should execute search_window_history', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'search_window_history', { query: 'code' });
    assert.equal(res.match_count, 1);
    assert.equal(res.results[0].processName, 'Code.exe');
  });

  it('should execute get_idle_status', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_idle_status');
    assert.ok(res);
    assert.ok(typeof res.is_idle === 'boolean');
  });

  it('should execute get_recent_transitions', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_recent_transitions');
    assert.ok(res);
    assert.ok(typeof res.transition_chain === 'string');
  });

  it('should execute get_system_health', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_system_health');
    assert.ok(res);
    assert.ok(res.overall_status);
  });

  it('should execute get_top_distractions', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_top_distractions');
    assert.ok(res);
    assert.ok(Array.isArray(res.distracting_apps));
  });

  it('should execute get_hourly_breakdown', () => {
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_hourly_breakdown');
    assert.ok(res);
    assert.equal(res.hourly_stats.length, 24);
  });

  it('should execute get_historical_usage', () => {
    const today = new Date().toISOString().split('T')[0];
    const res: any = executeWindowsMcpTool(tracker, collector, 'get_historical_usage', {
      startDate: today,
      endDate: today
    });
    assert.ok(res);
    assert.ok(Array.isArray(res.history));
  });
});
