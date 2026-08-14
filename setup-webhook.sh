#!/bin/bash

# Setup Telegram Webhook
# This tells Telegram where to send messages

echo "🌐 TELEGRAM WEBHOOK SETUP"
echo "==========================="
echo ""

BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
SECRET_TOKEN="smarty-telegram-webhook-secret-2025"

echo "Your app is running on: http://localhost:3001"
echo "For Telegram to reach it, you need a public URL."
echo ""
echo "Options:"
echo "1. Use ngrok (recommended for local development)"
echo "2. Use production URL (if deployed)"
echo ""
read -p "Do you have ngrok running? (y/n): " HAS_NGROK

if [ "$HAS_NGROK" = "y" ]; then
    echo ""
    read -p "Enter your ngrok URL (e.g., https://abc123.ngrok.io): " NGROK_URL
    
    WEBHOOK_URL="${NGROK_URL}/api/telegram/webhook"
    
    echo ""
    echo "Setting webhook to: $WEBHOOK_URL"
    
    # Set webhook
    curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
      -H "Content-Type: application/json" \
      -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${SECRET_TOKEN}\"}" | jq
    
    echo ""
    echo "✅ Webhook set!"
    
    # Verify
    echo ""
    echo "Verifying webhook..."
    curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.result | {url, has_custom_certificate, pending_update_count, last_error_date, last_error_message}'
    
else
    echo ""
    echo "❌ Without ngrok or a public URL, Telegram cannot reach your localhost."
    echo ""
    echo "To fix this:"
    echo "1. Install ngrok: https://ngrok.com/"
    echo "2. Run: ngrok http 3001"
    echo "3. Copy the https URL (e.g., https://abc123.ngrok.io)"
    echo "4. Run this script again and paste the URL"
    echo ""
    echo "OR deploy your app to Vercel/AWS and use that URL"
fi

echo ""
echo "==========================="
echo "📱 After setting webhook:"
echo "1. Send message from Telegram app"
echo "2. Watch your terminal logs"
echo "3. Bot will respond!"
