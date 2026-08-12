import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "smarty_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function setSession(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId()
  if (!userId) return null
  
  // Import dynamically to avoid circular dependency
  const { findUserById } = await import('@/modules/users/user.repository')
  const user = await findUserById(userId)
  
  if (!user || user.status !== 'active') return null
  
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus ?? 'active'
  }
}
