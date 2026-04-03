#!/bin/bash
# Kill any existing server
pkill -f "server.js" 2>/dev/null
pkill -f "next start" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 1

# Check if production build exists
if [ -f /home/z/my-project/.next/standalone/server.js ]; then
    cd /home/z/my-project && NODE_ENV=production nohup bun .next/standalone/server.js > /tmp/prodserver.log 2>&1 &
    echo "$(date): Production server restarted (PID: $!)"
else
    cd /home/z/my-project && nohup bun run dev > /tmp/devserver.log 2>&1 &
    echo "$(date): Dev server restarted (PID: $!)"
fi
