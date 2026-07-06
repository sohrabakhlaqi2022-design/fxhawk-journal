import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { eq } from "drizzle-orm";

function toNull(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
}

function toNullNum(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return String(n);
}

function toMoney(val: unknown): string {
  if (val === undefined || val === null || val === "") return "0";
  const n = Number(val);
  if (isNaN(n)) return "0";
  return String(n);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trade] = await db.select().from(trades).where(eq(trades.id, parseInt(id))).limit(1);
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ trade });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.pair !== undefined) updateData.pair = body.pair;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.result !== undefined) updateData.result = body.result;
    if (body.session !== undefined) updateData.session = toNull(body.session);
    if (body.entry !== undefined) updateData.entry = toNullNum(body.entry);
    if (body.stopLoss !== undefined) updateData.stopLoss = toNullNum(body.stopLoss);
    if (body.takeProfit !== undefined) updateData.takeProfit = toNullNum(body.takeProfit);
    if (body.riskPercent !== undefined) updateData.riskPercent = toNullNum(body.riskPercent);
    if (body.reward !== undefined) updateData.reward = toNullNum(body.reward);
    if (body.rr !== undefined) updateData.rr = toNullNum(body.rr);
    if (body.lotSize !== undefined) updateData.lotSize = toNullNum(body.lotSize);
    if (body.profit !== undefined) updateData.profit = toMoney(body.profit);
    if (body.loss !== undefined) updateData.loss = toMoney(body.loss);
    if (body.commission !== undefined) updateData.commission = toMoney(body.commission);
    if (body.notes !== undefined) updateData.notes = toNull(body.notes);
    if (body.psychologyNotes !== undefined) updateData.psychologyNotes = toNull(body.psychologyNotes);
    if (body.mistakes !== undefined) updateData.mistakes = toNull(body.mistakes);
    if (body.lessonsLearned !== undefined) updateData.lessonsLearned = toNull(body.lessonsLearned);
    if (body.emotionBefore !== undefined) updateData.emotionBefore = toNull(body.emotionBefore);
    if (body.emotionAfter !== undefined) updateData.emotionAfter = toNull(body.emotionAfter);
    if (body.strategyName !== undefined) updateData.strategyName = toNull(body.strategyName);
    if (body.market !== undefined) updateData.market = toNull(body.market);
    if (body.timeframe !== undefined) updateData.timeframe = toNull(body.timeframe);
    if (body.broker !== undefined) updateData.broker = toNull(body.broker);
    if (body.screenshotBefore !== undefined) updateData.screenshotBefore = toNull(body.screenshotBefore);
    if (body.screenshotAfter !== undefined) updateData.screenshotAfter = toNull(body.screenshotAfter);
    if (body.voiceNote !== undefined) updateData.voiceNote = toNull(body.voiceNote);
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null;
    if (body.accountId !== undefined) updateData.accountId = body.accountId ? Number(body.accountId) : null;

    const [trade] = await db.update(trades).set(updateData).where(eq(trades.id, parseInt(id))).returning();
    if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ trade });
  } catch (err) {
    console.error("Update trade error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db.delete(trades).where(eq(trades.id, parseInt(id))).returning({ id: trades.id });
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
