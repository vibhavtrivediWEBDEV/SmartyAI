import { ObjectId } from "mongodb";

import { getDatabase, getMongoClient } from "@/lib/db/mongodb";
import type { Plan, StorageKind, StorageUsage } from "./storage-quota";
import { getStorageLimit } from "./storage-quota";

interface StorageUsageDocument extends StorageUsage {
  userId: ObjectId;
  updatedAt: Date;
}

interface UploadReservationDocument {
  _id: ObjectId;
  userId: ObjectId;
  kind: StorageKind;
  bytes: number;
  filename: string;
  mimeType: string;
  status: "pending" | "completed" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
}

export interface PendingUploadReservation {
  id: string;
  bytes: number;
  filename: string;
  mimeType: string;
  expiresAt: Date;
}

export interface FileNodeDocument {
  ownerId: ObjectId;
  parentId: ObjectId | null;
  name: string;
  kind: "folder" | "file" | "text" | "link";
  mimeType?: string;
  sizeBytes: number;
  storageProvider?: "cloudinary";
  storageKey?: string;
  secureUrl?: string;
  resourceType?: "image" | "video" | "raw";
  content?: string;
  url?: string;
  legacyId?: string;
  migrationSource?: "firebase" | "fixture" | "resume" | "system" | "career";
  isStarred: boolean;
  showOnDesktop?: boolean;
  isTrashed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emptyUsage: StorageUsage = {
  fileBytesUsed: 0,
  fileBytesReserved: 0,
  textBytesUsed: 0,
  textBytesReserved: 0,
};

export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const db = await getDatabase();
  const usage = await db.collection<StorageUsageDocument>("storageUsage").findOne({
    userId: new ObjectId(userId),
  });

  if (!usage) return emptyUsage;
  return {
    fileBytesUsed: usage.fileBytesUsed,
    fileBytesReserved: usage.fileBytesReserved,
    textBytesUsed: usage.textBytesUsed,
    textBytesReserved: usage.textBytesReserved,
  };
}

export async function reserveStorage(
  userId: string,
  plan: Plan,
  kind: StorageKind,
  bytes: number,
): Promise<boolean> {
  const db = await getDatabase();
  const userObjectId = new ObjectId(userId);
  const reservedField = kind === "file" ? "fileBytesReserved" : "textBytesReserved";
  const limit = getStorageLimit(plan);

  const usageCollection = db.collection<StorageUsageDocument>("storageUsage");
  await usageCollection.createIndex({ userId: 1 }, { unique: true, name: "storage_usage_user_unique" });
  await usageCollection.updateOne(
    { userId: userObjectId },
    { $setOnInsert: { userId: userObjectId, ...emptyUsage, updatedAt: new Date() } },
    { upsert: true },
  );

  const result = await usageCollection.findOneAndUpdate(
    {
      userId: userObjectId,
      $expr: {
        $lte: [
          { $add: [
            { $ifNull: ["$fileBytesUsed", 0] },
            { $ifNull: ["$fileBytesReserved", 0] },
            { $ifNull: ["$textBytesUsed", 0] },
            { $ifNull: ["$textBytesReserved", 0] },
            bytes,
          ] },
          limit,
        ],
      },
    },
    {
      $inc: { [reservedField]: bytes },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" },
  );

  return Boolean(result);
}

export async function createUploadReservation(input: {
  userId: string;
  kind: StorageKind;
  bytes: number;
  filename: string;
  mimeType: string;
}): Promise<string> {
  const db = await getDatabase();
  const reservations = db.collection<UploadReservationDocument>("uploadReservations");
  await reservations.createIndex({ userId: 1, status: 1, expiresAt: 1 }, { name: "upload_reservation_lookup" });

  const reservation: UploadReservationDocument = {
    _id: new ObjectId(),
    userId: new ObjectId(input.userId),
    kind: input.kind,
    bytes: input.bytes,
    filename: input.filename,
    mimeType: input.mimeType,
    status: "pending",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date(),
  };

  await reservations.insertOne(reservation);
  return reservation._id.toHexString();
}

export async function releaseReservedStorage(
  userId: string,
  kind: StorageKind,
  bytes: number,
): Promise<void> {
  const db = await getDatabase();
  const reservedField = kind === "file" ? "fileBytesReserved" : "textBytesReserved";

  await db.collection<StorageUsageDocument>("storageUsage").updateOne(
    { userId: new ObjectId(userId), [reservedField]: { $gte: bytes } },
    {
      $inc: { [reservedField]: -bytes },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function commitReservedStorage(
  userId: string,
  kind: StorageKind,
  reservedBytes: number,
  actualBytes: number,
): Promise<void> {
  const db = await getDatabase();
  const usedField = kind === "file" ? "fileBytesUsed" : "textBytesUsed";
  const reservedField = kind === "file" ? "fileBytesReserved" : "textBytesReserved";

  await db.collection<StorageUsageDocument>("storageUsage").updateOne(
    { userId: new ObjectId(userId), [reservedField]: { $gte: reservedBytes } },
    {
      $inc: {
        [reservedField]: -reservedBytes,
        [usedField]: actualBytes,
      },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function releaseUsedStorage(
  userId: string,
  kind: StorageKind,
  bytes: number,
): Promise<void> {
  if (!Number.isSafeInteger(bytes) || bytes <= 0) return;
  const db = await getDatabase();
  const usedField = kind === "file" ? "fileBytesUsed" : "textBytesUsed";
  await db.collection<StorageUsageDocument>("storageUsage").updateOne(
    { userId: new ObjectId(userId), [usedField]: { $gte: bytes } },
    {
      $inc: { [usedField]: -bytes },
      $set: { updatedAt: new Date() },
    },
  );
}

export async function releaseExpiredReservations(userId: string): Promise<void> {
  const db = await getDatabase();
  const userObjectId = new ObjectId(userId);
  const reservations = db.collection<UploadReservationDocument>("uploadReservations");
  const expired = await reservations
    .find({ userId: userObjectId, status: "pending", expiresAt: { $lte: new Date() } })
    .toArray();

  if (expired.length === 0) return;
  const fileBytes = expired
    .filter((reservation) => reservation.kind === "file")
    .reduce((total, reservation) => total + reservation.bytes, 0);
  const textBytes = expired
    .filter((reservation) => reservation.kind === "text")
    .reduce((total, reservation) => total + reservation.bytes, 0);

  await reservations.updateMany(
    { _id: { $in: expired.map((reservation) => reservation._id) }, status: "pending" },
    { $set: { status: "cancelled" } },
  );
  if (fileBytes > 0) await releaseReservedStorage(userId, "file", fileBytes);
  if (textBytes > 0) await releaseReservedStorage(userId, "text", textBytes);
}

export async function getPendingUploadReservation(
  userId: string,
  uploadId: string,
): Promise<PendingUploadReservation | null> {
  if (!ObjectId.isValid(uploadId)) return null;
  const db = await getDatabase();
  const reservation = await db.collection<UploadReservationDocument>("uploadReservations").findOne({
    _id: new ObjectId(uploadId),
    userId: new ObjectId(userId),
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
  if (!reservation) return null;

  return {
    id: reservation._id.toHexString(),
    bytes: reservation.bytes,
    filename: reservation.filename,
    mimeType: reservation.mimeType,
    expiresAt: reservation.expiresAt,
  };
}

export async function completeUploadReservation(input: {
  userId: string;
  uploadId: string;
  storageKey: string;
  secureUrl: string;
  resourceType: "image" | "video" | "raw";
  actualBytes: number;
}): Promise<(FileNodeDocument & { id: string }) | null> {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || "hrms");
  const session = client.startSession();
  const uploadObjectId = new ObjectId(input.uploadId);
  const userObjectId = new ObjectId(input.userId);
  let createdFile: (FileNodeDocument & { id: string }) | null = null;

  try {
    await session.withTransaction(async () => {
      const reservations = db.collection<UploadReservationDocument>("uploadReservations");
      const reservation = await reservations.findOneAndUpdate(
        { _id: uploadObjectId, userId: userObjectId, status: "pending", expiresAt: { $gt: new Date() } },
        { $set: { status: "completed" } },
        { session, returnDocument: "before" },
      );
      if (!reservation || input.actualBytes > reservation.bytes) return;

      const now = new Date();
      const file: FileNodeDocument = {
        ownerId: userObjectId,
        parentId: null,
        name: reservation.filename,
        kind: "file",
        mimeType: reservation.mimeType,
        sizeBytes: input.actualBytes,
        storageProvider: "cloudinary",
        storageKey: input.storageKey,
        secureUrl: input.secureUrl,
        resourceType: input.resourceType,
        isStarred: false,
        isTrashed: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection<FileNodeDocument>("fileNodes").insertOne(file, { session });
      await db.collection<StorageUsageDocument>("storageUsage").updateOne(
        { userId: userObjectId },
        {
          $inc: {
            fileBytesReserved: -reservation.bytes,
            fileBytesUsed: input.actualBytes,
          },
          $set: { updatedAt: now },
        },
        { session },
      );
      createdFile = { ...file, id: result.insertedId.toHexString() };
    });
    return createdFile;
  } finally {
    await session.endSession();
  }
}

export async function cancelUploadReservation(userId: string, uploadId: string): Promise<void> {
  if (!ObjectId.isValid(uploadId)) return;
  const db = await getDatabase();
  const reservation = await db.collection<UploadReservationDocument>("uploadReservations").findOneAndUpdate(
    { _id: new ObjectId(uploadId), userId: new ObjectId(userId), status: "pending" },
    { $set: { status: "cancelled" } },
    { returnDocument: "before" },
  );
  if (reservation) {
    await releaseReservedStorage(userId, reservation.kind, reservation.bytes);
  }
}

export async function listFileNodes(userId: string, parentId: string | null = null) {
  const db = await getDatabase();
  const normalizedParentId = parentId && ObjectId.isValid(parentId) ? new ObjectId(parentId) : null;
  const files = await db.collection<FileNodeDocument>("fileNodes")
    .find({
      ownerId: new ObjectId(userId),
      parentId: normalizedParentId,
      isTrashed: false,
    })
    .sort({ kind: 1, name: 1 })
    .toArray();

  return files.map((file) => ({
    id: file._id.toHexString(),
    parentId: file.parentId?.toHexString() ?? null,
    name: file.name,
    kind: file.kind,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    secureUrl: file.secureUrl,
    resourceType: file.resourceType,
    isStarred: file.isStarred,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  }));
}
