import { WindowsUsageTracker } from './tracker.js';
import { WindowsSystemCollector } from './collector.js';
import { WindowsCurrentContext } from './types.js';

export interface AndroidDeviceSnapshot {
  deviceId: string;
  deviceName?: string;
  timestamp: number;
  currentAppName: string;
  currentAppPackage: string;
  screenTimeTodayMinutes: number;
  productiveMinutes: number;
  entertainmentMinutes: number;
  topApps: Array<{
    appName: string;
    packageName: string;
    durationMinutes: number;
    percentage: number;
    category?: string;
  }>;
  recentAppsSequence: string[];
  batteryPercent: number;
  isCharging: boolean;
  powerSource: string;
  networkType: string;
  lastSyncedAt: string;
}

export interface UnifiedCrossDeviceContext {
  timestamp: string;
  total_screen_time_minutes: number;
  total_screen_time_formatted: string;
  total_productive_minutes: number;
  total_entertainment_minutes: number;
  cross_device_productivity_score: number;
  devices: {
    windows_pc: {
      hostname: string;
      active_window: string;
      active_process: string;
      screen_time_minutes: number;
      cpu_usage_percent: number;
      ram_used_percent: number;
      battery_percent: number;
      is_charging: boolean;
    };
    android_phone: AndroidDeviceSnapshot | null;
  };
  top_apps_across_devices: Array<{
    device: 'PC' | 'Mobile';
    appName: string;
    durationMinutes: number;
    category: string;
  }>;
}

export class CrossDeviceAggregator {
  private androidSnapshots: Map<string, AndroidDeviceSnapshot> = new Map();

  /**
   * Ingest context payload from Android Context Collector
   */
  public ingestAndroidPayload(payload: any): AndroidDeviceSnapshot {
    const current = payload.currentContext || {};
    const summary = payload.todaySummary || {};
    const deviceState = payload.deviceState || {};

    const snapshot: AndroidDeviceSnapshot = {
      deviceId: payload.deviceId || 'android_device_primary',
      deviceName: payload.deviceName || 'Android Smartphone',
      timestamp: payload.timestamp || Date.now(),
      currentAppName: current.currentAppName || 'Standby',
      currentAppPackage: current.currentAppPackage || 'com.android.launcher',
      screenTimeTodayMinutes: summary.totalScreenTimeMinutes || current.screenTimeTodayMinutes || 0,
      productiveMinutes: summary.productiveMinutes || 0,
      entertainmentMinutes: summary.entertainmentMinutes || 0,
      topApps: (summary.topApps || payload.topApps || []).map((app: any) => ({
        appName: app.appName || 'Unknown',
        packageName: app.packageName || '',
        durationMinutes: app.durationMinutes || 0,
        percentage: app.percentage || app.percentageOfTotal || 0,
        category: app.category || 'General'
      })),
      recentAppsSequence: summary.recentAppsSequence || payload.recentApps || [],
      batteryPercent: deviceState.batteryPercent ?? 100,
      isCharging: deviceState.isCharging ?? false,
      powerSource: deviceState.powerSource || 'Battery',
      networkType: deviceState.networkType || 'Unknown',
      lastSyncedAt: new Date().toISOString()
    };

    this.androidSnapshots.set(snapshot.deviceId, snapshot);
    return snapshot;
  }

  public getLatestAndroidSnapshot(): AndroidDeviceSnapshot | null {
    if (this.androidSnapshots.size === 0) return null;
    return Array.from(this.androidSnapshots.values())[0];
  }

  public getAllDevicesList() {
    return Array.from(this.androidSnapshots.values());
  }

  /**
   * Generates a unified cross-device context combining Windows PC and Android
   */
  public getUnifiedContext(
    tracker: WindowsUsageTracker,
    collector: WindowsSystemCollector
  ): UnifiedCrossDeviceContext {
    const telemetry = collector.getPerformanceTelemetry();
    const pcContext: WindowsCurrentContext = tracker.getCurrentContext(telemetry);
    const android = this.getLatestAndroidSnapshot();

    const pcMinutes = pcContext.todaySummary.totalScreenTimeMinutes || 0;
    const mobileMinutes = android ? android.screenTimeTodayMinutes : 0;
    const totalMinutes = pcMinutes + mobileMinutes;

    const pcProd = pcContext.todaySummary.productiveMinutes || 0;
    const mobileProd = android ? android.productiveMinutes : 0;
    const totalProd = pcProd + mobileProd;

    const pcEnt = pcContext.todaySummary.entertainmentMinutes || 0;
    const mobileEnt = android ? android.entertainmentMinutes : 0;
    const totalEnt = pcEnt + mobileEnt;

    const combinedScore = totalMinutes > 0 ? Math.min(100, Math.round((totalProd / totalMinutes) * 100)) : 50;

    const formatTime = (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // Combine top apps from both devices
    const topApps: Array<{ device: 'PC' | 'Mobile'; appName: string; durationMinutes: number; category: string }> = [];

    for (const app of pcContext.todaySummary.topApps) {
      topApps.push({
        device: 'PC',
        appName: app.displayName,
        durationMinutes: app.durationMinutes,
        category: app.category
      });
    }

    if (android) {
      for (const app of android.topApps) {
        topApps.push({
          device: 'Mobile',
          appName: app.appName,
          durationMinutes: app.durationMinutes,
          category: app.category || 'General'
        });
      }
    }

    topApps.sort((a, b) => b.durationMinutes - a.durationMinutes);

    return {
      timestamp: new Date().toISOString(),
      total_screen_time_minutes: totalMinutes,
      total_screen_time_formatted: formatTime(totalMinutes),
      total_productive_minutes: totalProd,
      total_entertainment_minutes: totalEnt,
      cross_device_productivity_score: combinedScore,
      devices: {
        windows_pc: {
          hostname: pcContext.hostname,
          active_window: pcContext.activeWindow.windowTitle,
          active_process: pcContext.activeWindow.processName,
          screen_time_minutes: pcMinutes,
          cpu_usage_percent: telemetry.cpuUsagePercent,
          ram_used_percent: telemetry.usedMemoryPercent,
          battery_percent: telemetry.batteryPercent,
          is_charging: telemetry.isCharging
        },
        android_phone: android
      },
      top_apps_across_devices: topApps.slice(0, 10)
    };
  }

  public getCrossDeviceScreenTime(tracker: WindowsUsageTracker) {
    const pcSummary = tracker.getTodaySummary();
    const android = this.getLatestAndroidSnapshot();

    const pcMinutes = pcSummary.totalScreenTimeMinutes;
    const mobileMinutes = android ? android.screenTimeTodayMinutes : 0;
    const totalMinutes = pcMinutes + mobileMinutes;

    return {
      total_combined_screen_time_minutes: totalMinutes,
      total_combined_formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      windows_pc_screen_time_minutes: pcMinutes,
      windows_pc_formatted: pcSummary.totalScreenTimeFormatted,
      android_screen_time_minutes: mobileMinutes,
      android_formatted: android ? `${Math.floor(mobileMinutes / 60)}h ${mobileMinutes % 60}m` : '0m (No sync yet)',
      has_synced_mobile: android !== null,
      last_mobile_sync: android ? android.lastSyncedAt : null
    };
  }
}
