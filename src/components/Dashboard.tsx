"use client";
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Activity, ArrowUpRight, ArrowDownRight, Minus, Layers } from "./icons";
import type { Trade, TradeStats, Account } from "@/lib/types";
import { computeStats, formatCurrency, formatDateShort, getResultBg, getPnL } from "@/lib/helpers";

interface DashboardProps {
  trades: Trade[];
  accounts: Account[];
  selectedAccountId: number | null;
  onViewTrade: (trade: Trade) => void;
  onSelectAccount: (id: number | null) => void;
  onManageAccounts: () => void;
}

export default function Dashboard({ 
  trades, 
  accounts, 
  selectedAccountId, 
  onViewTrade, 
  onSelectAccount,
  onManageAccounts 
}: DashboardProps) {
  // Filter trades by selected account
  const filteredTrades = selectedAccountId 
    ? trades.filter(t => t.accountId === selectedAccountId)
    : trades;
  
  const stats = computeStats(filteredTrades);
  
  // Get selected account's initial balance
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const initialBalance = selectedAccount 
    ? parseFloat(selectedAccount.initialBalance) 
    : accounts.length > 0 
      ? parseFloat(accounts[0].initialBalance)
      : 10000;
  
  const currentBalance = initialBalance + stats.netProfit;
  const growthPercent = initialBalance > 0 ? ((currentBalance - initialBalance) / initialBalance) * 100 : 0;

  const statCards = [
    { label: "Net Profit", value: formatCurrency(stats.netProfit), icon: DollarSign, color: stats.netProfit >= 0 ? "from-green-500/20 to-green-500/5" : "from-red-500/20 to-red-500/5", iconColor: stats.netProfit >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Balance", value: `$${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: Target, color: "from-accent-500/20 to-accent-500/5", iconColor: "text-accent-400" },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: Award, color: "from-gold-500/20 to-gold-500/5", iconColor: "text-gold-400" },
    { label: "Growth", value: `${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(1)}%`, icon: Activity, color: growthPercent >= 0 ? "from-green-500/20 to-green-500/5" : "from-red-500/20 to-red-500/5", iconColor: growthPercent >= 0 ? "text-green-400" : "text-red-400" },
  ];

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      {/* Account Selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar animate-fade-in">
        <button
          onClick={() => onSelectAccount(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedAccountId === null 
              ? "gradient-bg text-white" 
              : "glass text-dark-200"
          }`}
        >
          All Accounts
        </button>
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => onSelectAccount(acc.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedAccountId === acc.id 
                ? "gradient-bg text-white" 
                : "glass text-dark-200"
            }`}
          >
            {acc.name}
          </button>
        ))}
        <button
          onClick={onManageAccounts}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium glass text-accent-400 border border-accent-500/30"
        >
          + Manage
        </button>
      </div>

      {/* Selected Account Info */}
      {selectedAccount && (
        <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-300 text-xs">Account</p>
              <p className="text-white font-bold">{selectedAccount.name}</p>
              <p className="text-dark-300 text-xs">{selectedAccount.broker || "No broker"}</p>
            </div>
            <div className="text-right">
              <p className="text-dark-300 text-xs">Initial Capital</p>
              <p className="text-accent-400 font-bold text-lg">
                ${parseFloat(selectedAccount.initialBalance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="glass-card rounded-2xl p-4 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <p className="text-dark-200 text-xs font-medium">{card.label}</p>
              <p className="text-white text-lg font-bold mt-0.5">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="glass-card rounded-2xl p-4 mb-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-green-400 text-lg font-bold">{stats.wins}</p>
            <p className="text-dark-300 text-[10px] uppercase tracking-wider">Wins</p>
          </div>
          <div className="w-px h-8 bg-dark-600" />
          <div className="text-center flex-1">
            <p className="text-red-400 text-lg font-bold">{stats.losses}</p>
            <p className="text-dark-300 text-[10px] uppercase tracking-wider">Losses</p>
          </div>
          <div className="w-px h-8 bg-dark-600" />
          <div className="text-center flex-1">
            <p className="text-gray-400 text-lg font-bold">{stats.breakevens}</p>
            <p className="text-dark-300 text-[10px] uppercase tracking-wider">BE</p>
          </div>
          <div className="w-px h-8 bg-dark-600" />
          <div className="text-center flex-1">
            <p className="text-accent-400 text-lg font-bold">{stats.avgRR.toFixed(1)}</p>
            <p className="text-dark-300 text-[10px] uppercase tracking-wider">Avg RR</p>
          </div>
        </div>
      </div>

      {/* Trade Cards with Thumbnails */}
      <div className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-base">📸 Trade Journal</h2>
          <span className="text-dark-300 text-xs">{filteredTrades.length} trades</span>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <TrendingUp className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium">No trades yet</p>
            <p className="text-dark-300 text-sm mt-1">Tap the + button to add your first trade</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredTrades.map((trade, i) => {
              const pnl = getPnL(trade);
              return (
                <button
                  key={trade.id}
                  onClick={() => onViewTrade(trade)}
                  className="glass-card rounded-2xl overflow-hidden text-left hover:border-accent-500/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${0.6 + i * 0.05}s` }}
                >
                  {/* Screenshot Thumbnail */}
                  <div className="relative aspect-[4/3] bg-dark-700/50 overflow-hidden">
                    {trade.screenshotAfter ? (
                      <img 
                        src={trade.screenshotAfter} 
                        alt="Trade screenshot"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-8 h-8 text-dark-500" />
                      </div>
                    )}
                    {/* Result Badge */}
                    <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${getResultBg(trade.result)}`}>
                      {trade.result}
                    </div>
                    {/* Position Badge */}
                    <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trade.position === "Buy" ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"
                    }`}>
                      {trade.position === "Buy" ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                      {trade.position}
                    </div>
                    {/* Voice Note Indicator */}
                    {trade.voiceNote && (
                      <div className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-accent-500/80 flex items-center justify-center">
                        <span className="text-[10px]">🎙️</span>
                      </div>
                    )}
                  </div>

                  {/* Trade Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold text-sm">{trade.pair}</span>
                      <span className={`text-sm font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(pnl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-300 text-[10px]">{formatDateShort(trade.date)}</span>
                      {trade.rr && parseFloat(trade.rr) > 0 && (
                        <span className="text-accent-400 text-[10px] font-medium">{parseFloat(trade.rr).toFixed(1)}R</span>
                      )}
                    </div>
                    {trade.strategyName && (
                      <p className="text-dark-400 text-[10px] mt-1 truncate">{trade.strategyName}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
