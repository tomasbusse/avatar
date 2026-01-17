#!/bin/bash
# kill-zombies.sh - Kill zombie agent processes older than MAX_AGE_HOURS
#
# Usage: ./scripts/kill-zombies.sh [max_age_hours]
# Default: Kill processes older than 2 hours
#
# Add to crontab to run hourly:
#   0 * * * * /path/to/beethoven/apps/agent/scripts/kill-zombies.sh 2 >> /tmp/agent-watchdog.log 2>&1

MAX_AGE_HOURS=${1:-2}
MAX_AGE_SECONDS=$((MAX_AGE_HOURS * 3600))
NOW=$(date +%s)
KILLED=0

echo "$(date): Checking for zombie agent processes older than ${MAX_AGE_HOURS} hour(s)..."

# Find all multiprocessing spawn processes from our agent
for pid in $(pgrep -f "multiprocessing.spawn|main.py dev"); do
    # Get process start time
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        START_TIME=$(ps -o lstart= -p $pid 2>/dev/null)
        if [ -n "$START_TIME" ]; then
            START_EPOCH=$(date -j -f "%a %b %d %H:%M:%S %Y" "$START_TIME" +%s 2>/dev/null)
        fi
    else
        # Linux
        START_EPOCH=$(stat -c %Y /proc/$pid 2>/dev/null)
    fi

    if [ -n "$START_EPOCH" ]; then
        AGE=$((NOW - START_EPOCH))
        AGE_HOURS=$((AGE / 3600))

        if [ $AGE -gt $MAX_AGE_SECONDS ]; then
            CMDLINE=$(ps -o command= -p $pid 2>/dev/null | head -c 80)
            echo "  Killing PID $pid (age: ${AGE_HOURS}h): $CMDLINE..."
            kill -TERM $pid 2>/dev/null
            KILLED=$((KILLED + 1))
        fi
    fi
done

if [ $KILLED -gt 0 ]; then
    echo "$(date): Killed $KILLED zombie process(es)"
else
    echo "$(date): No zombie processes found"
fi
