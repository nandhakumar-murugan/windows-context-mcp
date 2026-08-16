import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WindowsContextDatabase } from '../src/db.js';

const TEST_DB_DIR = './test_data_sqlite';

describe('WindowsContextDatabase (SQLite)', () => {
  let db: WindowsContextDatabase;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
    db = new WindowsContextDatabase(TEST_DB_DIR);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
    }
  });

  it('should record focus sessions and retrieve hourly breakdown', () => {
    const today = '2026-08-16';
    db.recordFocusSession(today, 10, 'Code.exe', 'index.ts - VSCode', 'Productive', 1200);
    db.recordFocusSession(today, 10, 'chrome.exe', 'YouTube', 'Entertainment', 600);
    db.recordFocusSession(today, 11, 'Code.exe', 'db.ts - VSCode', 'Productive', 1800);

    const hourly = db.getHourlyBreakdown(today);
    assert.equal(hourly.length, 24);

    const hour10 = hourly.find(h => h.hour === 10);
    assert.ok(hour10);
    assert.equal(hour10.productive_minutes, 20);
    assert.equal(hour10.entertainment_minutes, 10);

    const hour11 = hourly.find(h => h.hour === 11);
    assert.ok(hour11);
    assert.equal(hour11.productive_minutes, 30);
  });

  it('should query historical range and top apps accurately', () => {
    db.recordFocusSession('2026-08-14', 14, 'Code.exe', 'VS Code', 'Productive', 3600);
    db.recordFocusSession('2026-08-15', 15, 'Spotify.exe', 'Spotify', 'Entertainment', 1800);
    db.recordFocusSession('2026-08-16', 16, 'Code.exe', 'VS Code', 'Productive', 7200);

    const history = db.getHistoricalRange('2026-08-14', '2026-08-16');
    assert.equal(history.length, 3);
    assert.equal(history[0].date, '2026-08-14');
    assert.equal(history[0].productive_minutes, 60);

    const topApps = db.getTopAppsRange('2026-08-14', '2026-08-16', 2);
    assert.ok(topApps.length > 0);
    assert.equal(topApps[0].process_name, 'Code.exe');
    assert.equal(topApps[0].total_minutes, 180);
  });
});
