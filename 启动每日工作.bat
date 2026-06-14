@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo 没有检测到 Node.js。请先安装 Node.js 后再双击启动。
  echo 下载地址：https://nodejs.org/
  pause
  exit /b 1
)

if "%PORT%"=="" set PORT=3000
set URL=http://127.0.0.1:%PORT%/

echo 正在启动每日工作记录...
echo 数据会自动保存到当前目录的 daily-data.json
echo 访问地址：%URL%

netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo 检测到 %PORT% 端口已有服务运行，直接打开页面。
  start "" "%URL%"
  exit /b 0
)

start "" "%URL%"
node server.js
