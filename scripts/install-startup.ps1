# Install Windows Context MCP to Windows User Startup
$WshShell = New-Object -ComObject WScript.Shell
$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupFolder "WindowsContextMCP.lnk"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetVbs = Join-Path $ScriptDir "start-background.vbs"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$TargetVbs`""
$Shortcut.Description = "Windows Context MCP Background Service"
$Shortcut.WorkingDirectory = Split-Path -Parent $ScriptDir
$Shortcut.Save()

Write-Host "✅ Windows Context MCP added to Windows Startup!" -ForegroundColor Green
Write-Host "Shortcut created at: $ShortcutPath"
