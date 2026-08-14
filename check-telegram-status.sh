#!/bin/bash

# Quick Telegram Webhook Status Check

BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
SUBDOMAIN="smarty-telegram"
USER_ID="6a6e1368288a88e353467484"

echo "📊 Telegram Webhook Status Check"
echo "================================"
echo ""

# 1. Check localtunnel process
echo "1️⃣ Localtunnel Process:"
if pgrep -f "localtunnel.*$SUBDOMAIN" > /dev/null; then
    PID=$(pgrep -f "localtunnel.*$SUBDOMAIN")
    echo "   ✅ Running (PID: $PID)"
else
    echo "   ❌ Not running"
fi
echo ""

# 2. Check tunnel connectivity
echo "2️⃣ Localtunnel Connectivity:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${SUBDOMAIN}.loca.lt" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Responding (HTTP $HTTP_CODE)"
else
    echo "   ❌ Not responding (HTTP $HTTP_CODE)"
fi
echo ""

# 3. Check webhook status
echo "3️⃣ Telegram Webhook Status:"
INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
URL=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['url'])" 2>/dev/null)
PENDING=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['pending_update_count'])" 2>/dev/null)
ERROR=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('last_error_message', 'None'))" 2>/dev/null)

echo "   URL: $URL"
echo "   Pending: $PENDING"
if [ "$ERROR" != "None" ]; then
    echo "   ❌ Error: $ERROR"
else
    echo "   ✅ No errors"
fi
echo ""

# 4. Check recent messages
echo "4️⃣ Recent Messages (last 3):"
curl -s "http://localhost:3001/api/telegram/logs?userId=${USER_ID}&limit=3" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    logs = data.get('logs', [])
    for log in logs[:3]:
        direction = '📥' if log.get('direction') == 'incoming' else '📤'
        message = log.get('message', '')[:50]
        timestamp = log.get('timestamp', '')[:16]
        print(f'   {direction} {timestamp} {message}...')
except:
    print('   ❌ Could not fetch logs')
" 2>/dev/null
echo ""

echo "================================"
echo ""

# Quick fix if needed
if [ "$HTTP_CODE" != "200" ] || [ "$ERROR" != "None" ]; then
    echo "⚠️  Webhook needs fixing!"
    echo "Run: ./telegram-webhook-keepalive.sh"
else
    echo "✅ All systems operational!"
fi
