#!/bin/bash
# keepalive.sh - Monitors the Next.js dev server and restarts it when it dies.
# This is needed because the sandbox has process lifecycle limits.

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[keepalive] Starting dev server with auto-restart..."
echo "[keepalive] Press Ctrl+C to stop"

while true; do
    # Kill any stale processes
    pkill -f "next dev" 2>/dev/null
    sleep 1
    
    echo "[keepalive] $(date '+%H:%M:%S') Starting server..."
    
    # Start server in background
    bun run dev > /tmp/devserver.log 2>&1 &
    SERVER_PID=$!
    disown $SERVER_PID 2>/dev/null
    
    # Wait for server to start
    for i in $(seq 1 60); do
        if ! kill -0 $SERVER_PID 2>/dev/null; then
            echo "[keepalive] $(date '+%H:%M:%S') Server process died during startup"
            break
        fi
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
            echo "[keepalive] $(date '+%H:%M:%S') Server is UP (PID: $SERVER_PID)"
            break
        fi
        sleep 1
    done
    
    # Monitor server health
    while kill -0 $SERVER_PID 2>/dev/null; do
        sleep 2
        # Check if server is still responding
        if ! curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 5 http://localhost:3000/ 2>/dev/null | grep -q "200"; then
            echo "[keepalive] $(date '+%H:%M:%S') Server not responding, restarting..."
            break
        fi
    done
    
    echo "[keepalive] $(date '+%H:%M:%S') Server died, cleaning up..."
    pkill -f "next dev" 2>/dev/null
    pkill -f "postcss" 2>/dev/null
    sleep 2
done
