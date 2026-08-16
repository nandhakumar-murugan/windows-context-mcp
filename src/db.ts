import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export interface FocusSessionRecord {
  id?: number;
  date: string;
  hour: number;
  process_name: string;
  window_title: string;
  category: string;
  duration_seconds: number;
  timestamp: number;
}

export interface HourlyProductivityStat {
  hour: number;
  formatted_hour: string;
  total_minutes: number;
  productive_minutes: number;
  entertainment_minutes: number;
  communication_minutes: number;
  browser_minutes: number;
}

export interface HistoricalDateStat {
  date: string;
  total_minutes: number;
  productive_minutes: number;
  entertainment_minutes: number;
  productivity_score: number;
  top_app: string;
}

export class WindowsContextDatabase {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(dataDir: string = './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'context_timeseries.sqlite');
    this.db = new DatabaseSync(this.dbPath);
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        hour INTEGER NOT NULL,
        process_name TEXT NOT NULL,
        window_title TEXT,
        category TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_date ON focus_sessions(date);
      CREATE INDEX IF NOT EXISTS idx_sessions_process ON focus_sessions(process_name);
      CREATE INDEX IF NOT EXISTS idx_sessions_category ON focus_sessions(category);
    `);
  }

  /**
   * Records a focus tick/interval in SQLite
   */
  public recordFocusSession(
    date: string,
    hour: number,
    processName: string,
    windowTitle: string,
    category: string,
    durationSeconds: number
  ) {
    const insertStmt = this.db.prepare(`
      INSERT INTO focus_sessions (date, hour, process_name, window_title, category, duration_seconds, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(date, hour, processName, windowTitle, category, durationSeconds, Date.now());
  }

  /**
   * Retrieves hourly breakdown for a given date
   */
  public getHourlyBreakdown(date: string): HourlyProductivityStat[] {
    const query = this.db.prepare(`
      SELECT 
        hour,
        SUM(duration_seconds) as total_sec,
        SUM(CASE WHEN category = 'Productive' THEN duration_seconds ELSE 0 END) as prod_sec,
        SUM(CASE WHEN category = 'Entertainment' THEN duration_seconds ELSE 0 END) as ent_sec,
        SUM(CASE WHEN category = 'Communication' THEN duration_seconds ELSE 0 END) as com_sec,
        SUM(CASE WHEN category = 'Browser' THEN duration_seconds ELSE 0 END) as brow_sec
      FROM focus_sessions
      WHERE date = ?
      GROUP BY hour
      ORDER BY hour ASC
    `);

    const rows = query.all(date) as any[];
    const result: HourlyProductivityStat[] = [];

    for (let h = 0; h < 24; h++) {
      const row = rows.find(r => r.hour === h);
      const totalSec = row ? row.total_sec : 0;
      const prodSec = row ? row.prod_sec : 0;
      const entSec = row ? row.ent_sec : 0;
      const comSec = row ? row.com_sec : 0;
      const browSec = row ? row.brow_sec : 0;

      const formatHour = (hour: number) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${displayHour}:00 ${ampm}`;
      };

      result.push({
        hour: h,
        formatted_hour: formatHour(h),
        total_minutes: Math.round(totalSec / 60),
        productive_minutes: Math.round(prodSec / 60),
        entertainment_minutes: Math.round(entSec / 60),
        communication_minutes: Math.round(comSec / 60),
        browser_minutes: Math.round(browSec / 60)
      });
    }

    return result;
  }

  /**
   * Retrieves usage stats across a historical date range
   */
  public getHistoricalRange(startDate: string, endDate: string): HistoricalDateStat[] {
    const query = this.db.prepare(`
      SELECT 
        date,
        SUM(duration_seconds) as total_sec,
        SUM(CASE WHEN category = 'Productive' THEN duration_seconds ELSE 0 END) as prod_sec,
        SUM(CASE WHEN category = 'Entertainment' THEN duration_seconds ELSE 0 END) as ent_sec
      FROM focus_sessions
      WHERE date >= ? AND date <= ?
      GROUP BY date
      ORDER BY date ASC
    `);

    const rows = query.all(startDate, endDate) as any[];
    const stats: HistoricalDateStat[] = [];

    for (const row of rows) {
      const totalMin = Math.round((row.total_sec || 0) / 60);
      const prodMin = Math.round((row.prod_sec || 0) / 60);
      const entMin = Math.round((row.ent_sec || 0) / 60);
      const score = totalMin > 0 ? Math.min(100, Math.round((prodMin / totalMin) * 100)) : 50;

      // Find top app for this date
      const topAppQuery = this.db.prepare(`
        SELECT process_name, SUM(duration_seconds) as total_dur
        FROM focus_sessions
        WHERE date = ?
        GROUP BY process_name
        ORDER BY total_dur DESC
        LIMIT 1
      `);
      const topAppRow = topAppQuery.get(row.date) as any;
      const topApp = topAppRow ? topAppRow.process_name.replace(/\.exe$/i, '') : 'None';

      stats.push({
        date: row.date,
        total_minutes: totalMin,
        productive_minutes: prodMin,
        entertainment_minutes: entMin,
        productivity_score: score,
        top_app: topApp
      });
    }

    return stats;
  }

  /**
   * Query top applications over a date range
   */
  public getTopAppsRange(startDate: string, endDate: string, limit: number = 10) {
    const query = this.db.prepare(`
      SELECT 
        process_name,
        category,
        SUM(duration_seconds) as total_sec
      FROM focus_sessions
      WHERE date >= ? AND date <= ?
      GROUP BY process_name, category
      ORDER BY total_sec DESC
      LIMIT ?
    `);

    const rows = query.all(startDate, endDate, limit) as any[];
    return rows.map(r => ({
      process_name: r.process_name,
      display_name: r.process_name.replace(/\.exe$/i, ''),
      category: r.category,
      total_minutes: Math.round((r.total_sec || 0) / 60)
    }));
  }

  public close() {
    this.db.close();
  }
}
