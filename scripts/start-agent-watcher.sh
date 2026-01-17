#!/bin/bash
# Agent Watcher Launcher - ensures only one instance runs

PIDFILE="/tmp/agent-watcher.pid"
LOGFILE="/tmp/agent-watcher.log"
WORKDIR="/Users/tomas/apps/beethoven"

# Check if already running
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Agent watcher already running (PID: $OLD_PID)"
        exit 0
    else
        echo "Stale PID file, removing..."
        rm -f "$PIDFILE"
    fi
fi

# Kill any orphaned watchers
pkill -f "ts-node.*agent-watcher" 2>/dev/null
sleep 1

# Start the watcher
cd "$WORKDIR"
echo "Starting agent-watcher at $(date)" >> "$LOGFILE"

# Run in foreground (launchd manages it)
exec /opt/homebrew/bin/npx ts-node --project tsconfig.node.json scripts/agent-watcher.ts &

# Save PID
echo $! > "$PIDFILE"

# Wait for the process
wait
