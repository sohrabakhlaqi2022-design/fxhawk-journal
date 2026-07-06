import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function authenticateUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export async function createUser(email: string, name: string, password: string) {
  const hash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hash })
    .returning({ id: users.id, email: users.email, name: users.name });
  return user;
}

export function encodeToken(userId: number): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  return Buffer.from(payload).toString("base64url");
}

export function decodeToken(token: string): { userId: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): { userId: number } | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return decodeToken(authHeader.slice(7));
}
