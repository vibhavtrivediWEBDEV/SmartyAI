import { ObjectId } from "mongodb";

import { getDatabase } from "@/lib/db/mongodb";
import type { ProfileUpdate } from "./profile.schema";
import type { ResumeProfileData } from "@/modules/users/user.repository";

interface UserProfileDocument {
  userId: ObjectId;
  personal: {
    fullName?: string;
    headline?: string;
    summary?: string;
    phone?: string;
    location?: string;
  };
  professional: {
    currentRole?: string;
    experienceYears?: number;
    preferredRoles: string[];
    skills: string[];
    industries: string[];
  };
  education?: {
    standard?: string;
    board?: string;
    preferredLanguage?: string;
    difficulty?: "Beginner" | "Intermediate" | "Advanced";
    interests?: string[];
  };
  socialLinks: Array<{
    platform: string;
    handle?: string;
    url: string;
    visibility: "public" | "private";
  }>;
  resume?: {
    fileName: string;
    storageKey: string;
    resourceType: string;
    rawText: string;
    extracted: ResumeProfileData;
    uploadedAt: Date;
  };
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const defaults = (userId: ObjectId, name: string): UserProfileDocument => ({
  userId,
  personal: { fullName: name },
  professional: { preferredRoles: [], skills: [], industries: [] },
  socialLinks: [],
  schemaVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function serialize(profile: UserProfileDocument & { _id: ObjectId }) {
  return {
    id: profile._id.toHexString(),
    personal: profile.personal,
    professional: profile.professional,
    education: profile.education ?? {},
    socialLinks: profile.socialLinks,
    resume: profile.resume ? {
      ...profile.resume,
      uploadedAt: profile.resume.uploadedAt.toISOString(),
    } : null,
    schemaVersion: profile.schemaVersion,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function getOrCreateProfile(userId: string, name: string) {
  const db = await getDatabase();
  const profiles = db.collection<UserProfileDocument>("userProfiles");
  await profiles.createIndex({ userId: 1 }, { unique: true, name: "profile_user_unique" });
  const userObjectId = new ObjectId(userId);

  await profiles.updateOne(
    { userId: userObjectId },
    { $setOnInsert: defaults(userObjectId, name) },
    { upsert: true },
  );
  const profile = await profiles.findOne({ userId: userObjectId });
  if (!profile) throw new Error("Profile could not be initialized");
  return serialize(profile);
}

export async function updateProfile(userId: string, name: string, update: ProfileUpdate) {
  const db = await getDatabase();
  const profiles = db.collection<UserProfileDocument>("userProfiles");
  const userObjectId = new ObjectId(userId);
  await profiles.updateOne(
    { userId: userObjectId },
    { $setOnInsert: defaults(userObjectId, name) },
    { upsert: true },
  );
  const set: Record<string, unknown> = { updatedAt: new Date() };

  for (const [key, value] of Object.entries(update.personal ?? {})) {
    set[`personal.${key}`] = value;
  }
  for (const [key, value] of Object.entries(update.professional ?? {})) {
    set[`professional.${key}`] = value;
  }
  for (const [key, value] of Object.entries(update.education ?? {})) {
    set[`education.${key}`] = value;
  }
  if (update.socialLinks) set.socialLinks = update.socialLinks;

  await profiles.updateOne(
    { userId: userObjectId },
    { $set: set },
  );
  return getOrCreateProfile(userId, name);
}

export async function updateProfileFromResume(userId: string, name: string, input: {
  fileName: string;
  storageKey: string;
  resourceType: string;
  rawText: string;
  extracted: ResumeProfileData;
  uploadedAt: Date;
}) {
  const db = await getDatabase();
  const profiles = db.collection<UserProfileDocument>("userProfiles");
  const userObjectId = new ObjectId(userId);
  await profiles.createIndex({ userId: 1 }, { unique: true, name: "profile_user_unique" });
  await profiles.updateOne(
    { userId: userObjectId },
    { $setOnInsert: defaults(userObjectId, name) },
    { upsert: true },
  );
  await profiles.updateOne(
    { userId: userObjectId },
    {
      $set: {
        "personal.fullName": input.extracted.name || name,
        "personal.phone": input.extracted.phone,
        "personal.location": input.extracted.location,
        "personal.headline": input.extracted.headline,
        "personal.summary": input.extracted.about,
        "professional.skills": input.extracted.skills,
        "professional.preferredRoles": input.extracted.goals,
        socialLinks: [...input.extracted.socialLinks, ...input.extracted.externalLinks].map((link) => ({
          platform: link.platform.toLowerCase(),
          url: link.url,
          visibility: "public" as const,
        })),
        resume: input,
        schemaVersion: 3,
        updatedAt: new Date(),
      },
    },
  );
  return getOrCreateProfile(userId, name);
}
