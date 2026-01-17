#!/bin/bash
# stop-agent.sh - Gracefully stop all agent processes
#
# This script sends SIGTERM to allow graceful cleanup of Hedra/Bey sessions,
# then SIGKILL if processes don't exit within timeout.

TIMEOUT=10

echo "🛑 Stopping Beethoven agent processes..."

# First, send SIGTERM for graceful shutdown
echo "  Sending SIGTERM to main.py processes..."
pkill -TERM -f "main.py dev" 2>/dev/null

# Wait for graceful shutdown
echo "  Waiting ${TIMEOUT}s for graceful shutdown..."
sleep $TIMEOUT

# Check if any processes remain
REMAINING=$(pgrep -f "main.py dev|multiprocessing.spawn" | wc -l)

if [ $REMAINING -gt 0 ]; then
    echo "  ⚠️  $REMAINING process(es) still running, sending SIGKILL..."
    pkill -KILL -f "multiprocessing.spawn" 2>/dev/null
    pkill -KILL -f "multiprocessing.resource_tracker" 2>/dev/null
    pkill -KILL -f "main.py dev" 2>/dev/null
    sleep 1
fi

# Final check
REMAINING=$(pgrep -f "main.py dev|multiprocessing" | wc -l)
if [ $REMAINING -eq 0 ]; then
    echo "✅ All agent processes stopped"
else
    echo "⚠️  Warning: $REMAINING process(es) may still be running"
    pgrep -f "main.py dev|multiprocessing" | xargs ps -o pid,lstart,command -p 2>/dev/null
fi
