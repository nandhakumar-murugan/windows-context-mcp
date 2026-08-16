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
    default:
      throw new Error(`Tool '${name}' not found.`);
  }
}
