#!/usr/bin/env bash
OUT="$(cd "$(dirname "$0")" && pwd)/out"
for n in frontend backend moto; do [ -f "$OUT/$n.pid" ] && kill "$(cat "$OUT/$n.pid")" 2>/dev/null; rm -f "$OUT/$n.pid"; done
pkill -f "react-scripts start" 2>/dev/null; pkill -f "react-scripts/scripts/start.js" 2>/dev/null; pkill -f "uvicorn app.main:app --port 8000" 2>/dev/null; pkill -f "moto_server -p 5055" 2>/dev/null
echo stopped
