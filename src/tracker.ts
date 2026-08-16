import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  ActiveWindowInfo,
  WindowsAppUsageItem,
  WindowsContextSummary,
  WindowsCurrentContext,
  WindowsPerformanceTelemetry
} from './types.js';

interface StoredData {
  date: string;
  appDurationsSeconds: Record<string, { seconds: number; category: string; lastTitle: string }>;
  transitions: string[];
}

export class WindowsUsageTracker {
  private dataDir: string;
  private currentDay: string;
  private appDurationsSeconds: Map<string, { seconds: number; category: string; lastTitle: string }> = new Map();
  private transitions: string[] = [];
  private lastSampleTime: number = Date.now();
  private activeWindow: ActiveWindowInfo = {
    processName: 'Desktop',
    windowTitle: 'Desktop',
    executablePath: '',
    category: 'System',
    timestamp: new Date().toISOString()
  };

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.currentDay = new Date().toISOString().split('T')[0];
    this.initStorage();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const filePath = path.join(this.dataDir, `usage_${this.currentDay}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed: StoredData = JSON.parse(raw);
        if (parsed && parsed.date === this.currentDay) {
          for (const [app, info] of Object.entries(parsed.appDurationsSeconds || {})) {
            this.appDurationsSeconds.set(app, info);
          }
          this.transitions = parsed.transitions || [];
        }
      }
    } catch {
      // Memory fallback
    }
  }

  private persist() {
    try {
      const obj: Record<string, { seconds: number; category: string; lastTitle: string }> = {};
      for (const [key, val] of this.appDurationsSeconds.entries()) {
        obj[key] = val;
      }
      const filePath = path.join(this.dataDir, `usage_${this.currentDay}.json`);
      fs.writeFileSync(
        filePath,
        JSON.stringify({ date: this.currentDay, appDurationsSeconds: obj, transitions: this.transitions }, null, 2),
        'utf-8'
      );
    } catch {
      // Ignored
    }
  }

  /**
   * Sample tick: records time elapsed for the currently active window
   */
  public recordSample(windowInfo: ActiveWindowInfo) {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.currentDay) {
      this.currentDay = today;
      this.appDurationsSeconds.clear();
      this.transitions = [];
    }

    const now = Date.now();
    const elapsedSeconds = Math.max(1, Math.min(60, Math.round((now - this.lastSampleTime) / 1000)));
    this.lastSampleTime = now;
    this.activeWindow = windowInfo;

    const procName = windowInfo.processName || 'Desktop';
    const current = this.appDurationsSeconds.get(procName) || {
      seconds: 0,
      category: windowInfo.category,
      lastTitle: windowInfo.windowTitle
    };

    current.seconds += elapsedSeconds;
    current.category = windowInfo.category;
    current.lastTitle = windowInfo.windowTitle;
    this.appDurationsSeconds.set(procName, current);

    // Track transitions
    if (this.transitions.length === 0 || this.transitions[this.transitions.length - 1] !== procName) {
      this.transitions.push(procName);
      if (this.transitions.length > 20) {
        this.transitions.shift();
      }
    }

    this.persist();
  }

  public getTodaySummary(): WindowsContextSummary {
    let totalSeconds = 0;
    let productiveSeconds = 0;
    let entertainmentSeconds = 0;
    let communicationSeconds = 0;
    let browserSeconds = 0;

    const apps: WindowsAppUsageItem[] = [];

    for (const [proc, data] of this.appDurationsSeconds.entries()) {
      totalSeconds += data.seconds;
      if (data.category === 'Productive') productiveSeconds += data.seconds;
      else if (data.category === 'Entertainment') entertainmentSeconds += data.seconds;
      else if (data.category === 'Communication') communicationSeconds += data.seconds;
      else if (data.category === 'Browser') browserSeconds += data.seconds;

      const durationMinutes = Math.round(data.seconds / 60);
      apps.push({
        processName: proc,
        displayName: proc.replace(/\.exe$/i, ''),
        durationMinutes,
        percentageOfTotal: 0,
        category: data.category,
        lastActive: new Date().toISOString()
      });
    }

    apps.sort((a, b) => b.durationMinutes - a.durationMinutes);
    const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));

    for (const app of apps) {
      app.percentageOfTotal = Number(((app.durationMinutes / totalMinutes) * 100).toFixed(1));
    }

    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const productiveMinutes = Math.round(productiveSeconds / 60);
    const entertainmentMinutes = Math.round(entertainmentSeconds / 60);
    const communicationMinutes = Math.round(communicationSeconds / 60);
    const browserMinutes = Math.round(browserSeconds / 60);

    return {
      date: this.currentDay,
      totalScreenTimeMinutes: totalMinutes,
      totalScreenTimeFormatted: formatTime(totalMinutes),
      productiveMinutes,
      productiveFormatted: formatTime(productiveMinutes),
      entertainmentMinutes,
      entertainmentFormatted: formatTime(entertainmentMinutes),
      communicationMinutes,
      communicationFormatted: formatTime(communicationMinutes),
      browserMinutes,
      browserFormatted: formatTime(browserMinutes),
      topApps: apps,
      recentTransitions: [...this.transitions]
    };
  }

  public getCurrentContext(telemetry: WindowsPerformanceTelemetry): WindowsCurrentContext {
    return {
      platform: 'windows',
      hostname: os.hostname(),
      username: os.userInfo().username || 'User',
      timestamp: new Date().toISOString(),
      activeWindow: this.activeWindow,
      performance: telemetry,
      todaySummary: this.getTodaySummary()
    };
  }
}
