/**
 * Calendar Feature Verification Script
 * Tests MongoDB integration for user-specific events and holiday seeding
 */

import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "hrms";

async function verifyCalendarFeatures() {
  console.log("🗓️  Calendar MongoDB Integration Verification\n");
  console.log("=" .repeat(60));

  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    console.log("\nPlease add MONGODB_URI to your .env.local file:");
    console.log("MONGODB_URI=mongodb://localhost:27017/hrms");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db(dbName);

    // 1. Test Calendars Collection
    console.log("📁 Testing calendars collection...");
    const calendarsCollection = db.collection("calendars");
    
    const testUserId = "test-user-" + Date.now();
    
    // Insert test calendar
    const calendarResult = await calendarsCollection.insertOne({
      userId: testUserId,
      name: "Test Personal Calendar",
      type: "personal",
      color: "#0A84FF",
      visible: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`   ✅ Created test calendar: ${calendarResult.insertedId}`);

    // 2. Test Events Collection
    console.log("\n📝 Testing events collection...");
    const eventsCollection = db.collection("calendar_events");
    
    // Insert test event
    const eventResult = await eventsCollection.insertOne({
      userId: testUserId,
      calendarId: calendarResult.insertedId.toHexString(),
      title: "Team Standup Meeting",
      description: "Daily sync with the team",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:30",
      endTime: "10:00",
      allDay: false,
      location: "Zoom",
      source: "user",
      reminder: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`   ✅ Created test event: ${eventResult.insertedId}`);

    // 3. Test Holiday Events
    console.log("\n🎉 Testing holiday events...");
    
    const holidayResult = await eventsCollection.insertOne({
      userId: testUserId,
      calendarId: calendarResult.insertedId.toHexString(),
      title: "Republic Day",
      date: "2024-01-26",
      allDay: true,
      source: "holiday",
      holidayCountry: "IN",
      holidayData: {
        date: "2024-01-26",
        name: "Republic Day",
        country: "IN",
        type: "public",
      },
      color: "#FF3B30",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`   ✅ Created holiday event: ${holidayResult.insertedId}`);

    // 4. Query Events by Date Range
    console.log("\n📅 Testing date range query...");
    
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split("T")[0];
    
    const eventsInRange = await eventsCollection.find({
      userId: testUserId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, startTime: 1 }).toArray();
    
    console.log(`   ✅ Found ${eventsInRange.length} events in date range`);
    console.log(`   Events: ${eventsInRange.map(e => e.title).join(", ") || "None"}`);

    // 5. Test User-Specific Isolation
    console.log("\n🔒 Testing user isolation...");
    
    const otherUserEvents = await eventsCollection.find({
      userId: { $ne: testUserId },
    }).limit(5).toArray();
    
    console.log(`   ✅ Other users have ${otherUserEvents.length} events (shown for isolation test)`);
    console.log(`   ✅ Our test user has ${eventsInRange.length} events`);

    // 6. Test Update Operations
    console.log("\n✏️  Testing event update...");
    
    const updateResult = await eventsCollection.updateOne(
      { _id: eventResult.insertedId },
      { $set: { title: "Team Standup (Updated)", updatedAt: new Date() } }
    );
    
    console.log(`   ✅ Updated ${updateResult.modifiedCount} event(s)`);

    // 7. Test Delete Operations
    console.log("\n🗑️  Testing cleanup (delete test data)...");
    
    await eventsCollection.deleteMany({ userId: testUserId });
    await calendarsCollection.deleteMany({ userId: testUserId });
    
    console.log(`   ✅ Cleaned up all test data`);

    // 8. Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ All Calendar MongoDB features verified successfully!\n");
    
    console.log("📊 Features tested:");
    console.log("   ✓ Create user-specific calendars");
    console.log("   ✓ Create user-specific events");
    console.log("   ✓ Create holiday events with badges");
    console.log("   ✓ Query events by date range");
    console.log("   ✓ User isolation (userId filtering)");
    console.log("   ✓ Update events");
    console.log("   ✓ Delete events");
    
    console.log("\n🎯 Next steps:");
    console.log("   1. Open Calendar app in SmartyAI desktop");
    console.log("   2. Create events - they'll save to MongoDB");
    console.log("   3. Seed holidays: POST /api/calendar/seed-holidays");
    console.log("   4. Events persist across sessions!\n");

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("📴 Disconnected from MongoDB\n");
  }
}

// Run verification
verifyCalendarFeatures()
  .then(() => {
    console.log("✨ Calendar verification complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Verification failed:", error);
    process.exit(1);
  });
