# Remove Windows Context MCP from Windows User Startup
$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupFolder "WindowsContextMCP.lnk"

if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
    Write-Host "🗑️ Windows Context MCP removed from Windows Startup." -ForegroundColor Yellow
} else {
    Write-Host "ℹ️ Windows Context MCP was not found in Startup folder." -ForegroundColor Gray
}
