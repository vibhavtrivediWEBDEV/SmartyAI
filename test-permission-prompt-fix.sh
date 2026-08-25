#!/bin/bash

echo "=========================================="
echo "🧪 Testing Permission Prompt Fix"
echo "=========================================="
echo ""
echo "This test will check if the PermissionPrompt window appears"
echo "when a capability is queued."
echo ""
echo "📋 Prerequisites:"
echo "  1. Desktop must be running at http://localhost:3001/desktop"
echo "  2. Browser console must be open (F12)"
echo "  3. PermissionPrompt must be destroyed (press X on permission window if open)"
echo ""
echo "🎯 Test Steps:"
echo ""
echo "Step 1: Open Terminal AI (or use existing terminal)"
echo "Step 2: Run this command:"
echo ""
echo "  compose a mail to vibhavtrivedi6@yopmail.com for resigning from the position SDE"
echo ""
echo "Step 3: Expected Results:"
echo ""
echo "  ✓ Toast appears: 'Queued: awaiting permission for mail.compose'"
echo "  ✓ IMMEDIATELY (< 100ms): PermissionPrompt window appears"
echo "  ✓ Console log: '[PermissionPrompt] 📨 Operation queued event'"
echo "  ✓ Console log: '[PermissionPrompt] Pending capabilities: [ { capability: 'mail.compose', ... } ]'"
echo "  ✓ Window shows: 'Permission Request — compose'"
echo "  ✓ Buttons: 'Allow Once', 'Allow Always', 'Deny'"
echo ""
echo "Step 4: If permission prompt DOES NOT appear:"
echo ""
echo "  a) Check browser console for errors"
echo "  b) Check if useCapabilityManager hook is called with pollInterval=500"
echo "  c) Check if capability:operationQueued event was dispatched"
echo "  d) Check if PermissionPrompt is imported in deskstop.tsx"
echo ""
echo "=========================================="
echo ""
echo "🔍 Manual Checks:"
echo ""
echo "1. Verify event listener is registered:"
echo "   Open browser console and run:"
echo "   window.getEventListener(window, 'capability:operationQueued')"
echo ""
echo "2. Verify capability is in queue:"
echo "   Run in browser console:"
echo "   capabilityManager.getPendingQueue()"
echo ""
echo "3. Force test by dispatching event manually:"
echo "   Run in browser console:"
echo ""
echo "   window.dispatchEvent(new CustomEvent('capability:operationQueued', {"
echo "     detail: { operationId: 'test-123', missing: ['mail.compose'] }"
echo "   }));"
echo ""
echo "   Expected: PermissionPrompt window should appear immediately!"
echo ""
echo "=========================================="
echo ""
echo "🐛 Known Issues:"
echo ""
echo "1. PermissionPrompt might not show if already open and minimized"
echo "2. PermissionPrompt might not show if destroyed (re-render desktop)"
echo "3. PermissionPrompt might not show if pending capability is already granted"
echo ""
echo "=========================================="

echo ""
echo "Press Enter to continue with automated checks..."
read

echo ""
echo "🔍 Checking if desktop is running..."
if curl -s http://localhost:3001/desktop > /dev/null; then
  echo "✅ Desktop is running"
else
  echo "❌ Desktop is NOT running. Start it first:"
  echo "   cd SmartyAI && npm run dev"
  exit 1
fi

echo ""
echo "🔍 Checking if PermissionPrompt component exists..."
if [ -f "components/PermissionPrompt.tsx" ]; then
  echo "✅ PermissionPrompt.tsx exists"
  
  if grep -q "capability:operationQueued" components/PermissionPrompt.tsx; then
    echo "✅ Event listener added"
  else
    echo "❌ Event listener NOT added"
  fi
  
  if grep -q "visibility: true" components/PermissionPrompt.tsx; then
    echo "✅ Visibility state is being set"
  else
    echo "⚠️  Visibility state might not be set correctly"
  fi
else
  echo "❌ PermissionPrompt.tsx not found"
  exit 1
fi

echo ""
echo "🎉 All checks passed!"
echo ""
echo "You can now test manually by running:"
echo ""
echo "  compose a mail to vibhavtrivedi6@yopmail.com for resigning from the position SDE"
echo ""
echo "in the Terminal AI."
