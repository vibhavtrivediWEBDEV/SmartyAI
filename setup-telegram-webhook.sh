#!/bin/bash

# Telegram Webhook Setup Script
# This script sets up a localtunnel and configures the Telegram webhook

echo "🚀 Setting up Telegram Webhook for SmartyAI..."
echo ""

# Check if .env file has bot token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not found in environment"
    echo "Please add TELEGRAM_BOT_TOKEN to .env.local"
    exit 1
fi

echo "✅ Bot token found: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo ""

# Kill any existing localtunnel processes
echo "🔄 Cleaning up existing tunnels..."
pkill -f "localtunnel" 2>/dev/null || true
sleep 2

# Start localtunnel in background
echo "🌐 Starting localtunnel..."
npx localtunnel --port 3001 --subdomain smarty-telegram > /dev/null 2>&1 &
TUNNEL_PID=$!

# Wait for tunnel to start
sleep 3

# Check if tunnel is running
if ps -p $TUNNEL_PID > /dev/null; then
    echo "✅ Localtunnel started (PID: $TUNNEL_PID)"
else
    echo "❌ Failed to start localtunnel"
    exit 1
fi

# Set webhook
echo ""
echo "📡 Configuring Telegram webhook..."
WEBHOOK_URL="https://smarty-telegram.loca.lt/api/telegram/webhook"

RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook configured successfully!"
    echo ""
    echo "📍 Webhook URL: $WEBHOOK_URL"
    echo ""
    echo "🧪 Test by sending a message to your Telegram bot"
    echo "   Bot username: @smarty_ai_bot"
    echo "   Chat ID: 1520574544"
    echo ""
    echo "📊 Check webhook status:"
    echo "   curl -s 'https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo' | python3 -m json.tool"
    echo ""
    echo "🛑 To stop the tunnel: kill $TUNNEL_PID"
    echo ""
else
    echo "❌ Failed to set webhook"
    echo "Response: $RESPONSE"
    kill $TUNNEL_PID
    exit 1
fi

# Keep script running to maintain tunnel
echo "⏳ Keeping tunnel alive... (Press Ctrl+C to stop)"
echo ""

# Save PID to file for later cleanup
echo $TUNNEL_PID > /tmp/smarty-telegram-tunnel.pid

# Monitor tunnel health
while ps -p $TUNNEL_PID > /dev/null 2>&1; do
    sleep 60
    echo "✅ Tunnel still active at $(date)"
done

echo ""
echo "🛑 Tunnel stopped"
rm -f /tmp/smarty-telegram-tunnel.pid
