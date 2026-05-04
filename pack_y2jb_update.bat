@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0pack_y2jb_update.ps1"

echo.
pause
