import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WindowsUsageTracker } from '../src/tracker.js';

const TEST_DIR = './test_data_win_tracker';

describe('WindowsUsageTracker', () => {
  let tracker: WindowsUsageTracker;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    tracker = new WindowsUsageTracker(TEST_DIR);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should initialize with empty state on today', () => {
    const summary = tracker.getTodaySummary();
    assert.equal(summary.topApps.length, 0);
    assert.equal(summary.productiveMinutes, 0);
    assert.equal(summary.entertainmentMinutes, 0);
  });

  it('should accumulate time and transitions for active windows', () => {
    tracker.recordSample({
      processName: 'Code.exe',
      windowTitle: 'tracker.ts - Visual Studio Code',
      executablePath: 'C:\\Program Files\\VSCode\\Code.exe',
      category: 'Productive',
      timestamp: new Date().toISOString()
    });

    tracker.recordSample({
      processName: 'chrome.exe',
      windowTitle: 'Google Search - Google Chrome',
      executablePath: 'C:\\Program Files\\Chrome\\chrome.exe',
      category: 'Browser',
      timestamp: new Date().toISOString()
    });

    const summary = tracker.getTodaySummary();
    assert.equal(summary.topApps.length, 2);
    assert.deepEqual(summary.recentTransitions, ['Code.exe', 'chrome.exe']);
  });

  it('should compute full context with system telemetry', () => {
    const mockTelemetry = {
      cpuUsagePercent: 15,
      totalMemoryMB: 16384,
      freeMemoryMB: 8192,
      usedMemoryPercent: 50,
      batteryPercent: 95,
      isCharging: true,
      powerSource: 'AC Power',
      idleSeconds: 0,
      uptimeSeconds: 12000
    };

    const context = tracker.getCurrentContext(mockTelemetry);
    assert.equal(context.platform, 'windows');
    assert.equal(context.performance.cpuUsagePercent, 15);
    assert.equal(context.performance.batteryPercent, 95);
    assert.ok(context.hostname);
  });
});
