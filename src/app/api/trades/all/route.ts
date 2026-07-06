import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trades, users } from "@/db/schema";
import { desc } from "drizzle-orm";

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

async function getDefaultUserId(): Promise<number> {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (existing) return existing.id;
  return 1;
}

export async function GET() {
  try {
    const allTrades = await db.select().from(trades).orderBy(desc(trades.date));
    return NextResponse.json({ trades: allTrades });
  } catch (err) {
    console.error("Get trades error:", err);
    return NextResponse.json({ trades: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const oderId = await getDefaultUserId();

    const [trade] = await db
      .insert(trades)
      .values({
        userId: oderId,
        accountId: body.accountId ? Number(body.accountId) : null,
        pair: body.pair,
        date: new Date(body.date),
        session: toNull(body.session),
        position: body.position,
        entry: toNullNum(body.entry),
        stopLoss: toNullNum(body.stopLoss),
        takeProfit: toNullNum(body.takeProfit),
        riskPercent: toNullNum(body.riskPercent),
        reward: toNullNum(body.reward),
        rr: toNullNum(body.rr),
        lotSize: toNullNum(body.lotSize),
        result: body.result,
        profit: toMoney(body.profit),
        loss: toMoney(body.loss),
        commission: toMoney(body.commission),
        notes: toNull(body.notes),
        psychologyNotes: toNull(body.psychologyNotes),
        mistakes: toNull(body.mistakes),
        lessonsLearned: toNull(body.lessonsLearned),
        checklist: body.checklist || null,
        emotionBefore: toNull(body.emotionBefore),
        emotionAfter: toNull(body.emotionAfter),
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null,
        strategyName: toNull(body.strategyName),
        market: toNull(body.market),
        timeframe: toNull(body.timeframe),
        broker: toNull(body.broker),
        screenshotBefore: toNull(body.screenshotBefore),
        screenshotAfter: toNull(body.screenshotAfter),
        voiceNote: toNull(body.voiceNote),
      })
      .returning();

    return NextResponse.json({ trade });
  } catch (err) {
    console.error("Create trade error:", err);
    return NextResponse.json({ error: "Failed to create trade", details: String(err) }, { status: 500 });
  }
}
