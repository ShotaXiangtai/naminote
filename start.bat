@echo off
cd /d "%~dp0"

if not exist node_modules (
  echo 初回セットアップ中... (数分かかります)
  npm install
  echo セットアップ完了
)

REM ELECTRON_RUN_AS_NODE が設定されていると Electron が Node.js として動作してしまうため必ずクリアする
SET ELECTRON_RUN_AS_NODE=
SET NODE_OPTIONS=

node_modules\electron\dist\electron.exe .
