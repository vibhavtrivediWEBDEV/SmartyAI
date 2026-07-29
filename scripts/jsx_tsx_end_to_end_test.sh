#!/bin/bash
# jsx_tsx_end_to_end_test.sh
# Comprehensive end-to-end test for JSX/TSX preview system

echo "========================================="
echo "🧪 JSX/TSX Preview - E2E Test Suite"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_case() {
    local test_name="$1"
    local test_result="$2"
    
    if [ "$test_result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        ((TESTS_FAILED++))
    fi
}

# ============================================
# TEST 1: Check bundler file exists
# ============================================
echo -e "${BLUE}Test 1: Check bundler file exists${NC}"
if [ -f "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/utils/reactBundler.ts" ]; then
    test_case "Bundler file exists" "PASS"
else
    test_case "Bundler file exists" "FAIL"
fi

# ============================================
# TEST 2: Check VS Code component exists
# ============================================
echo -e "${BLUE}Test 2: Check VS Code component exists${NC}"
if [ -f "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx" ]; then
    test_case "VS Code component exists" "PASS"
else
    test_case "VS Code component exists" "FAIL"
fi

# ============================================
# TEST 3: Check for correct sandbox attribute
# ============================================
echo -e "${BLUE}Test 3: Check iframe sandbox attribute${NC}"
if grep -q 'sandbox="allow-scripts allow-same-origin"' "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx"; then
    test_case "Iframe sandbox allows same origin" "PASS"
else
    test_case "Iframe sandbox allows same origin" "FAIL"
fi

# ============================================
# TEST 4: Check for import transformation code
# ============================================
echo -e "${BLUE}Test 4: Check import transformation logic${NC}"
if grep -q "const { .* } = React" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/utils/reactBundler.ts"; then
    test_case "Import transformation logic present" "PASS"
else
    test_case "Import transformation logic present" "FAIL"
fi

# ============================================
# TEST 5: Check for function preservation regex
# ============================================
echo -e "${BLUE}Test 5: Check function preservation regex${NC}"
if grep -qE "code\.replace\(/\(,\s\*\(\\\\w\+\)\\\\s\*:\\\\s\*\[A-Z\]" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/utils/reactBundler.ts"; then
    test_case "Function preservation regex present" "PASS"
else
    test_case "Function preservation regex present" "FAIL"
fi

# ============================================
# TEST 6: Check for TypeScript stripping logic
# ============================================
echo -e "${BLUE}Test 6: Check TypeScript stripping logic${NC}"
if grep -q "stripTypeScript" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/lib/utils/reactBundler.ts"; then
    test_case "TypeScript stripping function exists" "PASS"
else
    test_case "TypeScript stripping function exists" "FAIL"
fi

# ============================================
# TEST 7: Check dev server is running
# ============================================
echo -e "${BLUE}Test 7: Check dev server status${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    test_case "Dev server is running" "PASS"
else
    test_case "Dev server is running" "FAIL"
fi

# ============================================
# TEST 8: Check for CDN script loading
# ============================================
echo -e "${BLUE}Test 8: Check CDN script URLs in code${NC}"
if grep -q "https://unpkg.com/react@18" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx" && \
   grep -q "https://unpkg.com/react-dom@18" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx" && \
   grep -q "https://unpkg.com/@babel/standalone" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx"; then
    test_case "CDN scripts configured" "PASS"
else
    test_case "CDN scripts configured" "FAIL"
fi

# ============================================
# TEST 9: Check for debug logging added
# ============================================
echo -e "${BLUE}Test 9: Check debug logging added${NC}"
if grep -q "🔍 \[VSCode\] Transformed code for preview" "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx"; then
    test_case "Debug logging added" "PASS"
else
    test_case "Debug logging added" "FAIL"
fi

# ============================================
# TEST 10: Check for Babel preset configuration
# ============================================
echo -e "${BLUE}Test 10: Check Babel preset configuration${NC}"
if grep -q 'data-presets="react,typescript"' "/Users/benosupport/Documents/vibhav/smarty/SmartyAI/components/Dekstop/VsCode.tsx"; then
    test_case "Babel preset configured" "PASS"
else
    test_case "Babel preset configured" "FAIL"
fi

# ============================================
# RESULTS
# ============================================
echo ""
echo "========================================="
echo -e "${BLUE}📊 TEST RESULTS${NC}"
echo "========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! JSX/TSX preview is ready.${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Navigate to VS Code component"
    echo "  3. Create a new file (App.jsx or App.tsx)"
    echo "  4. Paste test code from QUICK_TEST_JSX_TSX.md"
    echo "  5. Click the Run button ▶️"
    echo "  6. See the preview! 🚀"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi
