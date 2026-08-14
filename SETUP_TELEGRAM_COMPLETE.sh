#!/bin/bash

# Complete Telegram Bot Setup with ngrok
# This script handles everything: MongoDB, ngrok, and webhook setup

set -e

echo "🚀 Complete Telegram Setup with ngrok"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo "📋 Step 1: Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js ${NC}$(node --version)"

# Step 2: Check/Install MongoDB
echo ""
echo "📋 Step 2: Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB not installed${NC}"
    echo ""
    echo "Options:"
    echo "  1. Use MongoDB Atlas (cloud - recommended)"
    echo "  2. Install MongoDB locally"
    echo ""
    read -p "Use MongoDB Atlas? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Setting up MongoDB Atlas..."
        echo "Please provide your MongoDB Atlas connection string"
        echo "(Get it from: https://cloud.mongodb.com)"
        echo "Format: mongodb+srv://username:password@cluster.mongodb.net/dbname"
        echo ""
        read -p "MongoDB Atlas URI: " MONGODB_ATLAS_URI
        
        # Update .env
        if [ -f .env ]; then
            # Check if MONGODB_URI exists
            if grep -q "MONGODB_URI=" .env; then
                # Update existing
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_ATLAS_URI|" .env
                else
                    sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_ATLAS_URI|" .env
                fi
            else
                # Add new
                echo "" >> .env
                echo "# MongoDB Atlas" >> .env
                echo "MONGODB_URI=$MONGODB_ATLAS_URI" >> .env
            fi
        fi
        
        echo -e "${GREEN}✅ MongoDB Atlas configured${NC}"
    else
        echo ""
        echo "To install MongoDB locally:"
        echo "  macOS: brew tap mongodb/brew && brew install mongodb-community"
        echo "  Linux: sudo apt-get install mongodb"
        echo "  Or download from: https://www.mongodb.com/try/download/community"
        echo ""
        echo "Alternatively, use a simple JSON file for testing:"
        
        # Create a simple JSON-based storage for testing
        read -p "Use JSON file storage for testing? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            MONGODB_URI="file://./data/telegram-data.json"
            echo "" >> .env
            echo "MONGODB_URI=$MONGODB_URI" >> .env
            mkdir -p data
            echo '{"connections":[],"messages":[]}' > data/telegram-data.json
            echo -e "${GREEN}✅ JSON storage configured${NC}"
        else
            echo -e "${RED}Cannot proceed without database. Exiting.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ MongoDB found${NC}"
    
    # Check if running
    if pgrep -x mongod > /dev/null; then
        echo -e "${GREEN}✅ MongoDB is running${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB not running, starting...${NC}"
        mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db 2>/dev/null || \
        mongod --fork --logpath ./mongodb.log --dbpath ./data/db 2>/dev/null || \
        echo -e "${YELLOW}Could not start MongoDB. Please start manually.${NC}"
    fi
fi

# Step 3: Check ngrok
echo ""
echo "📋 Step 3: Checking ngrok..."

# Check multiple installation locations
NGROK=""
if command -v ngrok &> /dev/null; then
    NGROK=$(which ngrok)
elif [ -f /usr/local/bin/ngrok ]; then
    NGROK=/usr/local/bin/ngrok
elif [ -f ~/ngrok ]; then
    NGROK=~/ngrok
elif [ -f ./ngrok ]; then
    NGROK=./ngrok
fi

if [ -z "$NGROK" ]; then
    echo -e "${YELLOW}⚠️  ngrok not found${NC}"
    echo ""
    echo "Downloading ngrok..."
    
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        NGROK_URL="https://bin.equinox.io/c/bVjXqD4Vql4/ngrok-stable-darwin-arm64.zip"
    else
        NGROK_URL="https://bin.equinox.io/c/bVjXqD4Vql4/ngrok-stable-darwin-amd64.zip"
    fi
    
    echo "Downloading from: $NGROK_URL"
    curl -o /tmp/ngrok.zip "$NGROK_URL"
    unzip -o /tmp/ngrok.zip -d /tmp/
    chmod +x /tmp/ngrok
    
    # Move to local bin
    mkdir -p ./bin
    mv /tmp/ngrok ./bin/
    chmod +x ./bin/ngrok
    
    NGROK=./bin/ngrok
    echo -e "${GREEN}✅ ngrok downloaded${NC}"
else
    echo -e "${GREEN}✅ ngrok found: $NGROK${NC}"
fi

# Step 4: Load environment variables
echo ""
echo "📋 Step 4: Loading environment variables..."

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment loaded${NC}"
echo "   Bot token: ${TELEGRAM_BOT_TOKEN:0:10}..."

# Step 5: Check current webhook status
echo ""
echo "📋 Step 5: Checking current webhook..."

WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
PENDING_COUNT=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | cut -d':' -f2)

echo "Current webhook: ${WEBHOOK_URL:-'Not set'}"
echo "Pending updates: ${PENDING_COUNT:-0}"

# Step 6: Start development server
echo ""
echo "📋 Step 6: Starting development server..."

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Server already running on port 3000${NC}"
else
    echo "Starting server..."
    npm run dev > /tmp/smarty-server.log 2>&1 &
    SERVER_PID=$!
    
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server started${NC}"
            break
        fi
        sleep 1
    done
    
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${RED}❌ Server failed to start${NC}"
        echo "Check logs: tail -f /tmp/smarty-server.log"
        exit 1
    fi
fi

# Step 7: Start ngrok
echo ""
echo "📋 Step 7: Starting ngrok..."

# Check if ngrok is already running
NGROK_API="http://localhost:4040"
NGROK_URL=""

# Try to get existing ngrok tunnel
for i in {1..5}; do
    NGROK_URL=$(curl -s "$NGROK_API/api/tunnels" 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}✅ ngrok already running${NC}"
        echo "   URL: $NGROK_URL"
        break
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo "Starting ngrok..."
    $NGROK http 3000 > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    
    echo "Waiting for ngrok to start..."
    for i in {1..15}; do
        NGROK_URL=$(curl -s "$NGROK_API/api/tunnels" 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$NGROK_URL" ]; then
            echo -e "${GREEN}✅ ngrok started${NC}"
            echo "   URL: $NGROK_URL"
            break
        fi
        sleep 1
    done
    
    if [ -z "$NGROK_URL" ]; then
        echo -e "${RED}❌ ngrok failed to start${NC}"
        echo "Check logs: tail -f /tmp/ngrok.log"
        exit 1
    fi
fi

# Step 8: Set webhook
echo ""
echo "📋 Step 8: Setting webhook..."

NEW_WEBHOOK_URL="${NGROK_URL}/api/telegram/webhook"
SECRET_TOKEN="${TELEGRAM_SECRET_TOKEN:-smarty-telegram-webhook-secret-2025}"

echo "Setting webhook to: $NEW_WEBHOOK_URL"

WEBHOOK_RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -d "url=$NEW_WEBHOOK_URL" \
    -d "secret_token=$SECRET_TOKEN" \
    -d "allowed_updates[]=message" \
    -d "allowed_updates[]=edited_message" \
    -d "allowed_updates[]=callback_query")

if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Webhook set successfully!${NC}"
    
    # Update .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|TELEGRAM_WEBHOOK_URL=.*|TELEGRAM_WEBHOOK_URL=$NEW_WEBHOOK_URL|" .env
    else
        sed -i "s|TELEGRAM_WEBHOOK_URL=.*|TELEGRAM_WEBHOOK_URL=$NEW_WEBHOOK_URL|" .env
    fi
    
    echo -e "${GREEN}✅ .env updated${NC}"
else
    echo -e "${RED}❌ Failed to set webhook${NC}"
    echo "$WEBHOOK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_RESPONSE"
    exit 1
fi

# Step 9: Send test message
echo ""
echo "📋 Step 9: Sending test message..."

if [ -n "$TELEGRAM_CHAT_ID" ]; then
    TEST_MESSAGE="🚀 *Telegram Bot is Active!*

✅ Webhook configured
✅ Server running
✅ Bidirectional messaging enabled

Send me any message and I'll respond!"

    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=$TEST_MESSAGE" \
        -d "parse_mode=Markdown" > /dev/null
    
    echo -e "${GREEN}✅ Test message sent to Telegram${NC}"
fi

# Step 10: Get final webhook status
echo ""
echo "📋 Step 10: Final webhook status..."

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool | grep -E '(url|pending_update_count|last_error_date)'

# Success message
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Telegram Bot: @Smartyvibhavbot"
echo "🌐 Webhook: $NEW_WEBHOOK_URL"
echo "📊 Dashboard: http://localhost:4040"
echo ""
echo "🧪 Testing:"
echo "   1. Open Telegram"
echo "   2. Send 'Hi' to @Smartyvibhavbot"
echo "   3. Bot will respond!"
echo ""
echo "📝 Logs:"
echo "   Server: tail -f /tmp/smarty-server.log"
echo "   ngrok:  tail -f /tmp/ngrok.log"
echo "   MongoDB: Check data/telegram-data.json or Atlas"
echo ""
echo "🔄 Bidirectional messaging is ACTIVE!"
echo "   Telegram → Your Server → AI → Telegram"
echo ""
echo "Press Ctrl+C to stop when done testing"
echo ""

# Keep script running
wait
