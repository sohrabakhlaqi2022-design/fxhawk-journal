import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, "demo@fxhawk.com")).limit(1);
    if (existing) return NextResponse.json({ message: "User exists", oderId: existing.id });

    const hash = await bcrypt.hash("demo1234", 10);
    const [user] = await db
      .insert(users)
      .values({ email: "demo@fxhawk.com", name: "Trader", passwordHash: hash, initialBalance: "10000" })
      .returning();

    return NextResponse.json({ message: "User created", oderId: user.id });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
