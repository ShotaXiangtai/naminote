@echo off
cd /d C:\naminote

if not exist node_modules (
  echo 初回セットアップ中... (数分かかります)
  npm install
  echo セットアップ完了
)

set PATH=%USERPROFILE%\.cargo\bin;C:\msys64\mingw64\bin;%PATH%
set CARGO_TARGET_DIR=C:\cargo-build\naminote

npm run dev
