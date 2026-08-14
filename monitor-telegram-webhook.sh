#!/bin/bash

# Telegram Webhook Monitor
# Keeps localtunnel alive and monitors webhook health

BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
SUBDOMAIN="smarty-telegram"
PORT=3001

echo "🔄 Starting Telegram Webhook Monitor..."
echo ""

# Function to check webhook health
check_webhook() {
    INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
    PENDING=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['pending_update_count'])" 2>/dev/null)
    ERROR=$(echo "$INFO" | python3 -c "import sys,json; print(json.load(sys.stdin)['result'].get('last_error_message', 'None'))" 2>/dev/null)
    
    if [ "$ERROR" != "None" ]; then
        echo "❌ Webhook Error: $ERROR"
        echo "   Pending updates: $PENDING"
        return 1
    else
        echo "✅ Webhook healthy (Pending: $PENDING)"
        return 0
    fi
}

# Function to restart localtunnel
restart_tunnel() {
    echo "🔄 Restarting localtunnel..."
    pkill -f "localtunnel" 2>/dev/null
    sleep 2
    npx localtunnel --port $PORT --subdomain $SUBDOMAIN > /dev/null 2>&1 &
    TUNNEL_PID=$!
    sleep 3
    
    # Verify tunnel started
    if ps -p $TUNNEL_PID > /dev/null; then
        echo "✅ Localtunnel restarted (PID: $TUNNEL_PID)"
        
        # Reset webhook
        curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${SUBDOMAIN}.loca.lt/api/telegram/webhook" > /dev/null
        echo "✅ Webhook reset"
        
        return 0
    else
        echo "❌ Failed to start localtunnel"
        return 1
    fi
}

# Initial setup
echo "📍 Configuration:"
echo "   Bot Token: ${BOT_TOKEN:0:10}..."
echo "   Subdomain: $SUBDOMAIN.loca.lt"
echo "   Port: $PORT"
echo ""

# Check if localtunnel is already running
if pgrep -f "localtunnel" > /dev/null; then
    echo "✅ Localtunnel already running"
else
    echo "⚠️  Localtunnel not running, starting..."
    npx localtunnel --port $PORT --subdomain $SUBDOMAIN > /dev/null 2>&1 &
    sleep 3
    echo "✅ Localtunnel started"
fi

# Verify webhook is set
echo ""
echo "📡 Verifying webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${SUBDOMAIN}.loca.lt/api/telegram/webhook" > /dev/null
echo "✅ Webhook configured"
echo ""

# Monitor loop
echo "👀 Monitoring... (Press Ctrl+C to stop)"
echo "   Checks every 30 seconds"
echo ""

CHECK_COUNT=0
while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Check #$CHECK_COUNT"
    
    # Check localtunnel
    if ! pgrep -f "localtunnel" > /dev/null; then
        echo "❌ Localtunnel died!"
        restart_tunnel
    fi
    
    # Check webhook health
    if ! check_webhook; then
        echo "🔄 Attempting to fix..."
        restart_tunnel
    fi
    
    # Check localtunnel connectivity
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://${SUBDOMAIN}.loca.lt)
    if [ "$HTTP_CODE" != "200" ]; then
        echo "❌ Localtunnel not responding (HTTP $HTTP_CODE)"
        restart_tunnel
    fi
    
    echo ""
    sleep 30
done
