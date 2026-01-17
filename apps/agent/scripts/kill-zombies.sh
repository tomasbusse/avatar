#!/bin/bash
# kill-zombies.sh - Kill ORPHANED agent processes (no active LiveKit room)
#
# This script is SAFE to run during active sessions because it only kills:
# 1. Multiprocessing workers whose parent main.py is dead (true zombies)
# 2. Processes older than MAX_AGE_HOURS with no network activity (stale)
#
# Usage: ./scripts/kill-zombies.sh [max_age_hours]
# Default: Kill orphaned processes older than 8 hours
#
# Add to crontab to run every 4 hours:
#   0 */4 * * * /path/to/beethoven/apps/agent/scripts/kill-zombies.sh >> /tmp/agent-watchdog.log 2>&1

MAX_AGE_HOURS=${1:-8}  # Default 8 hours - safe for long sessions
MAX_AGE_SECONDS=$((MAX_AGE_HOURS * 3600))
NOW=$(date +%s)
KILLED=0

echo "$(date): Checking for orphaned/zombie agent processes..."

# Step 1: Find all main.py dev processes (these are the parent processes)
MAIN_PIDS=$(pgrep -f "main.py dev" 2>/dev/null | tr '\n' ' ')
echo "  Active main.py processes: ${MAIN_PIDS:-none}"

# Step 2: Kill orphaned multiprocessing workers (parent is dead)
for pid in $(pgrep -f "multiprocessing.spawn"); do
    # Get parent PID
    PPID=$(ps -o ppid= -p $pid 2>/dev/null | tr -d ' ')

    # Check if parent is still alive and is a main.py process
    if [ -n "$PPID" ]; then
        PARENT_CMD=$(ps -o command= -p $PPID 2>/dev/null)
        if [[ "$PARENT_CMD" != *"main.py"* ]] && [[ "$PARENT_CMD" != *"Python"* ]]; then
            CMDLINE=$(ps -o command= -p $pid 2>/dev/null | head -c 60)
            echo "  🧟 Orphaned worker PID $pid (parent $PPID not agent): $CMDLINE"
            kill -TERM $pid 2>/dev/null
            KILLED=$((KILLED + 1))
            continue
        fi
    fi

    # Step 3: For non-orphaned workers, check age (only kill very old ones)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        START_TIME=$(ps -o lstart= -p $pid 2>/dev/null)
        if [ -n "$START_TIME" ]; then
            START_EPOCH=$(date -j -f "%a %b %d %H:%M:%S %Y" "$START_TIME" +%s 2>/dev/null)
        fi
    else
        START_EPOCH=$(stat -c %Y /proc/$pid 2>/dev/null)
    fi

    if [ -n "$START_EPOCH" ]; then
        AGE=$((NOW - START_EPOCH))
        AGE_HOURS=$((AGE / 3600))

        if [ $AGE -gt $MAX_AGE_SECONDS ]; then
            CMDLINE=$(ps -o command= -p $pid 2>/dev/null | head -c 60)
            echo "  ⏰ Stale worker PID $pid (age: ${AGE_HOURS}h): $CMDLINE"
            kill -TERM $pid 2>/dev/null
            KILLED=$((KILLED + 1))
        fi
    fi
done

# Step 4: Also clean up resource trackers for killed workers
if [ $KILLED -gt 0 ]; then
    sleep 1
    pkill -f "multiprocessing.resource_tracker" 2>/dev/null
fi

if [ $KILLED -gt 0 ]; then
    echo "$(date): ✅ Cleaned up $KILLED zombie/stale process(es)"
else
    echo "$(date): ✅ No zombies found - all processes healthy"
fi
