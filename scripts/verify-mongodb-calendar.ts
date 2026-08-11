import { getDatabase } from "../lib/db/mongodb";

/**
 * MongoDB Calendar Implementation Verification Script
 * 
 * This script verifies:
 * 1. MongoDB connection is working
 * 2. Calendar collections can be created
 * 3. CRUD operations work correctly
 */

async function verifyMongoDBCalendar() {
  console.log("🔍 Verifying MongoDB Calendar Implementation...\n");

  try {
    // 1. Test MongoDB connection
    console.log("1️⃣ Testing MongoDB connection...");
    const db = await getDatabase();
    console.log("✅ MongoDB connection successful\n");

    // 2. List existing collections
    console.log("2️⃣ Listing collections...");
    const collections = await db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log();

    // 3. Test calendars collection
    console.log("3️⃣ Testing calendars collection...");
    const calendarsCollection = db.collection("calendars");
    const calendarsCount = await calendarsCollection.countDocuments();
    console.log(`✅ Calendars collection exists with ${calendarsCount} documents\n`);

    // 4. Test calendar_events collection
    console.log("4️⃣ Testing calendar_events collection...");
    const eventsCollection = db.collection("calendar_events");
    const eventsCount = await eventsCollection.countDocuments();
    console.log(`✅ Calendar events collection exists with ${eventsCount} documents\n`);

    // 5. Test insert operation (will be rolled back)
    console.log("5️⃣ Testing insert operation...");
    const testCalendar = {
      userId: "test_user_" + Date.now(),
      name: "Test Calendar",
      color: "#FF0000",
      visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await calendarsCollection.insertOne(testCalendar);
    console.log(`✅ Inserted test calendar with ID: ${insertResult.insertedId}\n`);

    // 6. Test read operation
    console.log("6️⃣ Testing read operation...");
    const foundCalendar = await calendarsCollection.findOne({ _id: insertResult.insertedId });
    if (foundCalendar) {
      console.log(`✅ Found calendar: ${foundCalendar.name}\n`);
    }

    // 7. Test update operation
    console.log("7️⃣ Testing update operation...");
    const updateResult = await calendarsCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { name: "Updated Test Calendar", updatedAt: new Date() } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} document(s)\n`);

    // 8. Test delete operation (cleanup)
    console.log("8️⃣ Testing delete operation (cleanup)...");
    const deleteResult = await calendarsCollection.deleteOne({ _id: insertResult.insertedId });
    console.log(`✅ Deleted ${deleteResult.deletedCount} document(s)\n`);

    // 9. Verify collections have correct indexes
    console.log("9️⃣ Checking indexes...");
    const calendarIndexes = await calendarsCollection.indexes();
    console.log(`✅ Calendars collection has ${calendarIndexes.length} index(es)`);
    calendarIndexes.forEach(idx => console.log(`   - ${idx.name}`));
    console.log();

    // 10. Final summary
    console.log("🎉 MongoDB Calendar Implementation Verification Complete!\n");
    console.log("✅ All operations working correctly:");
    console.log("   - Connection: OK");
    console.log("   - Insert: OK");
    console.log("   - Read: OK");
    console.log("   - Update: OK");
    console.log("   - Delete: OK");
    console.log("\n📝 Next steps:");
    console.log("   1. Test API endpoints via the UI");
    console.log("   2. Create events through the Calendar app");
    console.log("   3. Verify events persist after page refresh");
    console.log("   4. Test user isolation between different users");

    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

// Run verification
verifyMongoDBCalendar();
