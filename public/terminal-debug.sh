#!/bin/bash

# Term Talk Terminal Client - DEBUG VERSION
SESSION_CODE=$1
USER_ID=$2

if [ -z "$SESSION_CODE" ] || [ -z "$USER_ID" ]; then
    echo "Usage: bash terminal.sh <session_code> <user_id>"
    exit 1
fi

echo "DEBUG: SESSION_CODE=$SESSION_CODE"
echo "DEBUG: USER_ID=$USER_ID"

# Get base URL from environment or default to localhost
BASE_URL="${TERM_TALK_URL:-http://localhost:3000}"
echo "DEBUG: BASE_URL=$BASE_URL"

# Colors for different users (cycle through these)
declare -A USER_COLORS
COLOR_PALETTE=('\033[36m' '\033[35m' '\033[33m' '\033[34m' '\033[32m' '\033[91m' '\033[92m' '\033[93m' '\033[94m' '\033[95m' '\033[96m')
COLOR_INDEX=0

RESET='\033[0m'
BOLD='\033[1m'
GRAY='\033[90m'
GREEN='\033[32m'
YELLOW='\033[33m'

# Temp files
LAST_CHECK_FILE="/tmp/term_talk_${SESSION_CODE}_${USER_ID}.txt"
USER_NAME_FILE="/tmp/term_talk_user_${SESSION_CODE}_${USER_ID}.txt"

# Initialize
echo "0" > "$LAST_CHECK_FILE"

# Get current user's name
get_user_name() {
    echo "DEBUG: Fetching user name..."
    RESPONSE=$(curl -s "${BASE_URL}/api/sessions/${SESSION_CODE}")
    echo "DEBUG: Session response: $RESPONSE"

    if [ $? -eq 0 ]; then
        MY_NAME=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for u in data.get('users', []):
        if u['id'] == '${USER_ID}':
            print(u['name'])
            break
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
" 2>&1)
        echo "DEBUG: MY_NAME=$MY_NAME"
        echo "$MY_NAME" > "$USER_NAME_FILE"
    fi
}

# Function to send message
send_message() {
    MESSAGE="$1"
    MY_NAME=$(cat "$USER_NAME_FILE" 2>/dev/null || echo "You")

    echo ""
    echo "DEBUG: Sending message: '$MESSAGE'"
    echo "DEBUG: My name: $MY_NAME"

    # Display message immediately
    TIME_NOW=$(date "+%H:%M")
    echo -e "${GRAY}[${TIME_NOW}]${RESET} ${GREEN}${BOLD}${MY_NAME}:${RESET} ${MESSAGE}"

    # Escape message for JSON
    ESCAPED_MSG=$(echo "$MESSAGE" | python3 -c 'import sys, json; print(json.dumps(sys.stdin.read().strip()))')
    echo "DEBUG: Escaped message: $ESCAPED_MSG"

    JSON_PAYLOAD="{\"code\":\"${SESSION_CODE}\",\"userId\":\"${USER_ID}\",\"message\":${ESCAPED_MSG}}"
    echo "DEBUG: JSON payload: $JSON_PAYLOAD"

    # Send to server
    SEND_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "${BASE_URL}/api/messages/send" \
        -H "Content-Type: application/json" \
        -d "$JSON_PAYLOAD")

    echo "DEBUG: Send response: $SEND_RESPONSE"

    # Update timestamp to avoid seeing our own message again
    NEW_TS=$(($(date +%s) * 1000))
    echo "$NEW_TS" > "$LAST_CHECK_FILE"
    echo ""
}

# Clear screen and show header
clear
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}           TERM TALK - Session: ${SESSION_CODE}${RESET}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo ""

# Get user name
get_user_name

# Main input loop
echo -e "${GRAY}Type your messages below (Ctrl+C to exit)${RESET}"
echo ""

while true; do
    read -e -p "> " INPUT
    echo "DEBUG: Input received: '$INPUT'"

    if [ -n "$INPUT" ]; then
        send_message "$INPUT"
    else
        echo "DEBUG: Empty input, skipping"
    fi
done
