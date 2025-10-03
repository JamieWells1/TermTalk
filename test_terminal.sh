#!/bin/bash

# Quick debug script
SESSION_CODE="A68A78"
BASE_URL="http://localhost:3000"

echo "Testing session fetch..."
RESPONSE=$(curl -s "${BASE_URL}/api/sessions/${SESSION_CODE}")
echo "Session response: $RESPONSE"

echo ""
echo "Parsing with Python..."
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Users:', data.get('users', []))
for u in data.get('users', []):
    print(f\"User: {u['name']} (ID: {u['id']})\")
"

echo ""
echo "Testing message fetch..."
curl -s "${BASE_URL}/api/messages/${SESSION_CODE}?since=0" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Messages:', data.get('messages', []))
print('Users in response:', data.get('users', []))
"
