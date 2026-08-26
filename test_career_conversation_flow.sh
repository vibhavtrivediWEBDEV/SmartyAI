#!/bin/bash

echo "🎯 Career Agent Conversation Flow Test"
echo "======================================="
echo ""

echo "This script simulates the AI conversation flow"
echo ""
echo "Test Case 1: User says 'I have an interview'"
echo "Expected AI Response: 'Great! Which company are you interviewing with?'"
echo ""

echo "Test Case 2: User says 'At Google'"
echo "Expected AI Response: 'What role or position at Google?'"
echo ""

echo "Test Case 3: User says 'React Developer'"
echo "Expected AI Response: 'When is your interview? Say something like \"in 5 days\"'"
echo ""

echo "Test Case 4: User says 'In 5 days'"
echo "Expected AI Response: 'Perfect! Confirms: Google - React Developer - [Date]. Create mission?'"
echo ""

echo "Test Case 5: User says 'Yes'"
echo "Expected: Creates mission in MongoDB"
echo ""

echo "======================================="
echo "Testing Entity Extraction Logic"
echo "======================================="
echo ""

# Test entity extraction
node << 'NODEJS'
const testInputs = [
  "I have an interview at Google",
  "Applying for React Developer role",
  "Interview in 5 days",
  "At Microsoft for Senior Engineer in 2 weeks",
  "Amazon, Product Manager, 10 days from now"
];

testInputs.forEach(input => {
  console.log(`\nInput: "${input}"`);
  
  // Extract company
  const companyMatch = input.match(/(?:at|for|with|company is)\s+([A-Z][A-Za-z\s]+?)(?:\s+(?:in|for|as|position|role)|$)/i);
  if (companyMatch) console.log(`  ✓ Company: ${companyMatch[1].trim()}`);
  
  // Extract role
  const roleMatch = input.match(/(?:role|position|title|as|for)\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+(?:at|for|with)|$)/i);
  if (roleMatch) console.log(`  ✓ Role: ${roleMatch[1].trim()}`);
  
  // Extract days
  const daysMatch = input.match(/(?:in|within)\s+(\d+)\s+days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() + days);
    console.log(`  ✓ Interview Date: ${date.toLocaleDateString()}`);
  }
  
  const weeksMatch = input.match(/(?:in|within)\s+(\d+)\s+weeks?/i);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() + (weeks * 7));
    console.log(`  ✓ Interview Date: ${date.toLocaleDateString()}`);
  }
});

console.log("\n✅ Entity extraction test complete!");
NODEJS

echo ""
echo "======================================="
echo "How the AI Conversation Works"
echo "======================================="
echo ""
echo "1. User activates Career Agent (clicks MIC or says 'interview')"
echo "2. Agent checks MongoDB for existing missions"
echo "3. If found: Shows context and asks if user wants to continue"
echo "4. If not found: Asks 'Which company?'"
echo "5. User says: 'Google'"
echo "6. Agent extracts company='Google', asks 'What role?'"
echo "7. User says: 'React Developer'"
echo "8. Agent extracts role='React Developer', asks 'When?'"
echo "9. User says: 'In 5 days'"
echo "10. Agent extracts date, shows confirmation"
echo "11. User says: 'Yes'"
echo "12. Agent creates mission in MongoDB"
echo "13. Mission saved to career_missions collection"
echo "14. Progress panel updates with new mission"
echo "15. Apps open (Notes, Calendar, Interview, Teacher)"
echo ""
echo "======================================="
echo "MongoDB Documents Created"
echo "======================================="
echo ""
cat << 'MONGODB'
{
  "_id": ObjectId("..."),
  "userId": ObjectId("user_id"),
  "company": "Google",
  "role": "React Developer",
  "jobDescription": null,
  "interviewDate": ISODate("2026-09-01T00:00:00Z"),
  "status": "CREATED",
  "priority": "medium",
  "progress": 0,
  "createdAt": ISODate("2026-08-27T00:00:00Z"),
  "updatedAt": ISODate("2026-08-27T00:00:00Z")
}
MONGODB

echo ""
echo "✅ Test complete! The AI will now ask structured questions."
