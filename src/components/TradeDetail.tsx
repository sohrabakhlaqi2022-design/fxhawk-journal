"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Edit, Trash2, ArrowUpRight, ArrowDownRight, BookOpen, Brain, AlertTriangle, Star, Volume2 } from "./icons";
import type { Trade } from "@/lib/types";
import { formatCurrency, formatDate, getResultBg, getPnL } from "@/lib/helpers";

interface TradeDetailProps {
  trade: Trade;
  onBack: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: number) => void;
}

export default function TradeDetail({ trade, onBack, onEdit, onDelete }: TradeDetailProps) {
  const pnl = getPnL(trade);
  const [activeImage, setActiveImage] = useState<"before" | "after">(trade.screenshotAfter ? "after" : "before");

  const infoRows = [
    { label: "Entry", value: trade.entry },
    { label: "Stop Loss", value: trade.stopLoss },
    { label: "Take Profit", value: trade.takeProfit },
    { label: "Risk %", value: trade.riskPercent ? `${trade.riskPercent}%` : null },
    { label: "RR", value: trade.rr ? `${parseFloat(trade.rr).toFixed(1)}` : null },
    { label: "Lot Size", value: trade.lotSize },
    { label: "Commission", value: trade.commission ? `$${trade.commission}` : null },
    { label: "Strategy", value: trade.strategyName },
    { label: "Market", value: trade.market },
    { label: "Timeframe", value: trade.timeframe },
    { label: "Session", value: trade.session },
    { label: "Broker", value: trade.broker },
  ].filter((r) => r.value);

  const hasScreenshots = trade.screenshotBefore || trade.screenshotAfter;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">Trade Details</h1>
        <button onClick={() => onEdit(trade)} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
          <Edit className="w-4 h-4 text-accent-400" />
        </button>
        <button
          onClick={() => { if (confirm("Delete this trade?")) onDelete(trade.id); }}
          className="w-9 h-9 rounded-xl glass flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Screenshots */}
      {hasScreenshots && (
        <div className="glass-card rounded-2xl overflow-hidden mb-4">
          {/* Image Display */}
          <div className="relative aspect-video bg-dark-700">
            {activeImage === "after" && trade.screenshotAfter ? (
              <img src={trade.screenshotAfter} alt="After Trade" className="w-full h-full object-contain" />
            ) : activeImage === "before" && trade.screenshotBefore ? (
              <img src={trade.screenshotBefore} alt="Before Trade" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-dark-400">
                No image
              </div>
            )}
            
            {/* Navigation Arrows */}
            {trade.screenshotBefore && trade.screenshotAfter && (
              <>
                <button
                  onClick={() => setActiveImage("before")}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center ${activeImage === "before" ? "opacity-50" : ""}`}
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setActiveImage("after")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center ${activeImage === "after" ? "opacity-50" : ""}`}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>
          
          {/* Image Tabs */}
          {trade.screenshotBefore && trade.screenshotAfter && (
            <div className="flex border-t border-dark-600/50">
              <button
                onClick={() => setActiveImage("before")}
                className={`flex-1 py-2 text-xs font-medium text-center transition-all ${
                  activeImage === "before" ? "bg-accent-500/20 text-accent-400" : "text-dark-300"
                }`}
              >
                Before Trade
              </button>
              <button
                onClick={() => setActiveImage("after")}
                className={`flex-1 py-2 text-xs font-medium text-center transition-all ${
                  activeImage === "after" ? "bg-accent-500/20 text-accent-400" : "text-dark-300"
                }`}
              >
                After Trade
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voice Note */}
      {trade.voiceNote && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-accent-400" /> Voice Note
          </h3>
          <audio src={trade.voiceNote} controls className="w-full h-10" />
        </div>
      )}

      {/* Main Card */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              trade.result === "Win" ? "bg-green-500/15" : trade.result === "Loss" ? "bg-red-500/15" : "bg-gray-500/15"
            }`}>
              {trade.position === "Buy" ? (
                <ArrowUpRight className="w-6 h-6 text-green-400" />
              ) : (
                <ArrowDownRight className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{trade.pair}</h2>
              <p className="text-dark-300 text-xs">{formatDate(trade.date)}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getResultBg(trade.result)}`}>
            {trade.result}
          </span>
        </div>

        {/* PnL */}
        <div className={`rounded-xl p-4 mb-4 ${pnl >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
          <p className="text-dark-200 text-xs mb-1">Profit / Loss</p>
          <p className={`text-2xl font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(pnl)}
          </p>
        </div>

        {/* Position Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            trade.position === "Buy" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
          }`}>
            {trade.position}
          </span>
          {trade.rr && parseFloat(trade.rr) > 0 && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-500/15 text-accent-400">
              {parseFloat(trade.rr).toFixed(1)}R
            </span>
          )}
        </div>

        {/* Tags */}
        {trade.tags && Array.isArray(trade.tags) && trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(trade.tags as string[]).map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Trade Info Grid */}
      {infoRows.length > 0 && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            📊 Trade Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {infoRows.map((row) => (
              <div key={row.label} className="bg-dark-700/30 rounded-xl p-3">
                <p className="text-dark-300 text-[10px] uppercase tracking-wider mb-0.5">{row.label}</p>
                <p className="text-white text-sm font-medium">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotions */}
      {(trade.emotionBefore || trade.emotionAfter) && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-400" /> Emotions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {trade.emotionBefore && (
              <div className="bg-dark-700/30 rounded-xl p-3">
                <p className="text-dark-300 text-[10px] uppercase tracking-wider mb-0.5">Before Trade</p>
                <p className="text-white text-sm font-medium">{trade.emotionBefore}</p>
              </div>
            )}
            {trade.emotionAfter && (
              <div className="bg-dark-700/30 rounded-xl p-3">
                <p className="text-dark-300 text-[10px] uppercase tracking-wider mb-0.5">After Trade</p>
                <p className="text-white text-sm font-medium">{trade.emotionAfter}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-400" /> Notes
          </h3>
          <p className="text-dark-100 text-sm leading-relaxed">{trade.notes}</p>
        </div>
      )}

      {/* Psychology */}
      {trade.psychologyNotes && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" /> Psychology
          </h3>
          <p className="text-dark-100 text-sm leading-relaxed">{trade.psychologyNotes}</p>
        </div>
      )}

      {/* Mistakes */}
      {trade.mistakes && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Mistakes
          </h3>
          <p className="text-dark-100 text-sm leading-relaxed">{trade.mistakes}</p>
        </div>
      )}

      {/* Lessons */}
      {trade.lessonsLearned && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-gold-400" /> Lessons Learned
          </h3>
          <p className="text-dark-100 text-sm leading-relaxed">{trade.lessonsLearned}</p>
        </div>
      )}
    </div>
  );
}
