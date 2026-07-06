import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { offSessionTrades } from "@/db/schema";
import { desc } from "drizzle-orm";

function toNull(v: unknown): string | null { return v === undefined || v === null || v === "" ? null : String(v); }
function toNullNum(v: unknown): string | null { if (v === undefined || v === null || v === "") return null; const n = Number(v); return isNaN(n) ? null : String(n); }
function toMoney(v: unknown): string { if (v === undefined || v === null || v === "") return "0"; const n = Number(v); return isNaN(n) ? "0" : String(n); }

export async function GET() {
  try {
    const all = await db.select().from(offSessionTrades).orderBy(desc(offSessionTrades.date));
    return NextResponse.json({ offSessionTrades: all });
  } catch (err) { console.error(err); return NextResponse.json({ offSessionTrades: [] }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const d = new Date(body.date);
    const [ost] = await db.insert(offSessionTrades).values({
      accountId: body.accountId ? Number(body.accountId) : null,
      pair: body.pair,
      date: d,
      tradeHour: body.tradeHour ?? d.getHours(),
      tradeMinute: body.tradeMinute ?? d.getMinutes(),
      position: body.position,
      entry: toNullNum(body.entry),
      stopLoss: toNullNum(body.stopLoss),
      takeProfit: toNullNum(body.takeProfit),
      rr: toNullNum(body.rr),
      lotSize: toNullNum(body.lotSize),
      result: body.result,
      profit: toMoney(body.profit),
      loss: toMoney(body.loss),
      commission: toMoney(body.commission),
      strategyName: toNull(body.strategyName),
      market: toNull(body.market),
      timeframe: toNull(body.timeframe),
      screenshotAfter: toNull(body.screenshotAfter),
      notes: toNull(body.notes),
    }).returning();
    return NextResponse.json({ offSessionTrade: ost });
  } catch (err) {
    console.error("Create off-session error:", err);
    return NextResponse.json({ error: "Failed", details: String(err) }, { status: 500 });
  }
}
