#!/bin/bash

# Beethoven Agent Debug & Monitoring Script
# This script monitors agent.log and highlights errors/warnings in real-time.

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOG_FILE="apps/agent/agent.log"

echo -e "${BLUE}=== Beethoven Agent Monitoring ===${NC}"
echo -e "Monitoring: ${LOG_FILE}"

if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}Error: Log file not found at $LOG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Verifying Convex connection...${NC}"
# Simple check for Convex URL in environment
if [ -f "apps/agent/.env" ]; then
    CONVEX_URL=$(grep CONVEX_URL apps/agent/.env | cut -d '=' -f2)
    echo -e "Convex URL detected: ${BLUE}${CONVEX_URL}${NC}"
else
    echo -e "${YELLOW}Warning: apps/agent/.env not found. Ensure environment variables are set.${NC}"
fi

echo -e "${BLUE}--- Waiting for new logs (Ctrl+C to stop) ---${NC}"

# Tail the log file and apply color highlighting
tail -f "$LOG_FILE" | while read -r line; do
    if [[ "$line" == *"ERROR"* ]] || [[ "$line" == *"Exception"* ]] || [[ "$line" == *"AttributeError"* ]]; then
        echo -e "${RED}${line}${NC}"
    elif [[ "$line" == *"WARNING"* ]]; then
        echo -e "${YELLOW}${line}${NC}"
    elif [[ "$line" == *"INFO"* ]]; then
        if [[ "$line" == *"🚀 Agent starting"* ]] || [[ "$line" == *"✅"* ]] || [[ "$line" == *"✨"* ]]; then
            echo -e "${GREEN}${line}${NC}"
        elif [[ "$line" == *"🎯 HEARD"* ]]; then
            echo -e "${BLUE}${line}${NC}"
        else
            echo "$line"
        fi
    else
        echo "$line"
    fi
done
