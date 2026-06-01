@echo off
cd /d C:\naminote

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process 'C:\naminote\build.bat' -Verb RunAs"
    exit /b
)

SET ELECTRON_RUN_AS_NODE=
SET NODE_OPTIONS=

echo Building naminote...
npx electron-builder --win --publish never

echo.
if %errorlevel% == 0 (
    echo Build complete! Output: C:\naminote_dist
    explorer C:\naminote_dist
) else (
    echo Build failed.
)
pause
