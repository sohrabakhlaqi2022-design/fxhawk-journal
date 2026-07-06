"use client";
import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { Trade, Account } from "@/lib/types";
import { computeStats, formatCurrency } from "@/lib/helpers";

interface AnalyticsProps {
  trades: Trade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (id: number | null) => void;
}

const COLORS = { win: "#00d68f", loss: "#ff3d71", be: "#8a8aa5", accent: "#6c63ff" };

export default function Analytics({ trades, accounts, selectedAccountId, onSelectAccount }: AnalyticsProps) {
  const stats = useMemo(() => computeStats(trades), [trades]);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const pieData = useMemo(() => [
    { name: "Wins", value: stats.wins, color: COLORS.win },
    { name: "Losses", value: stats.losses, color: COLORS.loss },
    { name: "Breakeven", value: stats.breakevens, color: COLORS.be },
  ], [stats]);

  const equityCurve = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const initialBalance = selectedAccount ? parseFloat(selectedAccount.initialBalance) : 10000;
    let balance = initialBalance;
    return sorted.map((t, i) => {
      const pnl = parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
      balance += pnl;
      return { trade: i + 1, balance: Math.round(balance * 100) / 100, pnl };
    });
  }, [trades, selectedAccount]);

  const monthlyPerf = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
    });
    return Object.entries(map).sort().map(([month, pnl]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      pnl: Math.round(pnl * 100) / 100,
    }));
  }, [trades]);

  const sessionStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    trades.forEach((t) => {
      const s = t.session || "Other";
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      if (t.result === "Win") map[s].wins++;
      map[s].pnl += parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
    });
    return Object.entries(map).map(([session, data]) => ({ session, winRate: Math.round((data.wins / data.total) * 100), pnl: Math.round(data.pnl * 100) / 100, trades: data.total }));
  }, [trades]);

  const pairStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    trades.forEach((t) => {
      if (!map[t.pair]) map[t.pair] = { wins: 0, total: 0, pnl: 0 };
      map[t.pair].total++;
      if (t.result === "Win") map[t.pair].wins++;
      map[t.pair].pnl += parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
    });
    return Object.entries(map).map(([pair, data]) => ({ pair, winRate: Math.round((data.wins / data.total) * 100), pnl: Math.round(data.pnl * 100) / 100, trades: data.total })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const strategyStats = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    trades.forEach((t) => {
      const s = t.strategyName || "Unknown";
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      if (t.result === "Win") map[s].wins++;
      map[s].pnl += parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
    });
    return Object.entries(map).map(([strategy, data]) => ({ strategy, winRate: Math.round((data.wins / data.total) * 100), pnl: Math.round(data.pnl * 100) / 100, trades: data.total })).sort((a, b) => b.pnl - a.pnl);
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return <div className="glass-card rounded-lg p-2 text-xs"><p className="text-dark-200">{label}</p><p className="text-white font-bold">{formatCurrency(payload[0].value)}</p></div>;
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-4 animate-fade-in">📊 Analytics</h1>

      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar animate-fade-in">
        <button onClick={() => onSelectAccount(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === null ? "gradient-bg text-white" : "glass text-dark-200"}`}>All Accounts</button>
        {accounts.map((acc) => (
          <button key={acc.id} onClick={() => onSelectAccount(acc.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === acc.id ? "gradient-bg text-white" : "glass text-dark-200"}`}>{acc.name}</button>
        ))}
      </div>

      {trades.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center mt-10"><p className="text-4xl mb-4">📊</p><h2 className="text-white font-bold text-lg">No Analytics Yet</h2><p className="text-dark-300 text-sm mt-2">Add trades to see performance analytics</p></div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4 animate-slide-up">
            {[{ label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, color: "text-green-400" },{ label: "Avg RR", value: stats.avgRR.toFixed(2), color: "text-accent-400" },{ label: "Expectancy", value: formatCurrency(stats.expectancy), color: stats.expectancy >= 0 ? "text-green-400" : "text-red-400" }].map((m) => (
              <div key={m.label} className="glass-card rounded-xl p-3 text-center"><p className="text-dark-300 text-[10px] uppercase tracking-wider">{m.label}</p><p className={`text-lg font-bold ${m.color}`}>{m.value}</p></div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {[{ label: "Profit Factor", value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2), color: "text-gold-400" },{ label: "Net Profit", value: formatCurrency(stats.netProfit), color: stats.netProfit >= 0 ? "text-green-400" : "text-red-400" },{ label: "Total Trades", value: stats.totalTrades.toString(), color: "text-accent-400" }].map((m) => (
              <div key={m.label} className="glass-card rounded-xl p-3 text-center"><p className="text-dark-300 text-[10px] uppercase tracking-wider">{m.label}</p><p className={`text-lg font-bold ${m.color}`}>{m.value}</p></div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            {[{ label: "Total Profit", value: formatCurrency(stats.totalProfit), color: "text-green-400" },{ label: "Total Loss", value: `-$${stats.totalLoss.toFixed(2)}`, color: "text-red-400" },{ label: "Avg Win", value: formatCurrency(stats.avgWin), color: "text-green-400" },{ label: "Avg Loss", value: `-$${stats.avgLoss.toFixed(2)}`, color: "text-red-400" },{ label: "Win Streak", value: stats.winningStreak.toString(), color: "text-green-400" },{ label: "Lose Streak", value: stats.losingStreak.toString(), color: "text-red-400" },{ label: "Largest Win", value: formatCurrency(stats.largestWin), color: "text-green-400" },{ label: "Largest Loss", value: `-$${stats.largestLoss.toFixed(2)}`, color: "text-red-400" }].map((m) => (
              <div key={m.label} className="glass-card rounded-xl p-3"><p className="text-dark-300 text-[10px] uppercase tracking-wider">{m.label}</p><p className={`text-sm font-bold ${m.color}`}>{m.value}</p></div>
            ))}
          </div>

          {/* Win/Loss Pie */}
          <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-white font-semibold text-sm mb-3">Win / Loss Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32"><ResponsiveContainer><PieChart><Pie data={pieData} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
              <div className="flex-1 space-y-2">{pieData.map((d) => (<div key={d.name} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className="text-dark-200 text-xs">{d.name}</span></div><span className="text-white text-xs font-bold">{d.value}</span></div>))}</div>
            </div>
          </div>

          {/* Equity Curve */}
          {equityCurve.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Equity Curve</h3>
              <div className="h-48"><ResponsiveContainer><AreaChart data={equityCurve}><defs><linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} /></linearGradient></defs><XAxis dataKey="trade" tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="balance" stroke={COLORS.accent} fill="url(#equityGrad)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
            </div>
          )}

          {/* Monthly Performance */}
          {monthlyPerf.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Monthly Performance</h3>
              <div className="h-48"><ResponsiveContainer><BarChart data={monthlyPerf}><XAxis dataKey="month" tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="pnl" radius={[6, 6, 0, 0]}>{monthlyPerf.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? COLORS.win : COLORS.loss} />)}</Bar></BarChart></ResponsiveContainer></div>
            </div>
          )}

          {/* PnL per trade */}
          <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h3 className="text-white font-semibold text-sm mb-3">PnL Per Trade</h3>
            <div className="h-48"><ResponsiveContainer><BarChart data={equityCurve}><XAxis dataKey="trade" tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#5a5a75", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="pnl" radius={[4, 4, 0, 0]}>{equityCurve.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? COLORS.win : COLORS.loss} />)}</Bar></BarChart></ResponsiveContainer></div>
          </div>

          {/* Session Stats */}
          {sessionStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.6s" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Session Statistics</h3>
              <div className="space-y-2">{sessionStats.map((s) => (<div key={s.session} className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3"><div><p className="text-white text-sm font-medium">{s.session}</p><p className="text-dark-300 text-[10px]">{s.trades} trades</p></div><div className="text-right"><p className={`text-sm font-bold ${s.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(s.pnl)}</p><p className="text-dark-300 text-[10px]">{s.winRate}% WR</p></div></div>))}</div>
            </div>
          )}

          {/* Pair Stats */}
          {pairStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.7s" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Pair Statistics</h3>
              <div className="space-y-2">{pairStats.map((p) => (<div key={p.pair} className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3"><div><p className="text-white text-sm font-medium">{p.pair}</p><p className="text-dark-300 text-[10px]">{p.trades} trades · {p.winRate}% WR</p></div><p className={`text-sm font-bold ${p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(p.pnl)}</p></div>))}</div>
            </div>
          )}

          {/* Strategy Stats */}
          {strategyStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.8s" }}>
              <h3 className="text-white font-semibold text-sm mb-3">Strategy Statistics</h3>
              <div className="space-y-2">{strategyStats.map((s) => (<div key={s.strategy} className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3"><div><p className="text-white text-sm font-medium">{s.strategy}</p><p className="text-dark-300 text-[10px]">{s.trades} trades · {s.winRate}% WR</p></div><p className={`text-sm font-bold ${s.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(s.pnl)}</p></div>))}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
