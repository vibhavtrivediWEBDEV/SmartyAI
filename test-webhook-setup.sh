#!/bin/bash

# Telegram Webhook Setup Script
# This script helps set up a local webhook for testing

echo "🤖 Telegram Webhook Setup"
echo "=========================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo ""
    echo "Install ngrok:"
    echo "  brew install ngrok"
    echo ""
    echo "Or download from: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok found"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set in .env"
    exit 1
fi

echo "✅ Bot token found: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo ""

# Start ngrok if not running
echo "🚀 Starting ngrok..."
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print(json.load(sys.stdin)['tunnels'][0]['public_url'])")

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $NGROK_PID
    exit 1
fi

echo "✅ ngrok started: $NGROK_URL"
echo ""

# Set webhook
WEBHOOK_URL="${NGROK_URL}/api/telegram/webhook"
SECRET_TOKEN="${TELEGRAM_SECRET_TOKEN:-smarty-telegram-webhook-secret-2025}"

echo "📡 Setting webhook to: $WEBHOOK_URL"
echo ""

RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -d "url=${WEBHOOK_URL}" \
    -d "secret_token=${SECRET_TOKEN}" \
    -d "allowed_updates[]=message" \
    -d "allowed_updates[]=edited_message" \
    -d "allowed_updates[]=callback_query")

echo "$RESPONSE" | python3 -m json.tool
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook set successfully!"
    echo ""
    echo "📱 Test Instructions:"
    echo "   1. Make sure dev server is running: npm run dev"
    echo "   2. Send a message to @Smartyvibhavbot"
    echo "   3. Check server console for logs"
    echo "   4. Check MongoDB for message logs"
    echo ""
    echo "📊 View ngrok dashboard: http://localhost:4040"
    echo "🛑 Press Ctrl+C to stop ngrok"
    echo ""
    
    # Update .env with webhook URL
    if grep -q "TELEGRAM_WEBHOOK_URL=" .env; then
        sed -i '' "s|TELEGRAM_WEBHOOK_URL=.*|TELEGRAM_WEBHOOK_URL=${WEBHOOK_URL}|" .env
    else
        echo "TELEGRAM_WEBHOOK_URL=${WEBHOOK_URL}" >> .env
    fi
    
    echo "✅ Updated .env with TELEGRAM_WEBHOOK_URL"
    echo ""
    
    # Keep script running
    wait $NGROK_PID
else
    echo "❌ Failed to set webhook"
    kill $NGROK_PID
    exit 1
fi
