"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, Plus, Trash2, Check, X, TrendingDown, Layers, AlertTriangle } from "./icons";
import type { MissedTrade, Account } from "@/lib/types";
import { formatCurrency, formatDateShort } from "@/lib/helpers";

interface MissedTradesProps {
  missedTrades: MissedTrade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (id: number | null) => void;
  onSave: (data: Partial<MissedTrade>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBack: () => void;
}

const PAIRS = ["EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","NZD/USD","USD/CAD","EUR/GBP","EUR/JPY","GBP/JPY","AUD/JPY","XAU/USD","XAG/USD","NAS100","US30","SPX500","BTC/USD","ETH/USD"];
const SESSIONS = ["London","New York","Tokyo","Sydney","Overlap"];
const CATEGORIES = ["Fear of Loss","FOMO Exit","Not at Screen","Overslept","No Confidence","Waited Too Long","Didn't See Setup","Busy / Distracted","Emotional State","Risk Limit Reached","Other"];
const STRATEGIES = ["Breakout","Supply & Demand","Order Block","Fibonacci Retracement","Trend Continuation","Support Bounce","Price Action","Smart Money","Scalping","Swing Trading"];
const MARKETS = ["Forex","Indices","Commodities","Crypto","Stocks"];
const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4","D1","W1","MN"];

export default function MissedTrades({ missedTrades, accounts, selectedAccountId, onSelectAccount, onSave, onDelete, onBack }: MissedTradesProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accountId: "",
    pair: "",
    date: new Date().toISOString().slice(0, 16),
    session: "",
    position: "Buy",
    entry: "",
    stopLoss: "",
    takeProfit: "",
    rr: "",
    potentialProfit: "",
    strategyName: "",
    market: "",
    timeframe: "",
    reason: "",
    category: "",
    screenshotAfter: "",
    notes: "",
  });

  const updateField = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const resetForm = () => { setForm({ accountId: "", pair: "", date: new Date().toISOString().slice(0, 16), session: "", position: "Buy", entry: "", stopLoss: "", takeProfit: "", rr: "", potentialProfit: "", strategyName: "", market: "", timeframe: "", reason: "", category: "", screenshotAfter: "", notes: "" }); setShowForm(false); };

  const handleSave = async () => {
    if (!form.pair || !form.category) { alert("Pair and Reason Category required"); return; }
    setSaving(true);
    try { await onSave(form as unknown as Partial<MissedTrade>); resetForm(); }
    catch { alert("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const max = 1200;
        if (width > max) { height = (height * max) / width; width = max; }
        else if (height > max) { width = (width * max) / height; height = max; }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        updateField("screenshotAfter", canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Filter by account
  const filtered = selectedAccountId ? missedTrades.filter(mt => mt.accountId === selectedAccountId) : missedTrades;

  // ===== ANALYTICS =====
  const totalMissed = filtered.length;
  const totalPotential = filtered.reduce((s, mt) => s + parseFloat(mt.potentialProfit || "0"), 0);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(mt => { const c = mt.category || "Other"; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, count]) => ({ cat, count, pct: totalMissed > 0 ? Math.round((count / totalMissed) * 100) : 0 }));
  }, [filtered, totalMissed]);

  // Weekly trend (last 8 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - (w * 7) - now.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
      const label = `W${8 - w}`;
      const count = filtered.filter(mt => { const d = new Date(mt.date); return d >= weekStart && d < weekEnd; }).length;
      weeks.push({ label, count });
    }
    return weeks;
  }, [filtered]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: { label: string; count: number; potential: number }[] = [];
    const now = new Date();
    for (let m = 5; m >= 0; m--) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const label = month.toLocaleDateString("en-US", { month: "short" });
      const items = filtered.filter(mt => { const d = new Date(mt.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear(); });
      months.push({ label, count: items.length, potential: items.reduce((s, mt) => s + parseFloat(mt.potentialProfit || "0"), 0) });
    }
    return months;
  }, [filtered]);

  // Focus / Improvement score
  const focusScore = useMemo(() => {
    if (monthlyTrend.length < 2) return { trend: 0, status: "neutral" as const };
    const recent = monthlyTrend[monthlyTrend.length - 1].count;
    const prev = monthlyTrend[monthlyTrend.length - 2].count;
    if (prev === 0 && recent === 0) return { trend: 0, status: "neutral" as const };
    if (prev === 0) return { trend: -100, status: "worse" as const };
    const change = Math.round(((prev - recent) / prev) * 100);
    return { trend: change, status: change > 0 ? "better" as const : change < 0 ? "worse" as const : "neutral" as const };
  }, [monthlyTrend]);

  // Pair breakdown
  const pairStats = useMemo(() => {
    const map: Record<string, { count: number; potential: number }> = {};
    filtered.forEach(mt => {
      if (!map[mt.pair]) map[mt.pair] = { count: 0, potential: 0 };
      map[mt.pair].count++;
      map[mt.pair].potential += parseFloat(mt.potentialProfit || "0");
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).map(([pair, d]) => ({ pair, ...d }));
  }, [filtered]);

  // Max bar for weekly chart
  const maxWeekly = Math.max(...weeklyTrend.map(w => w.count), 1);

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white" /></button>
        <h1 className="text-lg font-bold text-white flex-1">👻 Missed Trades</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-2 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" />{showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button onClick={() => onSelectAccount(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === null ? "gradient-bg text-white" : "glass text-dark-200"}`}>All</button>
        {accounts.map(acc => (
          <button key={acc.id} onClick={() => onSelectAccount(acc.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === acc.id ? "gradient-bg text-white" : "glass text-dark-200"}`}>{acc.name}</button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up space-y-3">
          <h3 className="text-white font-semibold text-sm">Add Missed Trade</h3>
          {accounts.length > 0 && <div><label className="text-xs text-dark-200 mb-1 block">Account</label><select value={form.accountId} onChange={e => updateField("accountId", e.target.value)} className="w-full"><option value="">Select</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Pair *</label><select value={form.pair} onChange={e => updateField("pair", e.target.value)} className="w-full"><option value="">Select</option>{PAIRS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Position</label><div className="flex gap-1">{["Buy","Sell"].map(p => (<button key={p} type="button" onClick={() => updateField("position", p)} className={`flex-1 py-2 rounded-lg text-xs font-semibold ${form.position === p ? p === "Buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-dark-700/50 text-dark-200 border border-dark-600/30"}`}>{p}</button>))}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Date</label><input type="datetime-local" value={form.date} onChange={e => updateField("date", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Session</label><select value={form.session} onChange={e => updateField("session", e.target.value)} className="w-full"><option value="">Select</option>{SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-dark-200 mb-1 block">Why did you miss it? *</label><select value={form.category} onChange={e => updateField("category", e.target.value)} className="w-full"><option value="">Select reason</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Entry</label><input type="number" step="any" placeholder="0.00" value={form.entry} onChange={e => updateField("entry", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">SL</label><input type="number" step="any" placeholder="0.00" value={form.stopLoss} onChange={e => updateField("stopLoss", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">TP</label><input type="number" step="any" placeholder="0.00" value={form.takeProfit} onChange={e => updateField("takeProfit", e.target.value)} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Potential Profit ($)</label><input type="number" step="any" placeholder="0.00" value={form.potentialProfit} onChange={e => updateField("potentialProfit", e.target.value)} className="w-full" /></div>
            <div><label className="text-xs text-dark-200 mb-1 block">RR</label><input type="number" step="any" placeholder="2.0" value={form.rr} onChange={e => updateField("rr", e.target.value)} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Strategy</label><select value={form.strategyName} onChange={e => updateField("strategyName", e.target.value)} className="w-full"><option value="">Select</option>{STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Timeframe</label><select value={form.timeframe} onChange={e => updateField("timeframe", e.target.value)} className="w-full"><option value="">Select</option>{TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          {/* Screenshot */}
          <div>
            <label className="text-xs text-dark-200 mb-1 block">Screenshot (how it played out)</label>
            {form.screenshotAfter ? (
              <div className="relative rounded-xl overflow-hidden"><img src={form.screenshotAfter} alt="" className="w-full aspect-video object-cover" /><button type="button" onClick={() => updateField("screenshotAfter", "")} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/80 flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-20 rounded-xl border-2 border-dashed border-dark-500 bg-dark-700/30 cursor-pointer"><Layers className="w-5 h-5 text-dark-400 mb-1" /><span className="text-dark-300 text-xs">Add screenshot</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
            )}
          </div>
          <div><label className="text-xs text-dark-200 mb-1 block">Notes</label><textarea rows={2} placeholder="What you learned..." value={form.notes} onChange={e => updateField("notes", e.target.value)} className="w-full !rounded-xl" /></div>
          <button onClick={handleSave} disabled={saving || !form.pair || !form.category} className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1"><Check className="w-4 h-4" />{saving ? "Saving..." : "Save Missed Trade"}</button>
        </div>
      )}

      {/* ===== ANALYTICS ===== */}
      {totalMissed > 0 && (
        <>
          {/* Focus Score */}
          <div className={`glass-card rounded-2xl p-4 mb-4 border ${focusScore.status === "better" ? "border-green-500/30" : focusScore.status === "worse" ? "border-red-500/30" : "border-dark-500/30"}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm">🎯 Focus Score</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${focusScore.status === "better" ? "bg-green-500/20 text-green-400" : focusScore.status === "worse" ? "bg-red-500/20 text-red-400" : "bg-dark-500/20 text-dark-200"}`}>
                {focusScore.status === "better" ? `↑ ${focusScore.trend}% Improved` : focusScore.status === "worse" ? `↓ ${Math.abs(focusScore.trend)}% Declined` : "— Stable"}
              </span>
            </div>
            <p className="text-dark-300 text-[10px]">Compared to last month — fewer missed trades = more focus</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="glass-card rounded-xl p-3 text-center"><p className="text-dark-300 text-[10px] uppercase">Total Missed</p><p className="text-red-400 text-lg font-bold">{totalMissed}</p></div>
            <div className="glass-card rounded-xl p-3 text-center"><p className="text-dark-300 text-[10px] uppercase">Lost Profit</p><p className="text-gold-400 text-lg font-bold">${totalPotential.toFixed(0)}</p></div>
            <div className="glass-card rounded-xl p-3 text-center"><p className="text-dark-300 text-[10px] uppercase">This Month</p><p className="text-accent-400 text-lg font-bold">{monthlyTrend[monthlyTrend.length - 1]?.count || 0}</p></div>
          </div>

          {/* Weekly Trend Chart */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">📉 Weekly Trend</h3>
            <div className="flex items-end gap-1 h-24">
              {weeklyTrend.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-dark-300 text-[9px]">{w.count}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max((w.count / maxWeekly) * 100, 4)}%`, background: i === weeklyTrend.length - 1 ? (w.count <= (weeklyTrend[i - 1]?.count || 99) ? "#00d68f" : "#ff3d71") : "rgba(108,99,255,0.4)" }} />
                  <span className="text-dark-400 text-[8px]">{w.label}</span>
                </div>
              ))}
            </div>
            <p className="text-dark-400 text-[10px] mt-2 text-center">↓ Lower bars = Better focus & discipline</p>
          </div>

          {/* Monthly Trend */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">📊 Monthly Overview</h3>
            <div className="space-y-2">
              {monthlyTrend.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-dark-300 text-xs w-8">{m.label}</span>
                  <div className="flex-1 h-6 bg-dark-700/30 rounded-full overflow-hidden relative">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((m.count / (Math.max(...monthlyTrend.map(x => x.count)) || 1)) * 100, 3)}%`, background: `linear-gradient(90deg, rgba(255,61,113,0.6), rgba(255,61,113,0.3))` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{m.count} missed · ${m.potential.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Breakdown */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">🔍 Why You Missed</h3>
            <div className="space-y-2">
              {categoryStats.map(c => (
                <div key={c.cat} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-dark-100 text-xs">{c.cat}</span>
                      <span className="text-dark-300 text-[10px]">{c.count}× ({c.pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-dark-700/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-400/60" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pair Breakdown */}
          {pairStats.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3">💱 Most Missed Pairs</h3>
              <div className="space-y-2">
                {pairStats.map(p => (
                  <div key={p.pair} className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
                    <div><p className="text-white text-sm font-medium">{p.pair}</p><p className="text-dark-400 text-[10px]">{p.count} missed</p></div>
                    <p className="text-gold-400 text-sm font-bold">${p.potential.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Trade List */}
      <div className="mb-4">
        <h3 className="text-white font-semibold text-sm mb-3">📋 All Missed Trades</h3>
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium">No missed trades</p>
            <p className="text-dark-400 text-xs mt-1">Track setups you missed to improve discipline</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(mt => (
              <div key={mt.id} className="glass-card rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {mt.screenshotAfter ? (
                      <img src={mt.screenshotAfter} alt="" className="w-12 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-400" /></div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5"><span className="text-white font-semibold text-sm">{mt.pair}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full ${mt.position === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{mt.position}</span></div>
                      <p className="text-dark-400 text-[10px]">{formatDateShort(mt.date)} · {mt.category || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold-400 text-sm font-bold">${parseFloat(mt.potentialProfit || "0").toFixed(0)}</span>
                    <button onClick={() => { if (confirm("Delete?")) onDelete(mt.id); }} className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                </div>
                {mt.reason && <p className="text-dark-300 text-[10px] bg-dark-700/30 rounded-lg p-2">{mt.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
