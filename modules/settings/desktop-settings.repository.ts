import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

import { getDatabase } from "@/lib/db/mongodb";
import type { DesktopSettingsUpdate } from "./desktop-settings.schema";

interface DesktopSettingsDocument extends DesktopSettingsUpdate {
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  appLockPasswordHash?: string;
}

export type DesktopSettingsResponse = DesktopSettingsUpdate & { hasAppLockPassword?: boolean };

export async function getDesktopSettings(userId: string): Promise<DesktopSettingsResponse> {
  const db = await getDatabase();
  const settings = db.collection<DesktopSettingsDocument>("desktopSettings");
  const document = await settings.findOne({ userId: new ObjectId(userId) });
  if (!document) return {};

  const { _id, userId: _userId, createdAt, updatedAt, appLockPasswordHash, ...values } = document;
  return { ...values, hasAppLockPassword: Boolean(appLockPasswordHash) };
}

export async function updateDesktopSettings(userId: string, update: DesktopSettingsUpdate) {
  const db = await getDatabase();
  const settings = db.collection<DesktopSettingsDocument>("desktopSettings");
  const now = new Date();
  await settings.createIndex({ userId: 1 }, { unique: true, name: "desktop_settings_user_unique" });
  await settings.updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: { ...update, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return getDesktopSettings(userId);
}

export async function resetDesktopSettings(userId: string) {
  const db = await getDatabase();
  await db.collection<DesktopSettingsDocument>("desktopSettings").deleteOne({ userId: new ObjectId(userId) });
}

export async function setDesktopAppLockPassword(userId: string, password: string) {
  const db = await getDatabase();
  const settings = db.collection<DesktopSettingsDocument>("desktopSettings");
  const now = new Date();
  const appLockPasswordHash = await bcrypt.hash(password, 12);
  await settings.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { appLockPasswordHash, appLockEnabled: true, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
}

export async function verifyDesktopAppLockPassword(userId: string, password: string) {
  const db = await getDatabase();
  const document = await db.collection<DesktopSettingsDocument>("desktopSettings").findOne(
    { userId: new ObjectId(userId) },
    { projection: { appLockPasswordHash: 1 } },
  );
  return Boolean(document?.appLockPasswordHash) && bcrypt.compare(password, document!.appLockPasswordHash!);
}