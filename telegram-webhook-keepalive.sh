#!/bin/bash

# Permanent Telegram Webhook Keepalive
# Automatically restarts localtunnel when it disconnects

BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
SUBDOMAIN="smarty-telegram"
PORT=3001
PID_FILE="/tmp/smarty-telegram-tunnel.pid"
LOG_FILE="/tmp/smarty-telegram-tunnel.log"

# Cleanup function
cleanup() {
    echo "🛑 Stopping tunnel..."
    if [ -f "$PID_FILE" ]; then
        kill $(cat "$PID_FILE") 2>/dev/null
        rm -f "$PID_FILE"
    fi
    pkill -f "localtunnel.*$SUBDOMAIN" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Function to start tunnel
start_tunnel() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🌐 Starting localtunnel..."
    
    # Kill any existing tunnel
    pkill -f "localtunnel.*$SUBDOMAIN" 2>/dev/null
    sleep 1
    
    # Start tunnel in background
    nohup npx localtunnel --port $PORT --subdomain $SUBDOMAIN > "$LOG_FILE" 2>&1 &
    TUNNEL_PID=$!
    echo $TUNNEL_PID > "$PID_FILE"
    
    sleep 3
    
    # Verify tunnel started
    if ps -p $TUNNEL_PID > /dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Tunnel started (PID: $TUNNEL_PID)"
        
        # Reset webhook
        curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${SUBDOMAIN}.loca.lt/api/telegram/webhook" > /dev/null
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Webhook configured"
        
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Failed to start tunnel"
        return 1
    fi
}

# Function to check tunnel health
check_tunnel() {
    # Check if process is running
    if [ -f "$PID_FILE" ]; then
        TUNNEL_PID=$(cat "$PID_FILE")
        if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Tunnel process died"
            return 1
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  No PID file found"
        return 1
    fi
    
    # Check webhook status
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${SUBDOMAIN}.loca.lt/api/telegram/webhook" 2>/dev/null)
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Tunnel not responding (HTTP $HTTP_CODE)"
        return 1
    fi
    
    # Check pending updates
    PENDING=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['pending_update_count'])" 2>/dev/null)
    
    if [ "$PENDING" -gt 5 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  High pending updates: $PENDING"
        return 1
    fi
    
    return 0
}

# Main loop
echo "🚀 Telegram Webhook Keepalive Started"
echo "📍 Configuration:"
echo "   Bot Token: ${BOT_TOKEN:0:10}..."
echo "   Subdomain: $SUBDOMAIN.loca.lt"
echo "   Port: $PORT"
echo "   Check Interval: 10 seconds"
echo ""

# Initial start
start_tunnel

# Monitor loop
while true; do
    sleep 10
    
    if ! check_tunnel; then
        echo ""
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 Restarting tunnel..."
        start_tunnel
    fi
done
