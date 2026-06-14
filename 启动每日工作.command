#!/bin/zsh

cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "没有检测到 Node.js。请先安装 Node.js 后再双击启动。"
  echo "下载地址：https://nodejs.org/"
  read -k 1 "?按任意键退出"
  exit 1
fi

PORT="${PORT:-3000}"
URL="http://127.0.0.1:${PORT}/"

echo "正在启动每日工作记录..."
echo "数据会自动保存到当前目录的 daily-data.json"
echo "访问地址：${URL}"

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"${PORT}" -sTCP:LISTEN -n -P >/dev/null 2>&1; then
  echo "检测到 ${PORT} 端口已有服务运行，直接打开页面。"
  open "${URL}"
  exit 0
fi

open "${URL}"
PORT="${PORT}" node server.js
