@echo off
cd /d C:\naminote

SET PATH=%USERPROFILE%\.cargo\bin;C:\msys64\mingw64\bin;%PATH%
SET CARGO_TARGET_DIR=C:\cargo-build\naminote

echo Building naminote...
npm run build

echo.
if %errorlevel% == 0 (
    echo Build complete!
    explorer C:\cargo-build\naminote\release\bundle\nsis
) else (
    echo Build failed.
)
pause
