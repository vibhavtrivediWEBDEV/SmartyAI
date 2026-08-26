#!/bin/bash

echo "📊 MongoDB Career Missions Verification"
echo "======================================="
echo ""

echo "Checking if mongosh is available..."
if ! command -v mongosh &> /dev/null; then
    echo "❌ mongosh not found. Install MongoDB Shell to check data."
    echo ""
    echo "Alternative: Use MongoDB Compass"
    echo "1. Open MongoDB Compass"
    echo "2. Connect to: mongodb://localhost:27017/smartyai_dev"
    echo "3. Navigate to 'career_missions' collection"
    echo "4. Filter by your userId"
    echo ""
    exit 1
fi

echo "✅ mongosh found!"
echo ""

echo "Querying career_missions collection..."
echo ""

mongosh smartyai_dev --quiet --eval '
  db = db.getSiblingDB("smartyai_dev");
  
  print("Collection: career_missions");
  print("Total missions: " + db.career_missions.countDocuments());
  print("");
  
  const missions = db.career_missions.find({}).sort({createdAt: -1}).limit(5).toArray();
  
  if (missions.length === 0) {
    print("No missions found.");
    print("");
    print("To create a mission:");
    print("1. Open http://localhost:3001");
    print("2. Click MIC button");
    print("3. Say: \"I have an interview at Google for React Developer in 5 days\"");
    print("4. Answer questions");
    print("5. Say \"Yes\" to create mission");
  } else {
    print("Recent missions:");
    print("");
    missions.forEach((m, i) => {
      print(`Mission ${i + 1}:`);
      print(`  ID: ${m._id}`);
      print(`  User: ${m.userId}`);
      print(`  Company: ${m.company || "N/A"}`);
      print(`  Role: ${m.role || "N/A"}`);
      print(`  Status: ${m.status || "N/A"}`);
      print(`  Priority: ${m.priority || "N/A"}`);
      print(`  Progress: ${m.progress || 0}%`);
      print(`  Interview: ${m.interviewDate ? new Date(m.interviewDate).toLocaleDateString() : "TBD"}`);
      print(`  Created: ${new Date(m.createdAt).toLocaleString()}`);
      print("");
    });
  }
  
  print("Other collections:");
  print("  career_tasks: " + db.career_tasks.countDocuments() + " documents");
  print("  career_plans: " + db.career_plans.countDocuments() + " documents");
  print("  career_agent_logs: " + db.career_agent_logs.countDocuments() + " documents");
'

echo ""
echo "======================================="
echo "✅ Verification complete!"
echo ""
echo "Troubleshooting:"
echo "• If no missions found, test the conversation flow"
echo "• Check server logs: tail -f /tmp/smarty-server.log"
echo "• Test entity extraction: ./test_career_conversation_flow.sh"
