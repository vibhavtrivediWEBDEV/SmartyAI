#!/bin/bash

# Test Career Plan Execution Flow

echo "🎯 Testing Career Plan Execution Flow"
echo "======================================:"
echo ""

# Step 1: Create a mission
echo "Step 1: Creating test mission..."
MISSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/career/mission \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "role": "Senior Software Engineer",
    "jobDescription": "Looking for a skilled engineer with React, Node.js, and system design experience",
    "interviewDate": "2025-01-20T10:00:00Z",
    "priority": "high"
  }')

echo "$MISSION_RESPONSE" | jq '.'
MISSION_ID=$(echo "$MISSION_RESPONSE" | jq -r '.mission.id')
echo ""
echo "Mission ID: $MISSION_ID"
echo ""

# Step 2: Execute career plan
echo "Step 2: Executing career plan..."
EXECUTE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/career/execute \
  -H "Content-Type: application/json" \
  -d "{\"missionId\": \"$MISSION_ID\"}")

echo "$EXECUTE_RESPONSE" | jq '.'
echo ""

# Step 3: Get plan progress
echo "Step 3: Fetching plan progress..."
PROGRESS_RESPONSE=$(curl -s "http://localhost:3000/api/career/execute/progress?missionId=$MISSION_ID")

echo "$PROGRESS_RESPONSE" | jq '.'
echo ""

# Step 4: Verify generated content
PLAN_ID=$(echo "$PROGRESS_RESPONSE" | jq -r '.plan._id')
echo "Plan ID: $PLAN_ID"
echo ""

# Summary
echo "✅ Test Complete!"
echo ""
echo "Summary:"
echo "- Mission created: $MISSION_ID"
echo "- Plan created: $PLAN_ID"
echo "- Check MongoDB for:"
echo "  • career_missions collection"
echo "  • career_plans collection"
echo "  • notes collection"
echo "  • calendar_events collection"
echo "  • learning_sessions collection"
echo "  • interview_sessions collection"
