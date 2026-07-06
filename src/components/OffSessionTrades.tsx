"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, Plus, Trash2, Check, X, Clock, Layers, TrendingUp, TrendingDown, Minus } from "./icons";
import type { OffSessionTrade, Account } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/helpers";

interface OffSessionTradesProps {
  offSessionTrades: OffSessionTrade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (id: number | null) => void;
  onSave: (data: Partial<OffSessionTrade>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBack: () => void;
}

const PAIRS = ["EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","NZD/USD","USD/CAD","EUR/GBP","EUR/JPY","GBP/JPY","AUD/JPY","XAU/USD","XAG/USD","NAS100","US30","SPX500","BTC/USD","ETH/USD"];
const RESULTS = ["Win","Loss","Breakeven"];
const STRATEGIES = ["Breakout","Supply & Demand","Order Block","Fibonacci Retracement","Trend Continuation","Support Bounce","Price Action","Smart Money","Scalping","Swing Trading"];
const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4","D1","W1"];

function formatHour(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function OffSessionTrades({ offSessionTrades, accounts, selectedAccountId, onSelectAccount, onSave, onDelete, onBack }: OffSessionTradesProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accountId: "", pair: "", date: new Date().toISOString().slice(0, 16), position: "Buy",
    entry: "", stopLoss: "", takeProfit: "", rr: "", lotSize: "", result: "Win",
    profit: "", loss: "", commission: "", strategyName: "", market: "", timeframe: "",
    screenshotAfter: "", notes: "",
  });

  const updateField = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const resetForm = () => { setForm({ accountId: "", pair: "", date: new Date().toISOString().slice(0, 16), position: "Buy", entry: "", stopLoss: "", takeProfit: "", rr: "", lotSize: "", result: "Win", profit: "", loss: "", commission: "", strategyName: "", market: "", timeframe: "", screenshotAfter: "", notes: "" }); setShowForm(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); let { width: w, height: h } = img; const mx = 1200; if (w > mx) { h = (h * mx) / w; w = mx; } else if (h > mx) { w = (w * mx) / h; h = mx; } c.width = w; c.height = h; c.getContext("2d")?.drawImage(img, 0, 0, w, h); updateField("screenshotAfter", c.toDataURL("image/jpeg", 0.8)); }; img.src = ev.target?.result as string; };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.pair || !form.result) { alert("Pair and Result required"); return; }
    setSaving(true);
    const d = new Date(form.date);
    try {
      await onSave({ ...form, accountId: form.accountId ? parseInt(form.accountId) : null, tradeHour: d.getHours(), tradeMinute: d.getMinutes() } as unknown as Partial<OffSessionTrade>);
      resetForm();
    } catch { alert("Failed"); } finally { setSaving(false); }
  };

  const filtered = selectedAccountId ? offSessionTrades.filter(t => t.accountId === selectedAccountId) : offSessionTrades;

  // ===== ANALYTICS =====
  const stats = useMemo(() => {
    const total = filtered.length;
    const wins = filtered.filter(t => t.result === "Win").length;
    const losses = filtered.filter(t => t.result === "Loss").length;
    const totalProfit = filtered.reduce((s, t) => s + parseFloat(t.profit || "0"), 0);
    const totalLoss = filtered.reduce((s, t) => s + parseFloat(t.loss || "0"), 0);
    const netPnL = totalProfit - totalLoss;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    // Hourly breakdown — the core feature!
    const hourly: Record<number, { wins: number; losses: number; total: number; profit: number; loss: number }> = {};
    for (let h = 0; h < 24; h++) hourly[h] = { wins: 0, losses: 0, total: 0, profit: 0, loss: 0 };
    filtered.forEach(t => {
      const h = t.tradeHour;
      hourly[h].total++;
      if (t.result === "Win") { hourly[h].wins++; hourly[h].profit += parseFloat(t.profit || "0"); }
      else if (t.result === "Loss") { hourly[h].losses++; hourly[h].loss += parseFloat(t.loss || "0"); }
    });

    // Best hours (sorted by win rate then profit)
    const hourlyStats = Object.entries(hourly)
      .filter(([, d]) => d.total > 0)
      .map(([hour, d]) => ({
        hour: parseInt(hour),
        ...d,
        winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
        netPnL: d.profit - d.loss,
      }))
      .sort((a, b) => b.netPnL - a.netPnL);

    // Monthly breakdown
    const monthly: Record<string, { total: number; wins: number; profit: number; loss: number; bestHour: number; bestHourPnL: number }> = {};
    filtered.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[key]) monthly[key] = { total: 0, wins: 0, profit: 0, loss: 0, bestHour: -1, bestHourPnL: -Infinity };
      monthly[key].total++;
      if (t.result === "Win") { monthly[key].wins++; monthly[key].profit += parseFloat(t.profit || "0"); }
      else monthly[key].loss += parseFloat(t.loss || "0");
    });
    // Find best hour per month
    Object.keys(monthly).forEach(month => {
      const monthTrades = filtered.filter(t => { const d = new Date(t.date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === month; });
      const hourMap: Record<number, number> = {};
      monthTrades.forEach(t => { hourMap[t.tradeHour] = (hourMap[t.tradeHour] || 0) + parseFloat(t.profit || "0") - parseFloat(t.loss || "0"); });
      let bestH = -1, bestP = -Infinity;
      Object.entries(hourMap).forEach(([h, p]) => { if (p > bestP) { bestP = p; bestH = parseInt(h); } });
      monthly[month].bestHour = bestH;
      monthly[month].bestHourPnL = bestP === -Infinity ? 0 : bestP;
    });
    const monthlyData = Object.entries(monthly).sort().map(([month, d]) => ({
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      ...d,
      winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
      netPnL: d.profit - d.loss,
    }));

    // Pair stats
    const pairMap: Record<string, { total: number; wins: number; pnl: number }> = {};
    filtered.forEach(t => {
      if (!pairMap[t.pair]) pairMap[t.pair] = { total: 0, wins: 0, pnl: 0 };
      pairMap[t.pair].total++;
      if (t.result === "Win") pairMap[t.pair].wins++;
      pairMap[t.pair].pnl += parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
    });
    const pairStats = Object.entries(pairMap).sort((a, b) => b[1].pnl - a[1].pnl).map(([pair, d]) => ({ pair, ...d, winRate: (d.wins / d.total) * 100 }));

    return { total, wins, losses, totalProfit, totalLoss, netPnL, winRate, hourlyStats, monthlyData, pairStats };
  }, [filtered]);

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white" /></button>
        <h1 className="text-lg font-bold text-white flex-1">⏰ Off-Session Trades</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-1">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => onSelectAccount(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selectedAccountId === null ? "gradient-bg text-white" : "glass text-dark-200"}`}>All</button>
        {accounts.map(a => <button key={a.id} onClick={() => onSelectAccount(a.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selectedAccountId === a.id ? "gradient-bg text-white" : "glass text-dark-200"}`}>{a.name}</button>)}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up space-y-3">
          <h3 className="text-white font-semibold text-sm">Add Off-Session Trade</h3>
          {accounts.length > 0 && <div><label className="text-xs text-dark-200 mb-1 block">Account</label><select value={form.accountId} onChange={e => updateField("accountId", e.target.value)} className="w-full"><option value="">Select</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Pair *</label><select value={form.pair} onChange={e => updateField("pair", e.target.value)} className="w-full"><option value="">Select</option>{PAIRS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Date & Time *</label><input type="datetime-local" value={form.date} onChange={e => updateField("date", e.target.value)} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Position</label><div className="flex gap-1">{["Buy","Sell"].map(p => <button key={p} type="button" onClick={() => updateField("position", p)} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${form.position === p ? p === "Buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-dark-700/50 text-dark-200 border border-dark-600/30"}`}>{p}</button>)}</div></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Result *</label><div className="flex gap-1">{RESULTS.map(r => <button key={r} type="button" onClick={() => updateField("result", r)} className={`flex-1 py-2 rounded-lg text-[10px] font-semibold ${form.result === r ? r === "Win" ? "bg-green-500/20 text-green-400 border border-green-500/30" : r === "Loss" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30" : "bg-dark-700/50 text-dark-200 border border-dark-600/30"}`}>{r}</button>)}</div></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Entry</label><input type="number" step="any" value={form.entry} onChange={e => updateField("entry", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">SL</label><input type="number" step="any" value={form.stopLoss} onChange={e => updateField("stopLoss", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">TP</label><input type="number" step="any" value={form.takeProfit} onChange={e => updateField("takeProfit", e.target.value)} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Profit ($)</label><input type="number" step="any" value={form.profit} onChange={e => updateField("profit", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Loss ($)</label><input type="number" step="any" value={form.loss} onChange={e => updateField("loss", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">RR</label><input type="number" step="any" value={form.rr} onChange={e => updateField("rr", e.target.value)} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Strategy</label><select value={form.strategyName} onChange={e => updateField("strategyName", e.target.value)} className="w-full"><option value="">Select</option>{STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Timeframe</label><select value={form.timeframe} onChange={e => updateField("timeframe", e.target.value)} className="w-full"><option value="">Select</option>{TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-dark-200 mb-1 block">Screenshot</label>
            {form.screenshotAfter ? <div className="relative rounded-xl overflow-hidden"><img src={form.screenshotAfter} alt="" className="w-full aspect-video object-cover" /><button type="button" onClick={() => updateField("screenshotAfter", "")} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div> : <label className="flex flex-col items-center justify-center w-full h-16 rounded-xl border-2 border-dashed border-dark-500 bg-dark-700/30 cursor-pointer"><Layers className="w-5 h-5 text-dark-400" /><span className="text-dark-300 text-[10px]">Add screenshot</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>}
          </div>
          <div><label className="text-xs text-dark-200 mb-1 block">Notes</label><textarea rows={2} value={form.notes} onChange={e => updateField("notes", e.target.value)} className="w-full !rounded-xl" placeholder="Why did you trade outside session?" /></div>
          <button onClick={handleSave} disabled={saving || !form.pair || !form.result} className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1"><Check className="w-4 h-4" />{saving ? "..." : "Save"}</button>
        </div>
      )}

      {/* ===== ANALYTICS ===== */}
      {stats.total > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="glass-card rounded-xl p-2.5 text-center"><p className="text-dark-300 text-[9px] uppercase">Trades</p><p className="text-white text-lg font-bold">{stats.total}</p></div>
            <div className="glass-card rounded-xl p-2.5 text-center"><p className="text-dark-300 text-[9px] uppercase">Win Rate</p><p className="text-accent-400 text-lg font-bold">{stats.winRate.toFixed(0)}%</p></div>
            <div className="glass-card rounded-xl p-2.5 text-center"><p className="text-dark-300 text-[9px] uppercase">Net PnL</p><p className={`text-lg font-bold ${stats.netPnL >= 0 ? "text-green-400" : "text-red-400"}`}>${stats.netPnL.toFixed(0)}</p></div>
            <div className="glass-card rounded-xl p-2.5 text-center"><p className="text-dark-300 text-[9px] uppercase">W/L</p><p className="text-white text-lg font-bold">{stats.wins}/{stats.losses}</p></div>
          </div>

          {/* 🕐 BEST HOURS — the key feature! */}
          <div className="glass-card rounded-2xl p-4 mb-4 border border-gold-500/20">
            <h3 className="text-white font-semibold text-sm mb-1">🏆 Best Off-Session Hours</h3>
            <p className="text-dark-400 text-[10px] mb-3">Hours with highest profit outside your main sessions</p>
            <div className="space-y-2">
              {stats.hourlyStats.slice(0, 5).map((h, i) => (
                <div key={h.hour} className="flex items-center gap-3 bg-dark-700/30 rounded-xl p-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? "bg-gold-500/20" : "bg-dark-600/30"}`}>
                    <span className={`text-sm font-bold ${i === 0 ? "text-gold-400" : "text-dark-200"}`}>{formatHour(h.hour, 0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium">{h.total} trades · {h.winRate.toFixed(0)}% WR</span>
                      <span className={`text-sm font-bold ${h.netPnL >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(h.netPnL)}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-green-400 text-[10px]">{h.wins}W</span>
                      <span className="text-red-400 text-[10px]">{h.losses}L</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 24h Heatmap */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">🕐 24-Hour Performance Map</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, h) => {
                const data = stats.hourlyStats.find(x => x.hour === h);
                const pnl = data ? data.netPnL : 0;
                const count = data ? data.total : 0;
                return (
                  <div key={h} className={`rounded-lg p-1.5 text-center ${count === 0 ? "bg-dark-700/20" : pnl > 0 ? "bg-green-500/20 border border-green-500/20" : "bg-red-500/20 border border-red-500/20"}`}>
                    <p className="text-dark-300 text-[9px]">{String(h).padStart(2, "0")}:00</p>
                    {count > 0 && <p className={`text-[9px] font-bold ${pnl > 0 ? "text-green-400" : "text-red-400"}`}>${Math.abs(pnl).toFixed(0)}</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-dark-400 text-[10px] mt-2 text-center">🟢 Profit · 🔴 Loss · ⬛ No trades</p>
          </div>

          {/* Monthly with Best Hour */}
          {stats.monthlyData.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">📅 Monthly Off-Session Performance</h3>
              <div className="space-y-2">
                {stats.monthlyData.map(m => (
                  <div key={m.label} className="bg-dark-700/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{m.label}</span>
                      <span className={`text-sm font-bold ${m.netPnL >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(m.netPnL)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300 text-[10px]">{m.total} trades · {m.winRate.toFixed(0)}% WR</span>
                      {m.bestHour >= 0 && <span className="text-gold-400 text-[10px] font-medium">🏆 Best: {formatHour(m.bestHour, 0)} (+${m.bestHourPnL.toFixed(0)})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pair Stats */}
          {stats.pairStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">💱 Off-Session Pair Performance</h3>
              <div className="space-y-2">
                {stats.pairStats.map(p => (
                  <div key={p.pair} className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
                    <div><p className="text-white text-sm font-medium">{p.pair}</p><p className="text-dark-400 text-[10px]">{p.total} trades · {p.winRate.toFixed(0)}% WR</p></div>
                    <p className={`text-sm font-bold ${p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(p.pnl)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Trade List */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">📋 All Off-Session Trades</h3>
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center"><Clock className="w-10 h-10 text-dark-400 mx-auto mb-3" /><p className="text-dark-200 font-medium">No off-session trades</p><p className="text-dark-400 text-xs mt-1">Track trades outside your main sessions</p></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const pnl = parseFloat(t.profit || "0") - parseFloat(t.loss || "0");
              return (
                <div key={t.id} className="glass-card rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {t.screenshotAfter ? <img src={t.screenshotAfter} alt="" className="w-12 h-9 rounded-lg object-cover" /> : <div className={`w-12 h-9 rounded-lg flex items-center justify-center ${t.result === "Win" ? "bg-green-500/15" : t.result === "Loss" ? "bg-red-500/15" : "bg-gray-500/15"}`}>{t.result === "Win" ? <TrendingUp className="w-4 h-4 text-green-400" /> : t.result === "Loss" ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-gray-400" />}</div>}
                      <div>
                        <div className="flex items-center gap-1.5"><span className="text-white font-semibold text-sm">{t.pair}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.result === "Win" ? "bg-green-500/20 text-green-400" : t.result === "Loss" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>{t.result}</span></div>
                        <p className="text-dark-400 text-[10px]">{formatDateShort(t.date)} · <span className="text-gold-400 font-medium">{formatHour(t.tradeHour, t.tradeMinute)}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(pnl)}</span>
                      <button onClick={() => { if (confirm("Delete?")) onDelete(t.id); }} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
