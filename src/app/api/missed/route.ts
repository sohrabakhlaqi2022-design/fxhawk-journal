import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { missedTrades } from "@/db/schema";
import { desc } from "drizzle-orm";

function toNull(v: unknown): string | null { return v === undefined || v === null || v === "" ? null : String(v); }
function toNullNum(v: unknown): string | null { if (v === undefined || v === null || v === "") return null; const n = Number(v); return isNaN(n) ? null : String(n); }

export async function GET() {
  try {
    const all = await db.select().from(missedTrades).orderBy(desc(missedTrades.date));
    return NextResponse.json({ missedTrades: all });
  } catch (err) {
    console.error("Get missed trades error:", err);
    return NextResponse.json({ missedTrades: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [mt] = await db.insert(missedTrades).values({
      accountId: body.accountId ? Number(body.accountId) : null,
      pair: body.pair,
      date: new Date(body.date),
      session: toNull(body.session),
      position: body.position,
      entry: toNullNum(body.entry),
      stopLoss: toNullNum(body.stopLoss),
      takeProfit: toNullNum(body.takeProfit),
      rr: toNullNum(body.rr),
      potentialProfit: toNullNum(body.potentialProfit) || "0",
      strategyName: toNull(body.strategyName),
      market: toNull(body.market),
      timeframe: toNull(body.timeframe),
      reason: toNull(body.reason),
      category: toNull(body.category),
      screenshotAfter: toNull(body.screenshotAfter),
      notes: toNull(body.notes),
    }).returning();
    return NextResponse.json({ missedTrade: mt });
  } catch (err) {
    console.error("Create missed trade error:", err);
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
