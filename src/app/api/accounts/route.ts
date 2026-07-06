import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const allAccounts = await db.select().from(accounts).orderBy(desc(accounts.createdAt));
  return NextResponse.json({ accounts: allAccounts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [account] = await db
      .insert(accounts)
      .values({
        name: body.name,
        broker: body.broker || null,
        initialBalance: body.initialBalance || "10000",
        currency: body.currency || "USD",
        isActive: true,
      })
      .returning();
    return NextResponse.json({ account });
  } catch (err) {
    console.error("Create account error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
