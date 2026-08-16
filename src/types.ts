/**
 * Windows Context MCP - TypeScript Types
 */

export interface ActiveWindowInfo {
  processName: string;
  windowTitle: string;
  executablePath: string;
  category: string;
  timestamp: string;
}

export interface WindowsPerformanceTelemetry {
  cpuUsagePercent: number;
  totalMemoryMB: number;
  freeMemoryMB: number;
  usedMemoryPercent: number;
  batteryPercent: number;
  isCharging: boolean;
  powerSource: string;
  idleSeconds: number;
  uptimeSeconds: number;
}

export interface WindowsAppUsageItem {
  processName: string;
  displayName: string;
  durationMinutes: number;
  percentageOfTotal: number;
  category: string;
  lastActive: string;
}

export interface WindowsContextSummary {
  date: string;
  totalScreenTimeMinutes: number;
  totalScreenTimeFormatted: string;
  productiveMinutes: number;
  productiveFormatted: string;
  entertainmentMinutes: number;
  entertainmentFormatted: string;
  communicationMinutes: number;
  communicationFormatted: string;
  browserMinutes: number;
  browserFormatted: string;
  topApps: WindowsAppUsageItem[];
  recentTransitions: string[];
}

export interface WindowsCurrentContext {
  platform: 'windows';
  hostname: string;
  username: string;
  timestamp: string;
  activeWindow: ActiveWindowInfo;
  performance: WindowsPerformanceTelemetry;
  todaySummary: WindowsContextSummary;
}
