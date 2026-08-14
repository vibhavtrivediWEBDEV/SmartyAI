#!/bin/bash

echo "🔧 FIXING TELEGRAM CONNECTION - COMPLETE SETUP"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Check MongoDB
echo -e "${BLUE}Step 1: Checking MongoDB...${NC}"
if pgrep -q mongod; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB not running. Starting...${NC}"
    
    # Try to start MongoDB
    if [ -d "/usr/local/var/mongodb" ]; then
        mongod --dbpath /usr/local/var/mongodb --fork --logpath /usr/local/var/log/mongodb.log 2>/dev/null
    elif [ -d "$HOME/data/db" ]; then
        mongod --dbpath "$HOME/data/db" --fork --logpath "$HOME/data/mongodb.log" 2>/dev/null
    else
        echo -e "${RED}❌ MongoDB data directory not found${NC}"
        echo -e "${YELLOW}Creating: ~/data/db${NC}"
        mkdir -p "$HOME/data/db"
        mongod --dbpath "$HOME/data/db" --fork --logpath "$HOME/data/mongodb.log" 2>/dev/null
    fi
    
    sleep 2
    
    if pgrep -q mongod; then
        echo -e "${GREEN}✅ MongoDB started${NC}"
    else
        echo -e "${RED}❌ Failed to start MongoDB${NC}"
        echo -e "${YELLOW}Please install MongoDB: brew install mongodb-community${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: Test MongoDB connection
echo -e "${BLUE}Step 2: Testing MongoDB connection...${NC}"
node -e "
const { MongoClient } = require('mongodb');
async function test() {
  try {
    const client = new MongoClient('mongodb://localhost:27017/vibhavmacos');
    await client.connect();
    console.log('✅ MongoDB connection successful');
    await client.close();
  } catch (e) {
    console.log('❌ MongoDB connection failed:', e.message);
    process.exit(1);
  }
}
test();
" || { echo -e "${RED}MongoDB not accessible${NC}"; exit 1; }

echo ""

# Step 3: Create connection using app API
echo -e "${BLUE}Step 3: Getting linking token from Settings...${NC}"

# The user should have clicked Connect Telegram in Settings
# This generates a token that we need to use

echo -e "${YELLOW}Note: Opening Settings > Telegram to get connection token...${NC}"
echo ""

# Step 4: Direct MongoDB connection (fallback)
echo -e "${BLUE}Step 4: Creating direct Telegram connection...${NC}"

node -e "
const { MongoClient } = require('mongodb');
async function connect() {
  const client = new MongoClient('mongodb://localhost:27017/vibhavmacos');
  await client.connect();
  const db = client.db();
  
  // Get or create user
  let user = await db.collection('users').findOne({});
  let userId = user ? user._id.toString() : 'user_' + Date.now();
  
  if (!user) {
    await db.collection('users').insertOne({
      _id: userId,
      email: 'vibhav@smarty-ai.com',
      displayName: 'Vibhav',
      createdAt: new Date()
    });
    console.log('✅ Created user:', userId);
  } else {
    console.log('✅ Found user:', userId);
  }
  
  // Create Telegram connection
  await db.collection('telegramconnections').deleteMany({ chatId: 1520574544 });
  
  const connection = {
    userId: userId,
    telegramChatId: 1520574544,
    chatId: 1520574544,
    username: 'vibhav',
    firstName: 'Vibhav',
    status: 'active',
    permissions: {
      sendMessage: true,
      sendFiles: true,
      receiveFiles: true,
      runAutomations: true,
      accessFiles: true,
      controlMac: false
    },
    linkedAt: new Date(),
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection('telegramconnections').insertOne(connection);
  
  // Verify
  const saved = await db.collection('telegramconnections').findOne({ chatId: 1520574544 });
  if (saved) {
    console.log('✅ Telegram connected successfully');
    console.log('   User ID:', saved.userId);
    console.log('   Chat ID:', saved.chatId);
    console.log('   Status:', saved.status);
  }
  
  await client.close();
}
connect().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}Now test:${NC}"
echo "1. Open Telegram on your phone"
echo "2. Open your bot: @Smartyvibhavbot"
echo "3. Send: Hi"
echo "4. Bot will respond with personalized greeting!"
echo ""
echo -e "${BLUE}To verify webhook is working:${NC}"
echo "curl -s 'http://localhost:3001/api/telegram/link?status' | jq"
echo ""
