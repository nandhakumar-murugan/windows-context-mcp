import { WindowsUsageTracker } from './tracker.js';
import { WindowsSystemCollector } from './collector.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export const WINDOWS_MCP_TOOLS_DEFINITIONS: McpToolDefinition[] = [
  {
    name: 'get_current_windows_context',
    description: 'Retrieves complete real-time Windows PC context including currently active window, top applications, screen time, CPU/RAM utilization, and battery state.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_active_window',
    description: 'Returns the currently focused foreground window title, process name, and category on the Windows desktop.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_pc_screen_time',
    description: 'Retrieves today\'s total PC screen time with categorized breakdown (Productive vs Entertainment vs Communication vs Browsing).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_pc_performance',
    description: 'Retrieves real-time hardware telemetry: CPU load percentage, RAM usage (total, free, used %), battery percentage, and charging state.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_productivity_score',
    description: 'Calculates an automated PC productivity score (0-100), ratio, category balance, and top distracting applications today.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_window_history',
    description: 'Searches application usage history today by process name or window title keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword to search for in application or process name'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_idle_status',
    description: 'Returns whether the user is actively working on the PC or currently away/idle.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_recent_transitions',
    description: 'Returns the chronological sequence of recent window and application switches (e.g. VS Code -> Chrome -> Slack).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_system_health',
    description: 'Checks overall system resource status including memory pressure, CPU load, and system uptime.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_top_distractions',
    description: 'Pinpoints entertainment, gaming, or distraction applications that consumed the most time on PC today.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_hourly_breakdown',
    description: 'Retrieves 24-hour hourly productivity timeline showing productive vs entertainment minutes per hour for today or a specific date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (defaults to today)'
        }
      }
    }
  },
  {
    name: 'get_historical_usage',
    description: 'Retrieves multi-day productivity stats, scores, and top applications over a specified date range.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['startDate', 'endDate']
    }
  }
];

export function executeWindowsMcpTool(
  tracker: WindowsUsageTracker,
  collector: WindowsSystemCollector,
  name: string,
  args: Record<string, unknown> = {}
): unknown {
  const telemetry = collector.getPerformanceTelemetry();

  switch (name) {
    case 'get_current_windows_context': {
      return tracker.getCurrentContext(telemetry);
    }
    case 'get_active_window': {
      return collector.getActiveWindow();
    }
    case 'get_pc_screen_time': {
      const summary = tracker.getTodaySummary();
      return {
        screen_time_today_minutes: summary.totalScreenTimeMinutes,
        screen_time_formatted: summary.totalScreenTimeFormatted,
        productive_time_minutes: summary.productiveMinutes,
        productive_formatted: summary.productiveFormatted,
        entertainment_time_minutes: summary.entertainmentMinutes,
        entertainment_formatted: summary.entertainmentFormatted,
        communication_time_minutes: summary.communicationMinutes,
        communication_formatted: summary.communicationFormatted,
        browser_time_minutes: summary.browserMinutes,
        browser_formatted: summary.browserFormatted,
        top_apps: summary.topApps.slice(0, 5),
        timestamp: new Date().toISOString()
      };
    }
    case 'get_pc_performance': {
      return telemetry;
    }
    case 'get_productivity_score': {
      const summary = tracker.getTodaySummary();
      const total = summary.totalScreenTimeMinutes;
      const productive = summary.productiveMinutes;
      const entertainment = summary.entertainmentMinutes;

      let score = 50;
      if (total > 0) {
        score = Math.min(100, Math.max(0, Math.round((productive / total) * 100)));
      }

      let assessment = 'Balanced';
      if (score >= 75) assessment = 'Highly Productive';
      else if (score >= 50) assessment = 'Moderately Productive';
      else if (score >= 25) assessment = 'Entertainment Leaning';
      else assessment = 'High Distraction / Entertainment Heavy';

      return {
        productivity_score: score,
        assessment,
        total_screen_time_minutes: total,
        productive_minutes: productive,
        entertainment_minutes: entertainment,
        productive_percentage: total > 0 ? Number(((productive / total) * 100).toFixed(1)) : 0,
        entertainment_percentage: total > 0 ? Number(((entertainment / total) * 100).toFixed(1)) : 0,
        recent_transitions: summary.recentTransitions.join(' → ')
      };
    }
    case 'search_window_history': {
      const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
      if (!query) {
        return { error: 'Missing or empty search query', results: [] };
      }
      const summary = tracker.getTodaySummary();
      const matches = summary.topApps.filter(
        app =>
          app.displayName.toLowerCase().includes(query) ||
          app.processName.toLowerCase().includes(query)
      );
      return {
        query,
        match_count: matches.length,
        results: matches
      };
    }
    case 'get_idle_status': {
      return {
        is_idle: telemetry.idleSeconds > 120,
        idle_seconds: telemetry.idleSeconds,
        last_interaction_time: new Date(Date.now() - telemetry.idleSeconds * 1000).toISOString()
      };
    }
    case 'get_recent_transitions': {
      const summary = tracker.getTodaySummary();
      return {
        transition_chain: summary.recentTransitions.join(' → '),
        recent_processes: summary.recentTransitions,
        current_focus: collector.getActiveWindow().processName
      };
    }
    case 'get_system_health': {
      const memoryStatus = telemetry.usedMemoryPercent > 90 ? 'High Pressure' : telemetry.usedMemoryPercent > 75 ? 'Moderate' : 'Optimal';
      const cpuStatus = telemetry.cpuUsagePercent > 85 ? 'High Load' : 'Normal';
      return {
        overall_status: memoryStatus === 'High Pressure' || cpuStatus === 'High Load' ? 'Warning' : 'Healthy',
        cpu_usage_percent: telemetry.cpuUsagePercent,
        cpu_status: cpuStatus,
        memory_used_percent: telemetry.usedMemoryPercent,
        memory_status: memoryStatus,
        total_memory_mb: telemetry.totalMemoryMB,
        free_memory_mb: telemetry.freeMemoryMB,
        uptime_hours: Number((telemetry.uptimeSeconds / 3600).toFixed(1)),
        battery_percent: telemetry.batteryPercent,
        is_charging: telemetry.isCharging
      };
    }
    case 'get_top_distractions': {
      const summary = tracker.getTodaySummary();
      const distractions = summary.topApps.filter(
        a => a.category === 'Entertainment' || (a.category === 'Browser' && a.percentageOfTotal > 35)
      );
      return {
        total_distraction_minutes: distractions.reduce((acc, curr) => acc + curr.durationMinutes, 0),
        distracting_apps: distractions
      };
    }
    case 'get_hourly_breakdown': {
      const date = typeof args.date === 'string' ? args.date.trim() : undefined;
      const hourly = tracker.getHourlyBreakdown(date);
      return {
        date: date || new Date().toISOString().split('T')[0],
        hourly_stats: hourly
      };
    }
    case 'get_historical_usage': {
      const start = typeof args.startDate === 'string' ? args.startDate.trim() : '';
      const end = typeof args.endDate === 'string' ? args.endDate.trim() : '';
      if (!start || !end) {
        return { error: 'Both startDate and endDate (YYYY-MM-DD) are required', data: [] };
      }
      const history = tracker.getHistoricalRange(start, end);
      const topApps = tracker.getTopAppsRange(start, end, 5);
      return {
        start_date: start,
        end_date: end,
        history,
        top_apps: topApps
      };
    }
    default:
      throw new Error(`Tool '${name}' not found.`);
  }
}
