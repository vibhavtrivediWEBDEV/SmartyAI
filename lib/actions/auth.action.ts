"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { clearSession, getSessionUserId, setSession } from "@/lib/auth/session";
import {
  createUser,
  findUserCredentialsById,
  findUserByEmail,
  findUserById,
  normalizeEmail,
  updateUserPasswordHash,
} from "@/modules/users/user.repository";
import { getOrCreateProfile } from "@/modules/profile/profile.repository";

const PASSWORD_HASH_ROUNDS = 10;

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(3).max(80),
});

export async function signUp(params: { name: string; email: string; password: string }) {
  const parsed = registrationSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid account details." };
  }

  try {
    const email = normalizeEmail(parsed.data.email);
    const passwordHash = await bcrypt.hash(parsed.data.password, PASSWORD_HASH_ROUNDS);
    const userId = await createUser({ name: parsed.data.name, email, passwordHash });

    if (!userId) {
      return { success: false, message: "This email is already in use." };
    }

    await getOrCreateProfile(userId.toHexString(), parsed.data.name);
    await setSession(userId.toHexString());
    return { success: true, message: "Account created successfully." };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, message: "Failed to create account. Please try again." };
  }
}

export async function signIn(params: { email: string; password: string }) {
  const parsed = credentialsSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, message: "Invalid email or password." };
  }

  try {
    const user = await findUserByEmail(parsed.data.email);
    if (!user || user.status !== "active") {
      return { success: false, message: "Invalid email or password." };
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatches) {
      return { success: false, message: "Invalid email or password." };
    }

    await setSession(user._id.toHexString());
    return { success: true, message: "Signed in successfully." };
  } catch (error) {
    console.error("Error signing in:", error);
    return { success: false, message: "Failed to sign in. Please try again." };
  }
}

export async function verifyCurrentUserPassword(userId: string, password: string) {
  const parsed = credentialsSchema.shape.password.safeParse(password);
  if (!parsed.success) return false;

  const user = await findUserCredentialsById(userId);
  if (!user || user.status !== "active") return false;

  const valid = await bcrypt.compare(parsed.data, user.passwordHash);
  if (valid && bcrypt.getRounds(user.passwordHash) > PASSWORD_HASH_ROUNDS) {
    void bcrypt.hash(parsed.data, PASSWORD_HASH_ROUNDS)
      .then((passwordHash) => updateUserPasswordHash(userId, user.passwordHash, passwordHash))
      .catch((error) => console.error("Failed to upgrade password hash:", error));
  }

  return valid;
}

export async function signOut() {
  await clearSession();
  return { success: true };
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await findUserById(userId);
  if (!user || user.status !== "active") return null;

  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus ?? "active",
  };
}

export async function isAuthenticated() {
  return Boolean(await getCurrentUser());
}
