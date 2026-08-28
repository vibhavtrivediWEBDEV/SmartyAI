#!/bin/bash

# Test Career Execution API Directly

echo "🎯 Testing Career Execution Flow"
echo "=================================="
echo ""

# Step 1: Create a test mission directly in API
echo "1️⃣ Creating test mission..."
MISSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/career/mission \
  -H "Content-Type: application/json" \
  -H "Cookie: userId=test-user-123" \
  -d '{
    "company": "Test Company",
    "role": "Software Engineer",
    "jobDescription": "Looking for a React developer",
    "interviewDate": "2025-02-01T10:00:00Z",
    "priority": "high"
  }' 2>&1)

echo "$MISSION_RESPONSE"
echo ""

# Step 2: Extract mission ID
MISSION_ID=$(echo "$MISSION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Mission ID: $MISSION_ID"
echo ""

if [ -z "$MISSION_ID" ]; then
  echo "❌ Failed to create mission"
  exit 1
fi

# Step 3: Execute career plan
echo "2️⃣ Executing career plan..."
EXECUTE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/career/execute \
  -H "Content-Type: application/json" \
  -H "Cookie: userId=test-user-123" \
  -d "{\"missionId\": \"$MISSION_ID\"}" 2>&1)

echo "$EXECUTE_RESPONSE"
echo ""

# Step 4: Check progress
echo "3️⃣ Checking progress..."
PROGRESS_RESPONSE=$(curl -s "http://localhost:3001/api/career/execute/progress?missionId=$MISSION_ID" \
  -H "Cookie: userId=test-user-123" 2>&1)

echo "$PROGRESS_RESPONSE"
echo ""

echo "✅ Test Complete!"
