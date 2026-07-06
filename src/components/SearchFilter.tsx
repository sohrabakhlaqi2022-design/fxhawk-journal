"use client";
import { useState, useMemo } from "react";
import { Search, Filter, X } from "./icons";
import type { Trade, Account } from "@/lib/types";
import { formatCurrency, formatDateShort, getResultBg, getPnL } from "@/lib/helpers";

interface SearchFilterProps {
  trades: Trade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (id: number | null) => void;
  onViewTrade: (trade: Trade) => void;
}

export default function SearchFilter({ trades, accounts, selectedAccountId, onSelectAccount, onViewTrade }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterResult, setFilterResult] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterMarket, setFilterMarket] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");

  const strategies = useMemo(() => [...new Set(trades.map((t) => t.strategyName).filter(Boolean))], [trades]);
  const markets = useMemo(() => [...new Set(trades.map((t) => t.market).filter(Boolean))], [trades]);
  const sessions = useMemo(() => [...new Set(trades.map((t) => t.session).filter(Boolean))], [trades]);
  const timeframes = useMemo(() => [...new Set(trades.map((t) => t.timeframe).filter(Boolean))], [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (searchQuery && !t.pair.toLowerCase().includes(searchQuery.toLowerCase()) && !t.strategyName?.toLowerCase().includes(searchQuery.toLowerCase()) && !t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) && !t.broker?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterResult && t.result !== filterResult) return false;
      if (filterStrategy && t.strategyName !== filterStrategy) return false;
      if (filterMarket && t.market !== filterMarket) return false;
      if (filterSession && t.session !== filterSession) return false;
      if (filterTimeframe && t.timeframe !== filterTimeframe) return false;
      return true;
    });
  }, [trades, searchQuery, filterResult, filterStrategy, filterMarket, filterSession, filterTimeframe]);

  const clearFilters = () => { setFilterResult(""); setFilterStrategy(""); setFilterMarket(""); setFilterSession(""); setFilterTimeframe(""); };
  const hasFilters = filterResult || filterStrategy || filterMarket || filterSession || filterTimeframe;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-4 animate-fade-in">🔍 Search & Filter</h1>

      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar animate-fade-in">
        <button onClick={() => onSelectAccount(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === null ? "gradient-bg text-white" : "glass text-dark-200"}`}>All Accounts</button>
        {accounts.map((acc) => (
          <button key={acc.id} onClick={() => onSelectAccount(acc.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === acc.id ? "gradient-bg text-white" : "glass text-dark-200"}`}>{acc.name}</button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4 animate-slide-up">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
        <input type="text" placeholder="Search pairs, strategies, notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full !pl-11 !pr-12" />
        <button onClick={() => setShowFilters(!showFilters)} className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showFilters || hasFilters ? "bg-accent-500/20 text-accent-400" : "text-dark-300"}`}><Filter className="w-4 h-4" /></button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card rounded-2xl p-4 mb-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Filters</h3>
            {hasFilters && <button onClick={clearFilters} className="text-accent-400 text-xs font-medium flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>}
          </div>
          <div>
            <label className="text-xs text-dark-200 mb-1 block">Result</label>
            <div className="flex gap-2">
              {["", "Win", "Loss", "Breakeven"].map((r) => (
                <button key={r} onClick={() => setFilterResult(r)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${filterResult === r ? "gradient-bg text-white" : "bg-dark-700/50 text-dark-200"}`}>{r || "All"}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dark-200 mb-1 block">Strategy</label><select value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)} className="w-full"><option value="">All</option>{strategies.map((s) => <option key={s!} value={s!}>{s}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Market</label><select value={filterMarket} onChange={(e) => setFilterMarket(e.target.value)} className="w-full"><option value="">All</option>{markets.map((m) => <option key={m!} value={m!}>{m}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Session</label><select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="w-full"><option value="">All</option>{sessions.map((s) => <option key={s!} value={s!}>{s}</option>)}</select></div>
            <div><label className="text-xs text-dark-200 mb-1 block">Timeframe</label><select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)} className="w-full"><option value="">All</option>{timeframes.map((t) => <option key={t!} value={t!}>{t}</option>)}</select></div>
          </div>
        </div>
      )}

      <p className="text-dark-300 text-xs mb-3 animate-fade-in">{filteredTrades.length} {filteredTrades.length === 1 ? "trade" : "trades"} found</p>

      <div className="space-y-2">
        {filteredTrades.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center"><Search className="w-12 h-12 text-dark-400 mx-auto mb-3" /><p className="text-dark-200 font-medium">No trades found</p><p className="text-dark-300 text-sm mt-1">Try adjusting your search or filters</p></div>
        ) : (
          filteredTrades.map((trade) => {
            const pnl = getPnL(trade);
            return (
              <button key={trade.id} onClick={() => onViewTrade(trade)} className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:border-accent-500/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-white font-semibold text-sm">{trade.pair}</span><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getResultBg(trade.result)}`}>{trade.result}</span></div>
                  <p className="text-dark-300 text-xs mt-0.5">{formatDateShort(trade.date)} · {trade.position} · {trade.strategyName || "—"}</p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(pnl)}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
