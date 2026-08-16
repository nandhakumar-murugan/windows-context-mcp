import os from 'node:os';
import { execSync } from 'node:child_process';
import { ActiveWindowInfo, WindowsPerformanceTelemetry } from './types.js';

export class WindowsSystemCollector {
  private lastCpuUsage: number = 0;
  private lastActiveWindow: ActiveWindowInfo = {
    processName: 'System',
    windowTitle: 'Desktop',
    executablePath: '',
    category: 'System',
    timestamp: new Date().toISOString()
  };

  /**
   * Fetches active foreground window on Windows using native PowerShell Win32 interop
   */
  public getActiveWindow(): ActiveWindowInfo {
    try {
      const psScript = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$hwnd = [Win32]::GetForegroundWindow()
if ($hwnd -ne [IntPtr]::Zero) {
    $sb = New-Object System.Text.StringBuilder 256
    [Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
    $title = $sb.ToString()
    
    $pid = 0
    [Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
    
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    $pname = if ($proc) { $proc.ProcessName } else { "Unknown" }
    $ppath = if ($proc -and $proc.Path) { $proc.Path } else { "" }
    
    Write-Output "$pname|$title|$ppath"
} else {
    Write-Output "Desktop|Desktop|"
}
`.trim();

      const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');
      const output = execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${encodedCommand}`, {
        encoding: 'utf-8',
        timeout: 3500,
        windowsHide: true
      }).trim();

      const [procName = 'Desktop', title = 'Desktop', path = ''] = output.split('|');
      const processName = procName.trim() || 'Desktop';
      const windowTitle = title.trim() || 'Desktop';
      const category = this.classifyProcessCategory(processName, windowTitle);

      this.lastActiveWindow = {
        processName,
        windowTitle,
        executablePath: path.trim(),
        category,
        timestamp: new Date().toISOString()
      };

      return this.lastActiveWindow;
    } catch {
      return this.lastActiveWindow;
    }
  }

  /**
   * Classifies process into productivity / category
   */
  public classifyProcessCategory(processName: string, windowTitle: string): string {
    const p = processName.toLowerCase();
    const t = windowTitle.toLowerCase();

    if (
      p.includes('code') ||
      p.includes('idea') ||
      p.includes('studio') ||
      p.includes('terminal') ||
      p.includes('cmd') ||
      p.includes('powershell') ||
      p.includes('git') ||
      p.includes('sublime') ||
      p.includes('neovim') ||
      p.includes('cursor') ||
      p.includes('word') ||
      p.includes('excel') ||
      p.includes('powerpnt') ||
      p.includes('notion') ||
      p.includes('obsidian')
    ) {
      return 'Productive';
    }

    if (
      p.includes('slack') ||
      p.includes('teams') ||
      p.includes('discord') ||
      p.includes('telegram') ||
      p.includes('whatsapp') ||
      p.includes('outlook') ||
      p.includes('thunderbird')
    ) {
      return 'Communication';
    }

    if (
      p.includes('chrome') ||
      p.includes('msedge') ||
      p.includes('firefox') ||
      p.includes('brave') ||
      p.includes('opera')
    ) {
      // Check title for entertainment
      if (t.includes('youtube') || t.includes('netflix') || t.includes('twitch') || t.includes('anime')) {
        return 'Entertainment';
      }
      return 'Browser';
    }

    if (
      p.includes('spotify') ||
      p.includes('vlc') ||
      p.includes('steam') ||
      p.includes('epicgames') ||
      p.includes('game') ||
      p.includes('minecraft')
    ) {
      return 'Entertainment';
    }

    return 'Utility';
  }

  /**
   * Retrieves performance, memory, and battery status
   */
  public getPerformanceTelemetry(): WindowsPerformanceTelemetry {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemoryPercent = Math.round(((totalMemBytes - freeMemBytes) / totalMemBytes) * 100);

    let batteryPercent = 100;
    let isCharging = false;
    let powerSource = 'AC Power';

    try {
      const batteryOutput = execSync(
        'powershell -NoProfile -NonInteractive -Command "(Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1 EstimatedChargeRemaining, BatteryStatus) | ConvertTo-Json -Compress"',
        { encoding: 'utf-8', timeout: 2500, windowsHide: true }
      ).trim();

      if (batteryOutput) {
        const parsed = JSON.parse(batteryOutput);
        if (parsed && typeof parsed.EstimatedChargeRemaining === 'number') {
          batteryPercent = parsed.EstimatedChargeRemaining;
          isCharging = parsed.BatteryStatus === 2 || parsed.BatteryStatus === 6;
          powerSource = isCharging ? 'Charging' : 'Battery';
        }
      }
    } catch {
      // Desktop PC with AC power
    }

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsagePercent = Math.min(100, Math.max(0, Math.round(100 - (totalIdle / (totalTick || 1)) * 100)));

    return {
      cpuUsagePercent: cpuUsagePercent || this.lastCpuUsage,
      totalMemoryMB: Math.round(totalMemBytes / (1024 * 1024)),
      freeMemoryMB: Math.round(freeMemBytes / (1024 * 1024)),
      usedMemoryPercent,
      batteryPercent,
      isCharging,
      powerSource,
      idleSeconds: 0,
      uptimeSeconds: Math.floor(os.uptime())
    };
  }
}
