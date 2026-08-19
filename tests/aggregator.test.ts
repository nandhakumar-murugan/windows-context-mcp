import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WindowsUsageTracker } from '../src/tracker.js';
import { WindowsSystemCollector } from '../src/collector.js';
import { CrossDeviceAggregator } from '../src/aggregator.js';

const TEST_DIR = './test_data_aggregator';

describe('CrossDeviceAggregator (Unified Hub)', () => {
  let tracker: WindowsUsageTracker;
  let collector: WindowsSystemCollector;
  let aggregator: CrossDeviceAggregator;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    tracker = new WindowsUsageTracker(TEST_DIR);
    collector = new WindowsSystemCollector();
    aggregator = new CrossDeviceAggregator();

    // Record sample PC activity
    tracker.recordSample({
      processName: 'Code.exe',
      windowTitle: 'aggregator.ts - VS Code',
      executablePath: 'C:\\VSCode\\Code.exe',
      category: 'Productive',
      timestamp: new Date().toISOString()
    });
  });

  afterEach(() => {
    tracker.close();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should ingest and store Android context snapshot', () => {
    const mockPayload = {
      deviceId: 'pixel_9_pro',
      deviceName: 'Pixel 9 Pro',
      timestamp: Date.now(),
      currentContext: {
        currentAppName: 'Slack',
        currentAppPackage: 'com.Slack'
      },
      todaySummary: {
        totalScreenTimeMinutes: 90,
        productiveMinutes: 60,
        entertainmentMinutes: 30,
        topApps: [
          { appName: 'Slack', durationMinutes: 60, percentage: 66.7, category: 'Communication' },
          { appName: 'YouTube', durationMinutes: 30, percentage: 33.3, category: 'Entertainment' }
        ],
        recentAppsSequence: ['Chrome', 'Slack']
      },
      deviceState: {
        batteryPercent: 88,
        isCharging: true,
        powerSource: 'Wireless Charging',
        networkType: 'WiFi 6'
      }
    };

    const snapshot = aggregator.ingestAndroidPayload(mockPayload);
    assert.equal(snapshot.deviceId, 'pixel_9_pro');
    assert.equal(snapshot.screenTimeTodayMinutes, 90);
    assert.equal(snapshot.batteryPercent, 88);

    const latest = aggregator.getLatestAndroidSnapshot();
    assert.ok(latest);
    assert.equal(latest.currentAppName, 'Slack');
  });

  it('should compute unified cross-device context', () => {
    aggregator.ingestAndroidPayload({
      deviceId: 'galaxy_s24',
      todaySummary: {
        totalScreenTimeMinutes: 120,
        productiveMinutes: 80,
        entertainmentMinutes: 40,
        topApps: [{ appName: 'Gmail', durationMinutes: 80, category: 'Productive' }]
      },
      deviceState: { batteryPercent: 95 }
    });

    const unified = aggregator.getUnifiedContext(tracker, collector);
    assert.ok(unified);
    assert.ok(unified.total_screen_time_minutes >= 120);
    assert.ok(unified.devices.windows_pc);
    assert.ok(unified.devices.android_phone);
    assert.equal(unified.devices.android_phone?.batteryPercent, 95);
    assert.ok(unified.top_apps_across_devices.length > 0);
  });

  it('should compute cross-device screen time comparison', () => {
    aggregator.ingestAndroidPayload({
      deviceId: 'test_phone',
      todaySummary: {
        totalScreenTimeMinutes: 45
      }
    });

    const comparison = aggregator.getCrossDeviceScreenTime(tracker);
    assert.equal(comparison.android_screen_time_minutes, 45);
    assert.equal(comparison.has_synced_mobile, true);
  });
});
