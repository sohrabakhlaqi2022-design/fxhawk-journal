import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, trades, missedTrades, offSessionTrades } from "@/db/schema";

export async function GET() {
  try {
    const [accList, tradesList, missedList, offSessionList] = await Promise.all([
      db.select().from(accounts),
      db.select().from(trades),
      db.select().from(missedTrades),
      db.select().from(offSessionTrades),
    ]);

    // Calculate exact bytes used by serializing all records
    const fullJson = JSON.stringify({
      accounts: accList,
      trades: tradesList,
      missedTrades: missedList,
      offSessionTrades: offSessionList,
    });

    const usedBytes = new TextEncoder().encode(fullJson).length;
    const usedKB = usedBytes / 1024;
    const usedMB = usedKB / 1024;
    
    // Cloud database tier limit = 500 MB
    const totalMB = 500;
    const usedPercent = Math.min(100, Math.max(0.1, (usedMB / totalMB) * 100));
    const remainingMB = Math.max(0, totalMB - usedMB);

    // Calculate item counts
    const totalTradesCount = tradesList.length;
    const totalMissedCount = missedList.length;
    const totalOffSessionCount = offSessionList.length;
    const totalItems = totalTradesCount + totalMissedCount + totalOffSessionCount;

    // Count photos and voice notes
    let totalPhotos = 0;
    let totalVoiceNotes = 0;

    tradesList.forEach((t) => {
      if (t.screenshotBefore) totalPhotos++;
      if (t.screenshotAfter) totalPhotos++;
      if (t.voiceNote) totalVoiceNotes++;
    });

    missedList.forEach((m) => {
      if (m.screenshotAfter) totalPhotos++;
    });

    offSessionList.forEach((o) => {
      if (o.screenshotAfter) totalPhotos++;
    });

    // Estimate average trade size and remaining capacity
    const avgBytesPerTrade = totalItems > 0 ? usedBytes / totalItems : 250 * 1024; // ~250KB default per trade with media
    const estimatedRemainingTrades = Math.floor((remainingMB * 1024 * 1024) / avgBytesPerTrade);

    return NextResponse.json({
      usedBytes,
      usedKB: parseFloat(usedKB.toFixed(2)),
      usedMB: parseFloat(usedMB.toFixed(2)),
      totalMB,
      usedPercent: parseFloat(usedPercent.toFixed(2)),
      remainingMB: parseFloat(remainingMB.toFixed(2)),
      totalItems,
      totalTradesCount,
      totalMissedCount,
      totalOffSessionCount,
      totalPhotos,
      totalVoiceNotes,
      estimatedRemainingTrades,
    });
  } catch (err) {
    console.error("Storage check error:", err);
    return NextResponse.json({
      usedBytes: 0,
      usedKB: 0,
      usedMB: 0.1,
      totalMB: 500,
      usedPercent: 0.02,
      remainingMB: 499.9,
      totalItems: 0,
      totalTradesCount: 0,
      totalMissedCount: 0,
      totalOffSessionCount: 0,
      totalPhotos: 0,
      totalVoiceNotes: 0,
      estimatedRemainingTrades: 2000,
    });
  }
}
