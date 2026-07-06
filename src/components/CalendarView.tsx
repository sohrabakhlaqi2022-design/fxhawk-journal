"use client";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "./icons";
import type { Trade, Account } from "@/lib/types";
import { formatCurrency, getPnL } from "@/lib/helpers";

interface CalendarViewProps {
  trades: Trade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (id: number | null) => void;
  onViewTrade: (trade: Trade) => void;
}

export default function CalendarView({ trades, accounts, selectedAccountId, onSelectAccount, onViewTrade }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [trades]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const selectedTrades = selectedDate ? (tradesByDate[selectedDate] || []) : [];
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  // Monthly stats
  const monthTrades = trades.filter((t) => { const d = new Date(t.date); return d.getMonth() === month && d.getFullYear() === year; });
  const monthPnl = monthTrades.reduce((s, t) => s + getPnL(t), 0);
  const monthWins = monthTrades.filter((t) => t.result === "Win").length;
  const monthWinRate = monthTrades.length > 0 ? (monthWins / monthTrades.length) * 100 : 0;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-4 animate-fade-in">📅 Calendar</h1>

      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar animate-fade-in">
        <button onClick={() => onSelectAccount(null)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === null ? "gradient-bg text-white" : "glass text-dark-200"}`}>All Accounts</button>
        {accounts.map((acc) => (
          <button key={acc.id} onClick={() => onSelectAccount(acc.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedAccountId === acc.id ? "gradient-bg text-white" : "glass text-dark-200"}`}>{acc.name}</button>
        ))}
      </div>

      {/* Month Navigator */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg glass flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-white" /></button>
          <h2 className="text-white font-bold text-base">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg glass flex items-center justify-center"><ChevronRight className="w-4 h-4 text-white" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] text-dark-300 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTrades = tradesByDate[dateKey] || [];
            const dayPnl = dayTrades.reduce((s, t) => s + getPnL(t), 0);
            const hasTrades = dayTrades.length > 0;
            const isSelected = selectedDate === dateKey;
            const isToday = new Date().toISOString().slice(0, 10) === dateKey;

            return (
              <button key={dateKey} onClick={() => setSelectedDate(isSelected ? null : dateKey)} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${isSelected ? "bg-accent-500/30 border border-accent-500/50" : hasTrades ? dayPnl >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20" : "bg-dark-700/20 border border-transparent"} ${isToday ? "ring-1 ring-accent-400" : ""}`}>
                <span className={`font-medium ${hasTrades ? "text-white" : "text-dark-300"}`}>{day}</span>
                {hasTrades && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dayPnl >= 0 ? "bg-green-400" : "bg-red-400"}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">Monthly Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase tracking-wider">Trades</p><p className="text-white text-lg font-bold">{monthTrades.length}</p></div>
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase tracking-wider">PnL</p><p className={`text-lg font-bold ${monthPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(monthPnl)}</p></div>
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase tracking-wider">Win Rate</p><p className="text-accent-400 text-lg font-bold">{monthWinRate.toFixed(0)}%</p></div>
        </div>
      </div>

      {/* Selected Date Trades */}
      {selectedDate && (
        <div className="animate-slide-up">
          <h3 className="text-white font-semibold text-sm mb-3">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
          {selectedTrades.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center"><p className="text-dark-300 text-sm">No trades on this day</p></div>
          ) : (
            <div className="space-y-2">
              {selectedTrades.map((trade) => {
                const pnl = getPnL(trade);
                return (
                  <button key={trade.id} onClick={() => onViewTrade(trade)} className="w-full glass-card rounded-xl p-3 flex items-center justify-between text-left">
                    <div><p className="text-white font-semibold text-sm">{trade.pair}</p><p className="text-dark-300 text-xs">{trade.position} · {trade.session || trade.timeframe || "—"}</p></div>
                    <div className="text-right"><p className={`font-bold text-sm ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(pnl)}</p><p className={`text-[10px] ${trade.result === "Win" ? "text-green-400" : trade.result === "Loss" ? "text-red-400" : "text-gray-400"}`}>{trade.result}</p></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
