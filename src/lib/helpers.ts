import type { Trade, TradeStats } from "./types";

export function computeStats(trades: Trade[]): TradeStats {
  const wins = trades.filter((t) => t.result === "Win");
  const losses = trades.filter((t) => t.result === "Loss");
  const breakevens = trades.filter((t) => t.result === "Breakeven");
  const total = trades.length;

  const totalProfit = trades.reduce((s, t) => s + parseFloat(t.profit || "0"), 0);
  const totalLoss = trades.reduce((s, t) => s + parseFloat(t.loss || "0"), 0);
  const netProfit = totalProfit - totalLoss;

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + parseFloat(t.profit || "0"), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + parseFloat(t.loss || "0"), 0) / losses.length : 0;

  const rrValues = trades.filter((t) => t.rr && parseFloat(t.rr) > 0).map((t) => parseFloat(t.rr!));
  const avgRR = rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0;

  const winRate = total > 0 ? (wins.length / total) * 100 : 0;
  const lossRate = total > 0 ? (losses.length / total) * 100 : 0;
  const breakevenRate = total > 0 ? (breakevens.length / total) * 100 : 0;

  const expectancy = total > 0 ? (winRate / 100) * avgWin - (lossRate / 100) * avgLoss : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  let winningStreak = 0, losingStreak = 0, curWin = 0, curLose = 0;
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const t of sorted) {
    if (t.result === "Win") { curWin++; curLose = 0; winningStreak = Math.max(winningStreak, curWin); }
    else if (t.result === "Loss") { curLose++; curWin = 0; losingStreak = Math.max(losingStreak, curLose); }
    else { curWin = 0; curLose = 0; }
  }

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => parseFloat(t.profit || "0"))) : 0;
  const largestLoss = losses.length > 0 ? Math.max(...losses.map((t) => parseFloat(t.loss || "0"))) : 0;

  return {
    totalTrades: total, totalProfit, totalLoss, netProfit,
    winRate, lossRate, breakevenRate, avgRR, avgWin, avgLoss,
    expectancy, profitFactor, winningStreak, losingStreak,
    largestWin, largestLoss, wins: wins.length, losses: losses.length, breakevens: breakevens.length,
  };
}

export function formatCurrency(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}$${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getResultColor(result: string): string {
  if (result === "Win") return "text-green-400";
  if (result === "Loss") return "text-red-400";
  return "text-gray-400";
}

export function getResultBg(result: string): string {
  if (result === "Win") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (result === "Loss") return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

export function getPnL(trade: Trade): number {
  const p = parseFloat(trade.profit || "0");
  const l = parseFloat(trade.loss || "0");
  return p - l;
}
