#!/bin/bash

# Test Telegram Automation Flow
# Run this to verify everything is working

echo "🧪 Testing Telegram Automation Setup"
echo "======================================"
echo ""

# 1. Check if server is running
echo "1️⃣ Checking if server is running..."
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Server running on port 3001"
else
    echo "❌ Server not running! Start with: npm run dev"
    exit 1
fi
echo ""

# 2. Check webhook status
echo "2️⃣ Checking Telegram webhook status..."
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    export TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
fi

WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['result']['url'])" 2>/dev/null)

if [ -n "$WEBHOOK_URL" ]; then
    echo "✅ Webhook URL: $WEBHOOK_URL"
else
    echo "❌ Webhook not set!"
    exit 1
fi
echo ""

# 3. Check if MongoDB logs collection exists
echo "3️⃣ Checking MongoDB connection..."
# This would require running a Node.js script, so we'll skip for now
echo "⚠️ Manual check: Ensure MONGODB_URI is set in .env"
echo ""

# 4. Test automation command parsing
echo "4️⃣ Testing command flow..."
echo "   Send this message from Telegram: open settings"
echo "   Expected behavior:"
echo "   - Desktop receives: 'open settings'"
echo "   - Settings app opens"
echo "   - Telegram receives confirmation"
echo ""

# 5. Show recent logs
echo "5️⃣ Recent Telegram logs (last 5):"
echo "   Run: npm run telegram:logs"
echo ""

echo "======================================"
echo "✅ Setup verification complete!"
echo ""
echo "📱 Test Commands:"
echo "   1. Open Telegram bot"
echo "   2. Send: 'open settings'"
echo "   3. Check desktop - Settings should open"
echo "   4. Check Telegram - Should receive confirmation"
echo ""
echo "🔍 Debug if needed:"
echo "   - Server logs: tail -f /tmp/smarty-server.log"
echo "   - Desktop console: Open browser DevTools"
echo "   - Webhook status: npm run telegram:status"
echo ""
