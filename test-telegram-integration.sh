#!/bin/bash

# Telegram Integration Test Suite
# Tests bidirectional messaging with proper connection state handling

echo "=========================================="
echo "Telegram Integration Test Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001"
USER_ID="6a6e1368288a88e353467484"
CHAT_ID="1520574544"

# Test 1: Check Connection Status
echo "Test 1: Check Connection Status"
echo "----------------------------------------"
curl -s "$BASE_URL/api/telegram/status" -H "Content-Type: application/json" -d "{\"userId\":\"$USER_ID\"}" | python3 -m json.tool
echo ""

# Test 2: Send Message (should work now)
echo "Test 2: Send Message (Connected)"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/api/telegram/send" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Test message from automated test\",\"userId\":\"$USER_ID\"}" | python3 -m json.tool
echo ""

# Test 3: Send Message without userId (should fail)
echo "Test 3: Send Message (No Auth)"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/api/telegram/send" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test without auth"}' | python3 -m json.tool
echo ""

# Test 4: Webhook receives message
echo "Test 4: Webhook Receives Message"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"update_id\": 100007,
    \"message\": {
      \"message_id\": 107,
      \"from\": {
        \"id\": $CHAT_ID,
        \"first_name\": \"Vibhav\",
        \"username\": \"vibhav\"
      },
      \"chat\": {
        \"id\": $CHAT_ID,
        \"type\": \"private\"
      },
      \"text\": \"test from webhook\"
    }
  }" | python3 -m json.tool
echo ""

# Test 5: Check Logs
echo "Test 5: Fetch Recent Logs"
echo "----------------------------------------"
curl -s "$BASE_URL/api/telegram/logs?limit=5" | python3 -m json.tool 2>&1 | head -50
echo ""

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
echo ""
echo "✅ Expected Results:"
echo "  Test 1: Should show connected with chatId $CHAT_ID"
echo "  Test 2: Should successfully send message (message ID returned)"
echo "  Test 3: Should return AUTH_REQUIRED error"
echo "  Test 4: Should return {\"ok\":true}"
echo "  Test 5: Should show recent bidirectional logs"
echo ""
echo "📱 Check Telegram for messages!"
