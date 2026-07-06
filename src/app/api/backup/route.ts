import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, trades, missedTrades, offSessionTrades, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

async function getDefaultUserId(): Promise<number> {
  const [existing] = await db.select({ id: users.id }).from(users).limit(1);
  if (existing) return existing.id;
  return 1;
}

// GET /api/backup - Export all data (accounts, trades, missedTrades, offSessionTrades)
export async function GET() {
  try {
    const [accList, tradesList, missedList, offSessionList] = await Promise.all([
      db.select().from(accounts).orderBy(desc(accounts.createdAt)),
      db.select().from(trades).orderBy(desc(trades.date)),
      db.select().from(missedTrades).orderBy(desc(missedTrades.date)),
      db.select().from(offSessionTrades).orderBy(desc(offSessionTrades.date)),
    ]);

    const backupData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      accounts: accList,
      trades: tradesList,
      missedTrades: missedList,
      offSessionTrades: offSessionList,
    };

    return NextResponse.json(backupData);
  } catch (err) {
    console.error("Backup export error:", err);
    return NextResponse.json({ error: "Failed to export backup", details: String(err) }, { status: 500 });
  }
}

// POST /api/backup - Restore all data from uploaded JSON backup
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid backup data" }, { status: 400 });
    }

    const userId = await getDefaultUserId();

    // Map old account IDs to new account IDs during restore
    const accountIdMap: Record<number, number> = {};

    // 1. Restore Accounts
    if (Array.isArray(data.accounts)) {
      for (const acc of data.accounts) {
        try {
          const [newAcc] = await db.insert(accounts).values({
            name: acc.name || "Restored Account",
            broker: acc.broker || null,
            initialBalance: acc.initialBalance || "10000",
            currency: acc.currency || "USD",
            isActive: acc.isActive !== undefined ? acc.isActive : true,
          }).returning();
          if (acc.id && newAcc) {
            accountIdMap[acc.id] = newAcc.id;
          }
        } catch (e) {
          console.error("Error restoring account:", e);
        }
      }
    }

    // 2. Restore Regular Trades
    if (Array.isArray(data.trades)) {
      for (const t of data.trades) {
        try {
          const mappedAccountId = t.accountId ? (accountIdMap[t.accountId] || null) : null;
          await db.insert(trades).values({
            userId,
            accountId: mappedAccountId,
            pair: t.pair,
            date: t.date ? new Date(t.date) : new Date(),
            session: t.session || null,
            position: t.position || "Buy",
            entry: t.entry || null,
            stopLoss: t.stopLoss || null,
            takeProfit: t.takeProfit || null,
            riskPercent: t.riskPercent || null,
            reward: t.reward || null,
            rr: t.rr || null,
            lotSize: t.lotSize || null,
            result: t.result || "Win",
            profit: t.profit || "0",
            loss: t.loss || "0",
            commission: t.commission || "0",
            notes: t.notes || null,
            psychologyNotes: t.psychologyNotes || null,
            mistakes: t.mistakes || null,
            lessonsLearned: t.lessonsLearned || null,
            checklist: t.checklist || null,
            emotionBefore: t.emotionBefore || null,
            emotionAfter: t.emotionAfter || null,
            tags: t.tags || null,
            strategyName: t.strategyName || null,
            market: t.market || null,
            timeframe: t.timeframe || null,
            broker: t.broker || null,
            screenshotBefore: t.screenshotBefore || null,
            screenshotAfter: t.screenshotAfter || null,
            voiceNote: t.voiceNote || null,
          });
        } catch (e) {
          console.error("Error restoring trade:", e);
        }
      }
    }

    // 3. Restore Missed Trades
    if (Array.isArray(data.missedTrades)) {
      for (const mt of data.missedTrades) {
        try {
          const mappedAccountId = mt.accountId ? (accountIdMap[mt.accountId] || null) : null;
          await db.insert(missedTrades).values({
            accountId: mappedAccountId,
            pair: mt.pair,
            date: mt.date ? new Date(mt.date) : new Date(),
            session: mt.session || null,
            position: mt.position || "Buy",
            entry: mt.entry || null,
            stopLoss: mt.stopLoss || null,
            takeProfit: mt.takeProfit || null,
            rr: mt.rr || null,
            potentialProfit: mt.potentialProfit || "0",
            strategyName: mt.strategyName || null,
            market: mt.market || null,
            timeframe: mt.timeframe || null,
            reason: mt.reason || null,
            category: mt.category || null,
            screenshotAfter: mt.screenshotAfter || null,
            notes: mt.notes || null,
          });
        } catch (e) {
          console.error("Error restoring missed trade:", e);
        }
      }
    }

    // 4. Restore Off-Session Trades
    if (Array.isArray(data.offSessionTrades)) {
      for (const ost of data.offSessionTrades) {
        try {
          const mappedAccountId = ost.accountId ? (accountIdMap[ost.accountId] || null) : null;
          const d = ost.date ? new Date(ost.date) : new Date();
          await db.insert(offSessionTrades).values({
            accountId: mappedAccountId,
            pair: ost.pair,
            date: d,
            tradeHour: ost.tradeHour !== undefined ? ost.tradeHour : d.getHours(),
            tradeMinute: ost.tradeMinute !== undefined ? ost.tradeMinute : d.getMinutes(),
            position: ost.position || "Buy",
            entry: ost.entry || null,
            stopLoss: ost.stopLoss || null,
            takeProfit: ost.takeProfit || null,
            rr: ost.rr || null,
            lotSize: ost.lotSize || null,
            result: ost.result || "Win",
            profit: ost.profit || "0",
            loss: ost.loss || "0",
            commission: ost.commission || "0",
            strategyName: ost.strategyName || null,
            market: ost.market || null,
            timeframe: ost.timeframe || null,
            screenshotAfter: ost.screenshotAfter || null,
            notes: ost.notes || null,
          });
        } catch (e) {
          console.error("Error restoring off-session trade:", e);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Backup restored successfully" });
  } catch (err) {
    console.error("Backup restore error:", err);
    return NextResponse.json({ error: "Failed to restore backup", details: String(err) }, { status: 500 });
  }
}
