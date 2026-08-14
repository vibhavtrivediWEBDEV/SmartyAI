#!/bin/bash

# Quick Telegram Webhook Setup for Port 3001
# Run this script to fix webhook and test connection

echo "🔧 TELEGRAM WEBHOOK FIX - PORT 3001"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
TELEGRAM_SECRET_TOKEN="smarty-telegram-webhook-secret-2025"
BASE_URL="http://localhost:3001"

echo -e "${YELLOW}⚠️  Note: Your app is running on port 3001${NC}"
echo ""

# Ask if using ngrok
echo -e "${BLUE}Are you using ngrok? (y/n)${NC}"
read -r USE_NGROK

if [ "$USE_NGROK" = "y" ] || [ "$USE_NGROK" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}Enter your ngrok URL (without https://):${NC}"
    read -r NGROK_URL
    
    WEBHOOK_URL="https://${NGROK_URL}/api/telegram/webhook"
    
    echo ""
    echo -e "${BLUE}Setting webhook to:${NC} $WEBHOOK_URL"
    
    # Set webhook with secret token
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
      -H "Content-Type: application/json" \
      -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${TELEGRAM_SECRET_TOKEN}\"}" | jq
    
    echo ""
    echo -e "${GREEN}✅ Webhook set with secret token!${NC}"
else
    echo ""
    echo -e "${YELLOW}Testing local webhook endpoint...${NC}"
    
    # Test local endpoint
    curl -s "${BASE_URL}/api/telegram/webhook" | jq
    
    echo ""
    echo -e "${YELLOW}Note: For Telegram to reach your localhost, you need ngrok or similar tunnel${NC}"
    echo "Run: ngrok http 3001"
fi

echo ""
echo -e "${BLUE}Testing bot connection...${NC}"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.result.first_name'

echo ""
echo -e "${BLUE}Checking webhook info...${NC}"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq

echo ""
echo "===================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open: ${BASE_URL}/desktop"
echo "2. Click Settings → Telegram"
echo "3. Click 'Connect Telegram'"
echo "4. Send a message to the bot!"
echo ""
echo -e "${YELLOW}For curl tests, use port 3001:${NC}"
echo "curl -s \"http://localhost:3001/api/telegram/webhook\" | jq"
echo ""
