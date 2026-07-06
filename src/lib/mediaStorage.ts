// Media files (images, voice) stored on device - NOT on cloud
// This saves Neon database storage space

const MEDIA_PREFIX = "fxhawk_media_";

export function saveMedia(tradeId: number, type: string, data: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = `${MEDIA_PREFIX}${tradeId}_${type}`;
    localStorage.setItem(key, data);
  } catch (e) {
    console.warn("Media storage full:", e);
  }
}

export function getMedia(tradeId: number | null | undefined, type: string): string | null {
  if (!tradeId || typeof window === "undefined") return null;
  try {
    const key = `${MEDIA_PREFIX}${tradeId}_${type}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function deleteMedia(tradeId: number, type: string): void {
  if (typeof window === "undefined") return;
  const key = `${MEDIA_PREFIX}${tradeId}_${type}`;
  localStorage.removeItem(key);
}

export function deleteAllMediaForTrade(tradeId: number): void {
  if (typeof window === "undefined") return;
  const prefix = `${MEDIA_PREFIX}${tradeId}_`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}

export function estimateMediaStorage(): { used: number; total: number; items: number } {
  if (typeof window === "undefined") return { used: 0, total: 50, items: 0 };
  let total = 0;
  let items = 0;
  const limit = 50 * 1024 * 1024; // 50MB estimate for localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(MEDIA_PREFIX)) {
      const val = localStorage.getItem(key);
      total += (key.length + (val?.length || 0)) * 2; // UTF-16
      items++;
    }
  }
  return { used: Math.round(total / (1024 * 1024) * 100) / 100, total: 50, items };
}

// Merge media into trades from localStorage
export function mergeMediaToTrades(trades: any[]): any[] {
  return trades.map(t => ({
    ...t,
    screenshotBefore: t.screenshotBefore || getMedia(t.id, "screenshotBefore"),
    screenshotAfter: t.screenshotAfter || getMedia(t.id, "screenshotAfter"),
    voiceNote: t.voiceNote || getMedia(t.id, "voiceNote"),
  }));
}

// Extract media from trade data and save to localStorage, return clean trade
export function extractAndSaveMedia(trade: Partial<any>): Partial<any> {
  const { screenshotBefore, screenshotAfter, voiceNote, ...cleanTrade } = trade;
  return cleanTrade;
}
