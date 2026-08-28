#!/bin/bash

# Test Career Agent End-to-End
# Tests the persistent conversation state machine

echo "========================================"
echo "CAREER AGENT END-TO-END TEST"
echo "========================================"
echo ""

BASE_URL="http://localhost:3000/api/career"
USER_ID="test_user_$(date +%s)"

echo "User ID: $USER_ID"
echo ""

# Test Case 1: First message
echo "========================================"
echo "TEST 1: User says 'I have an interview at Google'"
echo "========================================"
echo ""

RESPONSE_1=$(curl -s -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "task": "conversation",
    "data": {
      "userInput": "I have an interview at Google"
    }
  }')

echo "Response 1:"
echo "$RESPONSE_1" | jq '.'
echo ""

# Extract session ID
SESSION_ID=$(echo "$RESPONSE_1" | jq -r '.sessionId')

if [ "$SESSION_ID" == "" ] || [ "$SESSION_ID" == "null" ]; then
  echo "❌ ERROR: No session ID returned"
  exit 1
fi

echo "✅ Session ID: $SESSION_ID"
echo ""

# Test Case 2: Second message
echo "========================================"
echo "TEST 2: User says 'React Developer'"
echo "========================================"
echo ""

RESPONSE_2=$(curl -s -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "task": "conversation",
    "data": {
      "userInput": "React Developer"
    }
  }')

echo "Response 2:"
echo "$RESPONSE_2" | jq '.'
echo ""

# Test Case 3: Third message
echo "========================================"
echo "TEST 3: User says 'In 5 days'"
echo "========================================"
echo ""

RESPONSE_3=$(curl -s -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "task": "conversation",
    "data": {
      "userInput": "In 5 days"
    }
  }')

echo "Response 3:"
echo "$RESPONSE_3" | jq '.'
echo ""

# Check if we're in confirming state
STATE=$(echo "$RESPONSE_3" | jq -r '.nextState.stage')

if [ "$STATE" == "confirming" ]; then
  echo "✅ Reached confirming state"
else
  echo "❌ ERROR: Not in confirming state (got: $STATE)"
  exit 1
fi

# Test Case 4: Confirm
echo "========================================"
echo "TEST 4: User says 'Yes'"
echo "========================================"
echo ""

RESPONSE_4=$(curl -s -X POST "$BASE_URL/ai" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "task": "conversation",
    "data": {
      "userInput": "Yes"
    }
  }')

echo "Response 4:"
echo "$RESPONSE_4" | jq '.'
echo ""

# Check if mission was created
SHOULD_CREATE=$(echo "$RESPONSE_4" | jq -r '.shouldCreateMission')

if [ "$SHOULD_CREATE" == "true" ]; then
  echo "✅ Mission creation triggered"
else
  echo "❌ ERROR: Mission should have been created"
  exit 1
fi

# Verify mission exists in MongoDB
echo ""
echo "========================================"
echo "VERIFICATION: Check MongoDB for mission"
echo "========================================"
echo ""

# Get all missions for user
MISSIONS=$(curl -s -X GET "$BASE_URL/mission" \
  -H "x-user-id: $USER_ID")

echo "Missions:"
echo "$MISSIONS" | jq '.'
echo ""

MISSION_COUNT=$(echo "$MISSIONS" | jq '.missions | length')

if [ "$MISSION_COUNT" -gt 0 ]; then
  echo "✅ Mission created successfully!"
  echo ""
  
  # Show mission details
  MISSION_ID=$(echo "$MISSIONS" | jq -r '.missions[0].id')
  COMPANY=$(echo "$MISSIONS" | jq -r '.missions[0].company')
  ROLE=$(echo "$MISSIONS" | jq -r '.missions[0].role')
  
  echo "Mission ID: $MISSION_ID"
  echo "Company: $COMPANY"
  echo "Role: $ROLE"
  echo ""
  
  echo "========================================"
  echo "✅ ALL TESTS PASSED"
  echo "========================================"
else
  echo "❌ ERROR: No mission found in database"
  exit 1
fi
