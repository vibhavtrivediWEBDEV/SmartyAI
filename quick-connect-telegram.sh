#!/bin/bash

# QUICK FIX: Connect Your Telegram to SmartyAI
# Run this script to automatically connect your Telegram

echo "🚀 CONNECTING YOUR TELEGRAM TO SMARTYAI"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Your Telegram Chat ID (from logs)
TELEGRAM_CHAT_ID="1520574544"
MONGODB_URI="mongodb://localhost:27017/vibhavmacos"

echo -e "${YELLOW}Step 1: Getting your user ID from database...${NC}"
echo ""

# Get first user ID from MongoDB
USER_ID=$(mongosh "$MONGODB_URI" --quiet --eval '
  db.users.findOne({}, { _id: 1 }
).then(result => {
  if (result) {
    print(result._id);
  } else {
    print("NOT_FOUND");
  }
})
' | tail -n 1)

if [ "$USER_ID" = "NOT_FOUND" ] || [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}No user found. Creating test connection...${NC}"
    
    mongosh "$MONGODB_URI" --quiet --eval '
      db.telegramconnections.insertOne({
        userId: "test-user-001",
        telegramChatId: 1520574544,
        chatId: 1520574544,
        username: "vibhav",
        firstName: "Vibhav",
        status: "active",
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
      });
      print("✅ Connection created!");
    '
else
    echo -e "${BLUE}Found user: $USER_ID${NC}"
    
    echo ""
    echo -e "${YELLOW}Step 2: Creating Telegram connection...${NC}"
    
    mongosh "$MONGODB_URI" --quiet --eval "
      db.telegramconnections.deleteMany({ chatId: 1520574544 });
      db.telegramconnections.insertOne({
        userId: \"$USER_ID\",
        telegramChatId: 1520574544,
        chatId: 1520574544,
        username: \"vibhav\",
        firstName: \"Vibhav\",
        status: \"active\",
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
      });
      print(\"✅ Connection created for user: $USER_ID\");
    "
fi

echo ""
echo -e "${GREEN}✅ TELEGRAM CONNECTED!${NC}"
echo ""
echo "Now test:"
echo "1. Send 'Hi' to your Telegram bot"
echo "2. Bot will respond with AI greeting!"
echo ""
echo -e "${YELLOW}To verify connection:${NC}"
echo "mongosh \"$MONGODB_URI\" --quiet --eval 'db.telegramconnections.find({ chatId: 1520574544 }).pretty()'"
echo ""
