#!/bin/bash

# Term Talk Terminal Client
SESSION_CODE=$1
USER_ID=$2

if [ -z "$SESSION_CODE" ] || [ -z "$USER_ID" ]; then
    echo "Usage: bash terminal.sh <session_code> <user_id>"
    exit 1
fi

# Get base URL from environment or default to localhost
BASE_URL="${TERM_TALK_URL:-http://localhost:3000}"

# Colors
RESET='\033[0m'
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
GRAY='\033[90m'

# Temp files
LAST_CHECK_FILE="/tmp/term_talk_${SESSION_CODE}_${USER_ID}.txt"
USER_NAME_FILE="/tmp/term_talk_user_${SESSION_CODE}_${USER_ID}.txt"

# Initialize
echo "0" > "$LAST_CHECK_FILE"

# Get current user's name
echo "Fetching session info..." >&2
RESPONSE=$(curl -s "${BASE_URL}/api/sessions/${SESSION_CODE}")
MY_NAME=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for u in data.get('users', []):
        if u['id'] == '${USER_ID}':
            print(u['name'])
            break
except:
    print('You')
" 2>/dev/null)

if [ -z "$MY_NAME" ]; then
    MY_NAME="You"
fi

echo "$MY_NAME" > "$USER_NAME_FILE"

# Function to fetch and display new messages
fetch_messages() {
    LAST_TS=$(cat "$LAST_CHECK_FILE" 2>/dev/null || echo "0")
    RESPONSE=$(curl -s "${BASE_URL}/api/messages/${SESSION_CODE}?since=${LAST_TS}")

    if [ $? -ne 0 ]; then
        return
    fi

    # Parse and display messages (skip our own messages)
    echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for msg in data.get('messages', []):
        ts = msg['timestamp']
        user = msg['user']
        message = msg['message']
        # Skip messages from ourselves
        if user != '${MY_NAME}':
            print(f'{ts}|{user}|{message}')
        else:
            # Still update timestamp to skip this message
            print(f'{ts}||')
except:
    pass
" 2>/dev/null | while IFS='|' read -r ts user msg; do
        if [ -n "$ts" ]; then
            # Update timestamp regardless
            echo "$ts" > "$LAST_CHECK_FILE"

            # Only display if it's not our own message
            if [ -n "$user" ] && [ -n "$msg" ]; then
                TIME_FORMATTED=$(date -r $((ts / 1000)) "+%H:%M" 2>/dev/null || echo "")

                if [ "$user" = "SYSTEM" ]; then
                    echo -e "${GRAY}[${TIME_FORMATTED}] ${msg}${RESET}"
                else
                    echo -e "${GRAY}[${TIME_FORMATTED}]${RESET} ${CYAN}${BOLD}${user}:${RESET} ${msg}"
                fi
            fi
        fi
    done
}

# Function to send message (simplified)
send_message() {
    local MESSAGE="$1"
    local TIME_NOW=$(date "+%H:%M")

    # Show message immediately
    echo -e "${GRAY}[${TIME_NOW}]${RESET} ${GREEN}${BOLD}${MY_NAME}:${RESET} ${MESSAGE}"

    # Send to server using Python to handle JSON properly
    python3 << EOF 2>/dev/null
import json, urllib.request, urllib.error

data = {
    "code": "${SESSION_CODE}",
    "userId": "${USER_ID}",
    "message": """${MESSAGE}"""
}

req = urllib.request.Request(
    "${BASE_URL}/api/messages/send",
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        result = response.read()
except urllib.error.HTTPError as e:
    print(f"Error sending message: {e.code}", file=sys.stderr)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
EOF

    # Update timestamp
    NEW_TS=$(($(date +%s) * 1000))
    echo "$NEW_TS" > "$LAST_CHECK_FILE"
}

# Clear screen and show header
clear
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}           TERM TALK - Session: ${SESSION_CODE}${RESET}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "${GRAY}Logged in as: ${BOLD}${MY_NAME}${RESET}"
echo ""

# Fetch initial messages
fetch_messages
echo ""

# Start background process to fetch new messages
(
    while true; do
        sleep 0.3
        fetch_messages
    done
) &
BG_PID=$!

# Cleanup function
cleanup() {
    kill $BG_PID 2>/dev/null
    wait $BG_PID 2>/dev/null
    rm -f "$LAST_CHECK_FILE" "$USER_NAME_FILE"
    echo ""
    echo -e "${YELLOW}Disconnected from session${RESET}"
    exit 0
}

trap cleanup EXIT INT TERM

# Main input loop
echo -e "${GRAY}Type your messages below (Ctrl+C to exit)${RESET}"
echo ""

# Use a more robust input method
while true; do
    # Read input without -e flag for better compatibility
    read -r -p "> " INPUT

    if [ $? -ne 0 ]; then
        # EOF or read error
        break
    fi

    if [ -n "$INPUT" ]; then
        send_message "$INPUT"
    fi
done

# Exit - cleanup will be called by trap
exit 0
