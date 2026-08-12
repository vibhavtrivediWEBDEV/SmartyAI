import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";

/**
 * Call History Document (MongoDB)
 * Video and audio call logs
 */
export interface CallHistoryDocument {
  _id?: ObjectId;
  userId: string;
  
  // Contact Info
  contactId?: string; // Reference to contact
  contactName: string;
  contactAvatar?: string;
  
  // Call Details
  callType: "video" | "audio";
  direction: "outgoing" | "incoming" | "missed";
  status: "completed" | "missed" | "rejected" | "failed";
  
  // Timing
  startTime: Date;
  endTime?: Date;
  duration?: number; // In seconds
  
  // Quality
  quality?: "excellent" | "good" | "poor";
  
  // Notes
  notes?: string;
  
  createdAt: Date;
}

/**
 * FaceTime Settings Document
 */
export interface FaceTimeSettingsDocument {
  _id?: ObjectId;
  userId: string;
  
  // Video Settings
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  preferredCamera?: string;
  preferredMicrophone?: string;
  
  // Call Settings
  ringtone: string;
  callWaiting: boolean;
  callForwarding?: string; // Phone number
  
  // Privacy
  showCallerId: boolean;
  blockUnknownCallers: boolean;
  blockedContacts?: string[];
  
  // Recording
  allowRecording: boolean;
  recordingPath?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get call history collection
 */
async function callHistoryCollection() {
  const db = await getDatabase();
  return db.collection<CallHistoryDocument>("call_history");
}

/**
 * Get FaceTime settings collection
 */
async function settingsCollection() {
  const db = await getDatabase();
  return db.collection<FaceTimeSettingsDocument>("facetime_settings");
}

/**
 * Get call history for user
 */
export async function getCallHistory(
  userId: string,
  limit: number = 50
): Promise<WithId<CallHistoryDocument>[]> {
  const calls = await callHistoryCollection();
  
  return calls
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Get calls with a specific contact
 */
export async function getCallsWithContact(
  userId: string,
  contactId: string
): Promise<WithId<CallHistoryDocument>[]> {
  const calls = await callHistoryCollection();
  
  return calls
    .find({ userId, contactId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
}

/**
 * Log a new call
 */
export async function logCall(
  userId: string,
  params: {
    contactId?: string;
    contactName: string;
    contactAvatar?: string;
    callType: "video" | "audio";
    direction: "outgoing" | "incoming" | "missed";
    status: CallHistoryDocument["status"];
    duration?: number;
    quality?: CallHistoryDocument["quality"];
    notes?: string;
  }
): Promise<string> {
  const calls = await callHistoryCollection();
  
  const call: Omit<CallHistoryDocument, "_id"> = {
    userId,
    ...params,
    startTime: new Date(),
    duration: params.duration,
    createdAt: new Date(),
  };
  
  const result = await calls.insertOne(call);
  return result.insertedId.toHexString();
}

/**
 * Update call (add end time and duration)
 */
export async function updateCall(
  userId: string,
  callId: string,
  updates: {
    endTime?: Date;
    duration?: number;
    status?: CallHistoryDocument["status"];
    quality?: CallHistoryDocument["quality"];
    notes?: string;
  }
): Promise<boolean> {
  if (!ObjectId.isValid(callId)) return false;
  
  const calls = await callHistoryCollection();
  
  const result = await calls.updateOne(
    { _id: new ObjectId(callId), userId },
    { $set: updates }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Delete call from history
 */
export async function deleteCall(userId: string, callId: string): Promise<boolean> {
  if (!ObjectId.isValid(callId)) return false;
  
  const calls = await callHistoryCollection();
  
  const result = await calls.deleteOne({
    _id: new ObjectId(callId),
    userId,
  });
  
  return result.deletedCount > 0;
}

/**
 * Clear all call history
 */
export async function clearCallHistory(userId: string): Promise<number> {
  const calls = await callHistoryCollection();
  
  const result = await calls.deleteMany({ userId });
  return result.deletedCount;
}

/**
 * Get call statistics
 */
export async function getCallStats(userId: string): Promise<{
  totalCalls: number;
  videoCalls: number;
  audioCalls: number;
  missedCalls: number;
  totalDuration: number;
}> {
  const calls = await callHistoryCollection();
  
  const pipeline = [
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        videoCalls: { $sum: { $cond: [{ $eq: ["$callType", "video"] }, 1, 0] } },
        audioCalls: { $sum: { $cond: [{ $eq: ["$callType", "audio"] }, 1, 0] } },
        missedCalls: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
        totalDuration: { $sum: "$duration" },
      },
    },
  ];
  
  const result = await calls.aggregate(pipeline).toArray();
  
  if (result.length === 0) {
    return {
      totalCalls: 0,
      videoCalls: 0,
      audioCalls: 0,
      missedCalls: 0,
      totalDuration: 0,
    };
  }
  
  return result[0] as any;
}

/**
 * Get or create user settings
 */
export async function getUserSettings(userId: string): Promise<FaceTimeSettingsDocument> {
  const settings = await settingsCollection();
  
  let userSettings = await settings.findOne({ userId });
  
  if (!userSettings) {
    // Create default settings
    const defaultSettings: Omit<FaceTimeSettingsDocument, "_id"> = {
      userId,
      cameraEnabled: true,
      microphoneEnabled: true,
      ringtone: "default",
      callWaiting: true,
      showCallerId: true,
      blockUnknownCallers: false,
      allowRecording: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await settings.insertOne(defaultSettings);
    userSettings = await settings.findOne({ userId });
  }
  
  return userSettings!;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<FaceTimeSettingsDocument>
): Promise<boolean> {
  const settings = await settingsCollection();
  
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  
  // Remove fields that shouldn't be updated
  delete updateData._id;
  delete updateData.userId;
  delete updateData.createdAt;
  
  const result = await settings.updateOne(
    { userId },
    { $set: updateData }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Block a contact
 */
export async function blockContact(userId: string, contactId: string): Promise<boolean> {
  const settings = await settingsCollection();
  
  const result = await settings.updateOne(
    { userId },
    { $addToSet: { blockedContacts: contactId } }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Unblock a contact
 */
export async function unblockContact(userId: string, contactId: string): Promise<boolean> {
  const settings = await settingsCollection();
  
  const result = await settings.updateOne(
    { userId },
    { $pull: { blockedContacts: contactId } }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Get blocked contacts
 */
export async function getBlockedContacts(userId: string): Promise<string[]> {
  const userSettings = await getUserSettings(userId);
  return userSettings.blockedContacts || [];
}
