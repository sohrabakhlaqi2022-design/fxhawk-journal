import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offSessionTrades } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(offSessionTrades).where(eq(offSessionTrades.id, parseInt(id))).returning({ id: offSessionTrades.id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
