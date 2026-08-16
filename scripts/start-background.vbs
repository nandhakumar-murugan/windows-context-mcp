' Windows Context MCP - Silent Background Runner
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get project root directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(scriptDir)

' Run npm start silently (hidden window = 0)
WshShell.CurrentDirectory = rootDir
WshShell.Run "cmd /c npm start", 0, False
