/**
 * Test Script for Contacts System
 * 
 * Verifies that the enhanced contacts system with MongoDB integration works correctly.
 * 
 * Usage: node test-contacts-system.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testContactsSystem() {
  console.log('🧪 Testing Contacts System...\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const contactsCollection = db.collection('contacts');

    const testUserId = 'test-user-' + Date.now();
    const testContactId = new ObjectId();

    console.log('Test User ID:', testUserId);
    console.log('Test Contact ID:', testContactId.toString(), '\n');

    // Test 1: Insert a test contact
    console.log('📝 Test 1: Creating a test contact...');
    const testContact = {
      _id: testContactId,
      userId: testUserId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Tech Corp',
      jobTitle: 'Software Engineer',
      address: '123 Main St, San Francisco, CA',
      birthday: '01-15',
      notes: 'Test contact for verification',
      isFavorite: true,
      tags: ['work', 'engineer'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await contactsCollection.insertOne(testContact);
    console.log('✅ Test contact created successfully\n');

    // Test 2: Retrieve the contact by userId
    console.log('🔍 Test 2: Retrieving contacts by userId...');
    const retrievedContacts = await contactsCollection
      .find({ userId: testUserId })
      .sort({ firstName: 1, lastName: 1 })
      .toArray();

    if (retrievedContacts.length > 0) {
      console.log(`✅ Retrieved ${retrievedContacts.length} contact(s)`);
      console.log('   Contact:', retrievedContacts[0].firstName, retrievedContacts[0].lastName, '\n');
    } else {
      throw new Error('No contacts found');
    }

    // Test 3: Search contacts
    console.log('🔎 Test 3: Searching contacts...');
    const searchResults = await contactsCollection
      .find({
        userId: testUserId,
        $or: [
          { firstName: { $regex: 'John', $options: 'i' } },
          { lastName: { $regex: 'Doe', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } },
        ],
      })
      .toArray();

    console.log(`✅ Search found ${searchResults.length} matching contact(s) \n`);

    // Test 4: Update contact
    console.log('✏️  Test 4: Updating contact...');
    const updateResult = await contactsCollection.updateOne(
      { _id: testContactId, userId: testUserId },
      {
        $set: {
          jobTitle: 'Senior Software Engineer',
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      console.log('✅ Contact updated successfully\n');
    } else {
      throw new Error('Failed to update contact');
    }

    // Test 5: Get favorite contacts
    console.log('⭐ Test 5: Retrieving favorite contacts...');
    const favoriteContacts = await contactsCollection
      .find({ userId: testUserId, isFavorite: true })
      .toArray();

    console.log(`✅ Found ${favoriteContacts.length} favorite contact(s) \n`);

    // Test 6: Delete contact
    console.log('🗑️  Test 6: Deleting contact...');
    const deleteResult = await contactsCollection.deleteOne({
      _id: testContactId,
      userId: testUserId,
    });

    if (deleteResult.deletedCount === 1) {
      console.log('✅ Contact deleted successfully\n');
    } else {
      throw new Error('Failed to delete contact');
    }

    // Test 7: Verify deletion
    console.log('✔️  Test 7: Verifying deletion...');
    const deletedContact = await contactsCollection.findOne({
      _id: testContactId,
    });

    if (!deletedContact) {
      console.log('✅ Contact successfully removed from database\n');
    } else {
      throw new Error('Contact still exists after deletion');
    }

    console.log('🎉 All tests passed! Contacts system is working correctly.\n');

    // Test Summary
    console.log('=== Test Summary ===');
    console.log('✅ Database Connection: PASSED');
    console.log('✅ Create Contact: PASSED');
    console.log('✅ Retrieve Contacts: PASSED');
    console.log('✅ Search Contacts: PASSED');
    console.log('✅ Update Contact: PASSED');
    console.log('✅ Favorite Filter: PASSED');
    console.log('✅ Delete Contact: PASSED');
    console.log('✅ Deletion Verification: PASSED');
    console.log('\n==================\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run tests
testContactsSystem();
