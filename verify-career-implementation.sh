#!/bin/bash

# Career Agent - Implementation Verification Script
# Tests that all components are properly integrated

echo "========================================"
echo "CAREER AGENT VERIFICATION"
echo "========================================"
echo ""

# Check 1: Files exist
echo "✓ Checking files existence..."
FILES=(
  "modules/career/careerSession.types.ts"
  "modules/career/careerSession.repository.ts"
  "lib/career/CareerSessionManager.ts"
  "app/api/career/ai/route.ts"
)

ALL_OK=true
for FILE in "${FILES[@]}"; do
  if [ -f "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/$FILE" ]; then
    echo "  ✅ $FILE"
  else
    echo "  ❌ $FILE - MISSING"
    ALL_OK=false
  fi
done

echo ""

# Check 2: TypeScript types are correct
echo "✓ Checking TypeScript types..."
if grep -q "CareerSessionStatus" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/careerSession.types.ts"; then
  echo "  ✅ CareerSessionStatus type defined"
else
  echo "  ❌ CareerSessionStatus type missing"
  ALL_OK=false
fi

if grep -q "CareerSessionState" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/careerSession.types.ts"; then
  echo "  ✅ CareerSessionState type defined"
else
  echo "  ❌ CareerSessionState type missing"
  ALL_OK=false
fi

echo ""

# Check 3: Repository functions exist
echo "✓ Checking repository functions..."
if grep -q "getOrCreateActiveSession" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/careerSession.repository.ts"; then
  echo "  ✅ getOrCreateActiveSession function exists"
else
  echo "  ❌ getOrCreateActiveSession function missing"
  ALL_OK=false
fi

if grep -q "updateSession" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/modules/career/careerSession.repository.ts"; then
  echo "  ✅ updateSession function exists"
else
  echo "  ❌ updateSession function missing"
  ALL_OK=false
fi

echo ""

# Check 4: State machine logic
echo "✓ Checking state machine logic..."
if grep -q "COLLECTING_COMPANY" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/career/CareerSessionManager.ts"; then
  echo "  ✅ State machine has COLLECTING_COMPANY"
else
  echo "  ❌ COLLECTING_COMPANY state missing"
  ALL_OK=false
fi

if grep -q "processUserResponse" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/career/CareerSessionManager.ts"; then
  echo "  ✅ processUserResponse method exists"
else
  echo "  ❌ processUserResponse method missing"
  ALL_OK=false
fi

echo ""

# Check 5: API integration
echo "✓ Checking API integration..."
if grep -q "CareerSessionManager" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/ai/route.ts"; then
  echo "  ✅ API uses CareerSessionManager"
else
  echo "  ❌ API doesn't use CareerSessionManager"
  ALL_OK=false
fi

if grep -q "getOrCreateActiveSession" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/app/api/career/ai/route.ts"; then
  echo "  ✅ API calls getOrCreateActiveSession"
else
  echo "  ❌ API missing getOrCreateActiveSession call"
  ALL_OK=false
fi

echo ""

# Check 6: Build succeeds
echo "✓ Checking Next.js build..."
cd /Users/benosupport/Documents/vibhav/smarty/SmartyAI

BUILD_OUTPUT=$(npm run build 2>&1 | grep -E "career|error| Compiled successfully" | head -10)

if echo "$BUILD_OUTPUT" | grep -q "Compiled successfully"; then
  echo "  ✅ Build succeeds"
else
  echo "  ❌ Build failed"
  ALL_OK=false
fi

if echo "$BUILD_OUTPUT" | grep -q "/api/career/ai"; then
  echo "  ✅ Career API route compiled"
else
  echo "  ⚠️  Career API route not in build output (might be expected)"
fi

echo ""

# Check 7: Documentation exists
echo "✓ Checking documentation..."
if [ -f "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/CAREER_AGENT_PERSISTENT_SESSION.md" ]; then
  echo "  ✅ Documentation file exists"
else
  echo "  ❌ Documentation file missing"
  ALL_OK=false
fi

if [ -f "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/CAREER_AGENT_STATE_MACHINE_COMPLETE.md" ]; then
  echo "  ✅ Summary documentation exists"
else
  echo "  ❌ Summary documentation missing"
  ALL_OK=false
fi

echo ""

# Final result
if [ "$ALL_OK" = true ]; then
  echo "========================================"
  echo "✅ ALL CHECKS PASSED"
  echo "========================================"
  echo ""
  echo "Next steps:"
  echo "1. Run: ./test-career-agent-e2e.sh"
  echo "2. Test through desktop GUI"
  echo "3. Verify MongoDB collections"
  echo ""
  exit 0
else
  echo "========================================"
  echo "❌ SOME CHECKS FAILED"
  echo "========================================"
  echo ""
  exit 1
fi
