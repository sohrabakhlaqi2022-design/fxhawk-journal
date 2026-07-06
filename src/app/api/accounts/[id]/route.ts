import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [account] = await db
    .update(accounts)
    .set({ name: body.name, broker: body.broker, initialBalance: body.initialBalance, currency: body.currency, updatedAt: new Date() })
    .where(eq(accounts.id, parseInt(id)))
    .returning();
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(accounts).where(eq(accounts.id, parseInt(id))).returning({ id: accounts.id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
