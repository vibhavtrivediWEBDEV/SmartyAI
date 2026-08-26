#!/bin/bash

echo "🔍 Verifying Career Agent Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track status
PASS=0
FAIL=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((FAIL++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((FAIL++))
    fi
}

echo "📂 Checking Core Directories..."
check_dir "lib/career"
check_dir "lib/career/adapters"
check_dir "modules/career"
check_dir "app/api/career"
echo ""

echo "📄 Checking Core Files..."
check_file "lib/career/CareerAgent.ts"
check_file "lib/career/CareerOrchestrator.ts"
check_file "lib/career/CareerScheduler.ts"
check_file "lib/career/index.ts"
check_file "modules/career/career.repository.ts"
check_file "modules/career/career.types.ts"
echo ""

echo "🔌 Checking Adapters..."
check_file "lib/career/adapters/calendarAdapter.ts"
check_file "lib/career/adapters/notesAdapter.ts"
check_file "lib/career/adapters/interviewAdapter.ts"
check_file "lib/career/adapters/teacherAdapter.ts"
check_file "lib/career/adapters/vscodeAdapter.ts"
check_file "lib/career/adapters/telegramAdapter.ts"
check_file "lib/career/adapters/youtubeAdapter.ts"
check_file "lib/career/adapters/atsAdapter.ts"
check_file "lib/career/adapters/mailAdapter.ts"
echo ""

echo "🌐 Checking API Routes..."
check_file "app/api/career/mission/route.ts"
check_file "app/api/career/ai/route.ts"
echo ""

echo "📚 Checking Documentation..."
check_file "CAREER_AGENT_ARCHITECTURE.md"
check_file "CAREER_AGENT_IMPLEMENTATION_COMPLETE.md"
check_file "CAREER_AGENT_READY_TO_TEST.md"
echo ""

echo "🔧 Checking Integration Points..."
# Check server.ts modification
if grep -q "initializeCareerOrchestrator" server.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} server.ts modified (Career Agent initialized)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} server.ts NOT modified (Career Agent NOT initialized)"
    ((FAIL++))
fi

# Check commonCommandEngine modification
if grep -q "career" lib/commonCommandEngine.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} commonCommandEngine.tsx modified (career commands routed)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} commonCommandEngine.tsx NOT modified (career commands NOT routed)"
    ((FAIL++))
fi

# Check API fetch (no direct MongoDB import)
if grep -q "fetch('/api/career" lib/commonCommandEngine.tsx 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Uses API fetch (client-safe)"
    ((PASS++))
else
    echo -e "${RED}✗${NC} Not using API fetch (potential MongoDB import issue)"
    ((FAIL++))
fi
echo ""

echo "📊 Summary:"
echo -e "  ${GREEN}Passed:${NC} $PASS"
echo -e "  ${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Career Agent Implementation Complete!${NC}"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Test mission creation: 'I have an interview at Google in 5 days'"
    echo "  2. Check mission status: 'career status'"
    echo "  3. Monitor execution: MongoDB career_agent_logs collection"
    echo ""
    echo "📚 Documentation:"
    echo "  - CAREER_AGENT_ARCHITECTURE.md - Detailed architecture"
    echo "  - CAREER_AGENT_READY_TO_TEST.md - Testing guide"
    exit 0
else
    echo -e "${RED}❌ Career Agent Implementation Incomplete${NC}"
    echo "  Missing files or integrations detected."
    exit 1
fi
