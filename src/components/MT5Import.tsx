"use client";
import { useState, useRef } from "react";
import { ChevronLeft, Upload, Check, AlertTriangle, RefreshCw } from "./icons";
import type { Account } from "@/lib/types";

interface MT5ImportProps {
  account: Account;
  onBack: () => void;
  onImport: (trades: ParsedTrade[]) => Promise<void>;
}

export interface ParsedTrade {
  pair: string;
  position: string;
  date: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  lotSize: string;
  profit: string;
  loss: string;
  commission: string;
  result: string;
  rr: string;
}

// Parse MT5 HTML Statement
function parseMT5Html(html: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  // Find trade rows - MT5 statements have tables with trade data
  const rows = doc.querySelectorAll("tr");
  
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 10) {
      const text = Array.from(cells).map(c => c.textContent?.trim() || "");
      
      // Look for rows that have buy/sell
      const typeCell = text.find(t => t.toLowerCase() === "buy" || t.toLowerCase() === "sell");
      if (typeCell) {
        // Try to extract trade data
        const symbolIdx = text.findIndex(t => /^[A-Z]{6}$/.test(t) || /^[A-Z]{3}\/[A-Z]{3}$/.test(t) || /^[A-Z]+\d*$/.test(t));
        if (symbolIdx >= 0) {
          const symbol = text[symbolIdx].replace("/", "");
          const position = typeCell.charAt(0).toUpperCase() + typeCell.slice(1).toLowerCase();
          
          // Find numeric values
          const numbers = text.filter(t => /^-?\d+\.?\d*$/.test(t.replace(/\s/g, "")));
          
          if (numbers.length >= 3) {
            const lotSize = numbers.find(n => parseFloat(n) > 0 && parseFloat(n) < 100) || "0.01";
            const profit = numbers[numbers.length - 1] || "0";
            const profitNum = parseFloat(profit);
            
            trades.push({
              pair: symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol,
              position,
              date: new Date().toISOString(),
              entry: numbers[1] || "",
              stopLoss: "",
              takeProfit: "",
              lotSize,
              profit: profitNum > 0 ? profit : "0",
              loss: profitNum < 0 ? Math.abs(profitNum).toString() : "0",
              commission: "0",
              result: profitNum > 0 ? "Win" : profitNum < 0 ? "Loss" : "Breakeven",
              rr: "",
            });
          }
        }
      }
    }
  });
  
  return trades;
}

// Parse MT5 CSV/Text format
function parseMT5Text(text: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const lines = text.split("\n").filter(l => l.trim());
  
  for (const line of lines) {
    // Try different delimiters
    const parts = line.includes("\t") ? line.split("\t") : line.split(/[,;]/);
    
    if (parts.length >= 6) {
      // Look for buy/sell
      const typeIdx = parts.findIndex(p => /^(buy|sell)$/i.test(p.trim()));
      if (typeIdx >= 0) {
        const position = parts[typeIdx].trim();
        
        // Find symbol (usually EURUSD, GBPUSD, etc.)
        const symbolPart = parts.find(p => /^[A-Z]{6,}$/i.test(p.trim()) || /^[A-Z]+\/[A-Z]+$/i.test(p.trim()));
        if (symbolPart) {
          const symbol = symbolPart.trim().toUpperCase().replace("/", "");
          
          // Find numbers for lot, price, profit
          const numbers = parts.map(p => p.trim()).filter(p => /^-?\d+\.?\d*$/.test(p));
          
          // Find date
          const datePart = parts.find(p => /\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(p) || /\d{2}[.\-/]\d{2}[.\-/]\d{4}/.test(p));
          let tradeDate = new Date().toISOString();
          if (datePart) {
            try {
              const d = new Date(datePart.trim());
              if (!isNaN(d.getTime())) tradeDate = d.toISOString();
            } catch {}
          }
          
          if (numbers.length >= 2) {
            const profit = parseFloat(numbers[numbers.length - 1]) || 0;
            
            trades.push({
              pair: symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol,
              position: position.charAt(0).toUpperCase() + position.slice(1).toLowerCase(),
              date: tradeDate,
              entry: numbers[0] || "",
              stopLoss: "",
              takeProfit: "",
              lotSize: numbers.find(n => parseFloat(n) > 0 && parseFloat(n) < 100) || "0.01",
              profit: profit > 0 ? profit.toString() : "0",
              loss: profit < 0 ? Math.abs(profit).toString() : "0",
              commission: "0",
              result: profit > 0 ? "Win" : profit < 0 ? "Loss" : "Breakeven",
              rr: "",
            });
          }
        }
      }
    }
  }
  
  return trades;
}

// Simple manual paste format: Symbol, Buy/Sell, Entry, SL, TP, Lot, Profit
function parseSimpleFormat(text: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const lines = text.split("\n").filter(l => l.trim());
  
  for (const line of lines) {
    const parts = line.split(/[\t,;|]/).map(p => p.trim());
    
    if (parts.length >= 3) {
      const symbol = parts[0]?.toUpperCase() || "";
      const position = parts[1] || "Buy";
      const entry = parts[2] || "";
      const stopLoss = parts[3] || "";
      const takeProfit = parts[4] || "";
      const lotSize = parts[5] || "0.01";
      const profitStr = parts[6] || "0";
      const profit = parseFloat(profitStr) || 0;
      
      if (symbol && (position.toLowerCase() === "buy" || position.toLowerCase() === "sell")) {
        trades.push({
          pair: symbol.includes("/") ? symbol : symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol,
          position: position.charAt(0).toUpperCase() + position.slice(1).toLowerCase(),
          date: new Date().toISOString(),
          entry,
          stopLoss,
          takeProfit,
          lotSize,
          profit: profit > 0 ? profit.toString() : "0",
          loss: profit < 0 ? Math.abs(profit).toString() : "0",
          commission: "0",
          result: profit > 0 ? "Win" : profit < 0 ? "Loss" : "Breakeven",
          rr: "",
        });
      }
    }
  }
  
  return trades;
}

export default function MT5Import({ account, onBack, onImport }: MT5ImportProps) {
  const [pasteData, setPasteData] = useState("");
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    setError("");
    let trades: ParsedTrade[] = [];
    
    // Try HTML first
    if (pasteData.includes("<") && pasteData.includes(">")) {
      trades = parseMT5Html(pasteData);
    }
    
    // If no trades found, try CSV/text
    if (trades.length === 0) {
      trades = parseMT5Text(pasteData);
    }
    
    // If still no trades, try simple format
    if (trades.length === 0) {
      trades = parseSimpleFormat(pasteData);
    }
    
    if (trades.length === 0) {
      setError("Could not parse any trades. Please check the format.");
    } else {
      setParsedTrades(trades);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteData(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedTrades.length === 0) return;
    setImporting(true);
    setError("");
    
    try {
      await onImport(parsedTrades);
      setSuccess(true);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      setError("Failed to import trades");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">Import from MT5</h1>
          <p className="text-dark-300 text-xs">{account.name}</p>
        </div>
      </div>

      {success ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-white font-bold text-lg">Import Successful!</h2>
          <p className="text-dark-300 text-sm mt-2">{parsedTrades.length} trades imported</p>
        </div>
      ) : (
        <>
          {/* Instructions */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-2">📱 How to Export from MT5:</h3>
            <ol className="text-dark-200 text-xs space-y-2">
              <li>1. Open MT5 app → Go to <span className="text-accent-400">History</span> tab</li>
              <li>2. Tap the <span className="text-accent-400">⋮</span> menu → Select <span className="text-accent-400">Statement</span></li>
              <li>3. Choose date range → Tap <span className="text-accent-400">Share</span> or <span className="text-accent-400">Copy</span></li>
              <li>4. Paste the content below or upload the file</li>
            </ol>
          </div>

          {/* Upload Area */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-3 rounded-xl glass border border-accent-500/30 flex items-center justify-center gap-2 text-accent-400"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="text-center text-dark-400 text-xs mb-3">— or paste below —</div>

            <textarea
              rows={6}
              placeholder="Paste MT5 statement here...&#10;&#10;Or use simple format:&#10;EURUSD, Buy, 1.0850, 1.0800, 1.0950, 0.5, 125.50&#10;GBPUSD, Sell, 1.2700, 1.2750, 1.2600, 0.3, -50.00"
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full !rounded-xl !text-xs"
            />

            {error && (
              <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!pasteData.trim()}
              className="w-full mt-3 py-3 rounded-xl gradient-bg text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Parse Trades
            </button>
          </div>

          {/* Parsed Trades Preview */}
          {parsedTrades.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">📊 Found {parsedTrades.length} Trades</h3>
                <button
                  onClick={() => setParsedTrades([])}
                  className="text-xs text-dark-400"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parsedTrades.map((trade, i) => (
                  <div key={i} className="bg-dark-700/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{trade.pair}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          trade.position === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {trade.position}
                        </span>
                      </div>
                      <p className="text-dark-400 text-[10px]">
                        Lot: {trade.lotSize} · Entry: {trade.entry || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        trade.result === "Win" ? "text-green-400" : trade.result === "Loss" ? "text-red-400" : "text-gray-400"
                      }`}>
                        {trade.result === "Win" ? `+$${trade.profit}` : trade.result === "Loss" ? `-$${trade.loss}` : "$0"}
                      </p>
                      <p className={`text-[10px] ${
                        trade.result === "Win" ? "text-green-400" : trade.result === "Loss" ? "text-red-400" : "text-gray-400"
                      }`}>
                        {trade.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full mt-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Import {parsedTrades.length} Trades
                  </>
                )}
              </button>
            </div>
          )}

          {/* Simple Format Guide */}
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-2">✍️ Manual Format</h3>
            <p className="text-dark-300 text-xs mb-2">You can also paste trades in this simple format:</p>
            <div className="bg-dark-700/50 rounded-lg p-3 font-mono text-[10px] text-dark-200">
              Symbol, Position, Entry, SL, TP, Lot, Profit<br/>
              <span className="text-green-400">EURUSD, Buy, 1.0850, 1.0800, 1.0950, 0.5, 125.50</span><br/>
              <span className="text-red-400">GBPUSD, Sell, 1.2700, 1.2750, 1.2600, 0.3, -50.00</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
