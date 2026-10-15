#!/usr/bin/env bash
# Build and serve Reset-Day Arcade on http://127.0.0.1:${RDA_PORT:-4358}
set -e
cd "$(dirname "$0")"
python3 build.py
PORT="${RDA_PORT:-4358}"
if ss -ltn 2>/dev/null | grep -q "127.0.0.1:$PORT "; then echo "already serving on :$PORT"; exit 0; fi
nohup python3 -m http.server "$PORT" --bind 127.0.0.1 --directory dist > server.log 2>&1 &
echo "serving http://127.0.0.1:$PORT/ (pid $!)"
