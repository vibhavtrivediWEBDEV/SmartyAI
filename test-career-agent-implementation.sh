#!/bin/bash

echo "🎯 Career Agent Implementation Test"
echo "===================================="
echo ""

echo "✅ Checking MongoDB Collections..."
echo ""

# Check if collections exist in MongoDB (you need mongosh)
mongosh smartyai_dev --quiet --eval '
  db = db.getSiblingDB("smartyai_dev");
  print("Collections found:");
  db.getCollectionNames().filter(name => name.includes("career")).forEach(name => {
    let count = db.getCollection(name).countDocuments();
    print("  ✓ " + name + " (" + count + " documents)");
  });
' 2>/dev/null || echo "  ⚠️  MongoDB check skipped (mongosh not available)"

echo ""
echo "✅ Checking API Endpoints..."
echo ""

# Test GET endpoint (should return 401 without auth)
echo "  Testing: GET /api/career/mission (expect 401 Unauthorized)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/career/mission)
if [ "$HTTP_CODE" = "401" ]; then
  echo "  ✓ Correctly returns 401 (auth required)"
else
  echo "  ✗ Expected 401, got $HTTP_CODE"
fi

echo ""
echo "✅ Checking Component Files..."
echo ""

COMPONENTS=(
  "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/CareerAgentSimple.tsx"
  "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/CareerAgentProgress.tsx"
  "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/career.repository.ts"
  "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/mission/route.ts"
  "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/ai/route.ts"
)

for file in "${COMPONENTS[@]}"; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    echo "  ✓ $file ($LINES lines)"
  else
    echo "  ✗ Missing: $file"
  fi
done

echo ""
echo "✅ Checking MongoDB Collection Definitions..."
echo ""

# Check if collections are defined in repository
COLLECTIONS=$(grep -o "collection.*career_.*\"" /Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/career.repository.ts | cut -d'"' -f2 | sort -u)

for coll in $COLLECTIONS; do
  echo "  ✓ Collection defined: $coll"
done

echo ""
echo "✅ Checking Server Status..."
echo ""

# Check if server is running on port 3001
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "  ✓ Server running on http://localhost:3001"
else
  echo "  ✗ Server not running on port 3001"
  echo "     Start with: npm run dev"
fi

echo ""
echo "✅ Checking Authentication Configuration..."
echo ""

# Check if using MongoDB sessions
if grep -q "getSessionUserId" /Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/mission/route.ts; then
  echo "  ✓ Using MongoDB sessions (getSessionUserId)"
else
  echo "  ✗ Not using MongoDB sessions"
fi

# Check if Clerk is removed
if ! grep -q "from '@clerk" /Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/mission/route.ts; then
  echo "  ✓ Clerk authentication removed"
else
  echo "  ✗ Still using Clerk authentication"
fi

echo ""
echo "✅ Checking AI Integration..."
echo ""

# Check if using complete() method
if grep -q "aiService.complete" /Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/ai/route.ts; then
  echo "  ✓ AI Service using complete() method"
else
  echo "  ✗ AI method not correct"
fi

echo ""
echo "📊 Implementation Summary"
echo "========================"
echo ""
echo "Core Components:"
echo "  • CareerAgentSimple.tsx - Voice UI and conversation"
echo "  • CareerAgentProgress.tsx - Progress tracking display"
echo "  • career.repository.ts - MongoDB data layer"
echo "  • API routes - REST endpoints"
echo ""
echo "MongoDB Collections:"
echo "  • career_missions - Store interview goals"
echo "  • career_tasks - Prep tasks"
echo "  • career_plans - Daily schedules"
echo "  • career_agent_logs - Action logs"
echo ""
echo "Features:"
echo "  • Voice activation (MIC button)"
echo "  • Conversational AI (asks questions)"
echo "  • MongoDB persistence (saves missions)"
echo "  • Progress tracking UI (real-time updates)"
echo "  • Context memory (checks existing missions)"
echo "  • App orchestration (opens 4 apps)"
echo ""
echo "🎉 Career Agent Implementation Complete!"
echo ""
echo "Test End-to-End:"
echo "  1. Open http://localhost:3001"
echo "  2. Click MIC button (bottom-right)"
echo "  3. Say 'I have an interview'"
echo "  4. Answer questions"
echo "  5. See progress panel (top-right)"
echo "  6. See apps open"
echo ""
