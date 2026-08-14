#!/bin/bash

# Telegram Bidirectional Connection Testing Script
# Run this script to test the complete flow

echo "🧪 TELEGRAM BIDIRECTIONAL CONNECTION TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TELEGRAM_BOT_TOKEN="8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q"
BASE_URL="http://localhost:3000"

echo -e "${BLUE}1️⃣ Testing Bot Connection...${NC}"
echo "Checking if bot is accessible..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq -C
echo ""

echo -e "${BLUE}2️⃣ Checking Webhook Status...${NC}"
echo "Checking webhook configuration..."
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq -C
echo ""

echo -e "${BLUE}3️⃣ Testing Local Webhook Endpoint...${NC}"
echo "Checking if local webhook is active..."
curl -s "${BASE_URL}/api/telegram/webhook" | jq -C
echo ""

echo -e "${BLUE}4️⃣ Testing Link Generation (Requires Login)...${NC}"
echo "Attempting to generate Telegram link..."
echo "⚠️  Note: This requires you to be logged in to SmartyAI"
echo "Run this command manually with your session cookie:"
echo ""
echo -e "${YELLOW}curl -X POST \"${BASE_URL}/api/telegram/link\" -H \"Cookie: your-session-cookie\" | jq${NC}"
echo ""

echo -e "${BLUE}5️⃣ Testing Connection Status...${NC}"
echo "Checking connection status..."
echo "Run this command manually with your session cookie:"
echo ""
echo -e "${YELLOW}curl -X GET \"${BASE_URL}/api/telegram/link\" -H \"Cookie: your-session-cookie\" | jq${NC}"
echo ""

echo -e "${GREEN}✅ Basic connectivity tests complete!${NC}"
echo ""
echo "=========================================="
echo "📱 MANUAL TESTING STEPS"
echo "=========================================="
echo ""
echo "1. Open SmartyAI: http://localhost:3000/desktop"
echo "2. Click Settings (gear icon)"
echo "3. Click Telegram in sidebar"
echo "4. Click 'Connect Telegram' button"
echo "5. Telegram bot opens automatically"
echo "6. Click 'Start' in Telegram"
echo "7. Connection established!"
echo "8. Page redirects back to desktop"
echo ""
echo "=========================================="
echo "🤖 TELEGRAM AI TEST COMMANDS"
echo "=========================================="
echo ""
echo "After connecting, send these messages to test:"
echo ""
echo -e "${YELLOW}Test 1: Basic Question${NC}"
echo "Message: 'What is my name?'"
echo "Expected: AI responds with your name from your profile"
echo ""
echo -e "${YELLOW}Test 2: Profile Summary${NC}"
echo "Message: 'Summarize my profile'"
echo "Expected: AI provides a summary of your resume/profile"
echo ""
echo -e "${YELLOW}Test 3: Skills${NC}"
echo "Message: 'What are my skills?'"
echo "Expected: AI lists your skills from your profile"
echo ""
echo -e "${YELLOW}Test 4: Projects${NC}"
echo "Message: 'Tell me about my projects'"
echo "Expected: AI describes your projects"
echo ""
echo "=========================================="
echo "🔧 ADVANCED TESTING"
echo "=========================================="
echo ""
echo -e "${BLUE}Set Webhook to ngrok (for local testing):${NC}"
echo "1. Run: ngrok http 3000"
echo "2. Copy ngrok URL"
echo "3. Run this command:"
echo ""
echo -e "${YELLOW}curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"url\": \"https://YOUR_NGROK_URL.ngrok.io/api/telegram/webhook\"}'${NC}"
echo ""
echo -e "${BLUE}Send Test Message from API:${NC}"
echo ""
echo -e "${YELLOW}curl -X POST \"https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"chat_id\": \"YOUR_CHAT_ID\", \"text\": \"Test from API\", \"parse_mode\": \"Markdown\"}'${NC}"
echo ""
echo -e "${BLUE}Simulate Webhook Update (Full AI Test):${NC}"
echo ""
echo -e "${YELLOW}curl -X POST \"${BASE_URL}/api/telegram/webhook\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"update_id\": 100001,"
echo "    \"message\": {"
echo "      \"message_id\": 101,"
echo "      \"from\": {\"id\": YOUR_CHAT_ID, \"first_name\": \"Vibhav\"},"
echo "      \"chat\": {\"id\": YOUR_CHAT_ID, \"type\": \"private\"},"
echo "      \"text\": \"What is my name?\""
echo "    }"
echo "  }'${NC}"
echo ""
echo "=========================================="
echo "📊 EXPECTED RESPONSE FORMAT"
echo "=========================================="
echo ""
echo -e "${GREEN}Webhook Active:${NC}"
echo '{'
echo '  "url": "https://your-domain.com/api/telegram/webhook",'
echo '  "has_custom_certificate": false,'
echo '  "pending_update_count": 0'
echo '}'
echo ""
echo -e "${GREEN}Connection Created:${NC}"
echo '{'
echo '  "userId": "user-123",'
echo '  "telegramChatId": 123456789,'
echo '  "firstName": "Vibhav",'
echo '  "connected": true'
echo '}'
echo ""
echo -e "${GREEN}AI Response:${NC}"
echo '{'
echo '  "content": "Based on your profile, you are Vibhav Trivedi...",'
echo '  "model": "gpt-4o-mini",'
echo '  "provider": "openai"'
echo '}'
echo ""
echo "=========================================="
echo "🎯 SUCCESS INDICATORS"
echo "=========================================="
echo ""
echo "✅ Bot responds to /start command"
echo "✅ Connection created in MongoDB"
echo "✅ Status shows 'Connected' in Settings"
echo "✅ AI responds with user context"
echo "✅ Messages logged in database"
echo "✅ Redirect back to desktop after connect"
echo ""
echo -e "${GREEN}🎉 Test script complete!${NC}"
echo ""
