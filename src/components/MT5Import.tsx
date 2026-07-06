"use client";
import { useState, useRef } from "react";
import { ChevronLeft, Upload, Check, AlertTriangle, RefreshCw, FileText, Link, Layers } from "./icons";
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

// Format Symbol (e.g. EURUSD -> EUR/USD, XAUUSD -> XAU/USD, NAS100 -> NAS100)
function formatSymbol(rawSymbol: string): string {
  if (!rawSymbol) return "EUR/USD";
  let s = rawSymbol.trim().toUpperCase().replace(/[^A-Z0-9/]/g, "");
  if (s.includes("/")) return s;
  
  // Standard 6-character forex pair (EURUSD -> EUR/USD)
  if (s.length === 6 && /^[A-Z]{6}$/.test(s)) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  
  // XAUUSD, XAGUSD, BTCUSD, ETHUSD
  if (s.length === 6 && (s.startsWith("XAU") || s.startsWith("XAG") || s.startsWith("BTC") || s.startsWith("ETH"))) {
    return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  
  return s;
}

// Parse Date string into ISO format
function parseDateString(rawDate: string): string {
  if (!rawDate) return new Date().toISOString();
  try {
    // Format YYYY.MM.DD HH:MM:SS -> YYYY-MM-DDTHH:MM:SS
    const normalized = rawDate.trim().replace(/\./g, "-").replace(" ", "T");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date().toISOString();
}

// Comprehensive MT5 HTML Parser for Desktop & Mobile Reports
function parseMT5HtmlReport(htmlContent: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const rows = doc.querySelectorAll("tr");
  if (rows.length === 0) return trades;

  let inPositionsSection = false;
  let inDealsSection = false;

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td, th")).map((c) => c.textContent?.trim() || "");
    const rowText = cells.join(" ").toLowerCase();

    // Check table section headers
    if (rowText.includes("positions") || rowText.includes("closed transactions")) {
      inPositionsSection = true;
      inDealsSection = false;
      return;
    }
    if (rowText.includes("orders") || rowText.includes("working orders")) {
      inPositionsSection = false;
      inDealsSection = false;
      return;
    }
    if (rowText.includes("deals") || rowText.includes("history")) {
      inPositionsSection = false;
      inDealsSection = true;
      return;
    }

    // Try parsing a Position row (MT5 Desktop / Mobile Report)
    // Typical MT5 Positions row:
    // Time | Position | Symbol | Type (buy/sell) | Volume | Price | S/L | T/P | Time | Price | Commission | Swap | Profit
    const buySellIdx = cells.findIndex((c) => c.toLowerCase() === "buy" || c.toLowerCase() === "sell");

    if (buySellIdx >= 0 && cells.length >= 8) {
      const positionType = cells[buySellIdx].toLowerCase() === "buy" ? "Buy" : "Sell";
      
      // Symbol is usually right before or right after buy/sell
      let symbol = "";
      if (buySellIdx > 0 && /^[A-Z0-9/.#_-]{3,12}$/i.test(cells[buySellIdx - 1])) {
        symbol = cells[buySellIdx - 1];
      } else if (buySellIdx < cells.length - 1 && /^[A-Z0-9/.#_-]{3,12}$/i.test(cells[buySellIdx + 1])) {
        symbol = cells[buySellIdx + 1];
      } else {
        const symbolCell = cells.find((c) => /^[A-Z0-9]{6}$/i.test(c) || /^[A-Z0-9]{3}\/[A-Z0-9]{3}$/i.test(c) || /^(XAU|XAG|NAS|US30|SPX|BTC|ETH)/i.test(c));
        if (symbolCell) symbol = symbolCell;
      }

      if (symbol) {
        // Date: usually in the first or second cell
        const dateCell = cells.find((c) => /\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(c));
        const tradeDate = parseDateString(dateCell || "");

        // Volume / Lot Size: numeric value usually near buy/sell
        const numbers = cells.map((c) => c.replace(/\s/g, "")).filter((c) => /^-?\d+\.?\d*$/.test(c));
        const lotSize = numbers.find((n) => parseFloat(n) > 0 && parseFloat(n) <= 100) || "0.01";

        // Entry Price & Profit
        // Profit is almost always the LAST numeric cell in the row
        let profitVal = "0";
        if (numbers.length > 0) {
          profitVal = numbers[numbers.length - 1];
        }

        const profitNum = parseFloat(profitVal) || 0;
        const result = profitNum > 0 ? "Win" : profitNum < 0 ? "Loss" : "Breakeven";

        // Entry, Stop Loss, Take Profit
        const entryPrice = numbers.length >= 2 ? numbers[1] : "";
        const slPrice = cells.find((c) => c !== "0" && c !== "0.00" && c !== "0.00000" && /^\d+\.\d+$/.test(c)) || "";
        
        // Calculate RR if SL and Entry are present
        let rrVal = "";
        if (entryPrice && slPrice) {
          const entryNum = parseFloat(entryPrice);
          const slNum = parseFloat(slPrice);
          const risk = Math.abs(entryNum - slNum);
          if (risk > 0 && Math.abs(profitNum) > 0) {
            rrVal = (Math.abs(profitNum) / (risk * 100)).toFixed(1);
          }
        }

        trades.push({
          pair: formatSymbol(symbol),
          position: positionType,
          date: tradeDate,
          entry: entryPrice,
          stopLoss: slPrice,
          takeProfit: "",
          lotSize,
          profit: profitNum > 0 ? Math.abs(profitNum).toString() : "0",
          loss: profitNum < 0 ? Math.abs(profitNum).toString() : "0",
          commission: "0",
          result,
          rr: rrVal,
        });
      }
    }
  });

  return trades;
}

// Fallback Text / CSV / Simple Format Parser
function parseMT5TextReport(text: string): ParsedTrade[] {
  const trades: ParsedTrade[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const parts = line.includes("\t")
      ? line.split("\t")
      : line.split(/[,;|]/);

    if (parts.length >= 3) {
      const trimmedParts = parts.map((p) => p.trim());

      // Find Position Type (Buy/Sell)
      const typeIdx = trimmedParts.findIndex((p) => /^(buy|sell)$/i.test(p));
      if (typeIdx >= 0) {
        const position = trimmedParts[typeIdx].toLowerCase() === "buy" ? "Buy" : "Sell";

        // Find Symbol
        const symbolCell = trimmedParts.find(
          (p) =>
            /^[A-Z0-9/]{3,12}$/i.test(p) &&
            !/^(buy|sell|win|loss|profit|total|balance)$/i.test(p)
        );

        if (symbolCell) {
          // Find Date
          const dateCell = trimmedParts.find((p) =>
            /\d{4}[.\-/]\d{2}[.\-/]\d{2}/.test(p)
          );
          const tradeDate = parseDateString(dateCell || "");

          // Find Numbers
          const numbers = trimmedParts.filter((p) =>
            /^-?\d+\.?\d*$/.test(p.replace(/\s/g, ""))
          );

          if (numbers.length > 0) {
            const lastNum = parseFloat(numbers[numbers.length - 1]) || 0;
            const lotSize =
              numbers.find((n) => parseFloat(n) > 0 && parseFloat(n) <= 100) ||
              "0.01";

            trades.push({
              pair: formatSymbol(symbolCell),
              position,
              date: tradeDate,
              entry: numbers[0] || "",
              stopLoss: "",
              takeProfit: "",
              lotSize,
              profit: lastNum > 0 ? Math.abs(lastNum).toString() : "0",
              loss: lastNum < 0 ? Math.abs(lastNum).toString() : "0",
              commission: "0",
              result:
                lastNum > 0 ? "Win" : lastNum < 0 ? "Loss" : "Breakeven",
              rr: "",
            });
          }
        }
      }
    }
  }

  return trades;
}

export default function MT5Import({ account, onBack, onImport }: MT5ImportProps) {
  const [pasteData, setPasteData] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    setError("");
    let trades: ParsedTrade[] = [];

    // Try HTML Report Parser
    if (pasteData.includes("<") && pasteData.includes(">")) {
      trades = parseMT5HtmlReport(pasteData);
    }

    // Fallback to Text / CSV Parser
    if (trades.length === 0) {
      trades = parseMT5TextReport(pasteData);
    }

    if (trades.length === 0) {
      setError("No trades could be parsed from the file/text. Make sure it's an MT5 HTML report or statement file.");
    } else {
      setParsedTrades(trades);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteData(content);

      // Auto parse on upload
      let trades: ParsedTrade[] = [];
      if (content.includes("<") && content.includes(">")) {
        trades = parseMT5HtmlReport(content);
      }
      if (trades.length === 0) {
        trades = parseMT5TextReport(content);
      }

      if (trades.length > 0) {
        setParsedTrades(trades);
      } else {
        setError("Could not parse trades automatically. Click 'Parse Trades' to try again.");
      }
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
      console.error(err);
      setError("Failed to import trades into database.");
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
          <h1 className="text-lg font-bold text-white">Import MetaTrader 5 Report</h1>
          <p className="text-dark-300 text-xs">{account.name}</p>
        </div>
      </div>

      {success ? (
        <div className="glass-card rounded-2xl p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-white font-bold text-lg">Import Successful!</h2>
          <p className="text-dark-300 text-sm mt-2">{parsedTrades.length} trades added to {account.name}</p>
        </div>
      ) : (
        <>
          {/* How to export HTML from MT5 */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-400" /> MT5 HTML Report Import
            </h3>
            <div className="text-dark-200 text-xs space-y-1.5 leading-relaxed">
              <p>1. Open <span className="text-white font-medium">MT5 Desktop or Mobile</span></p>
              <p>2. Go to <span className="text-accent-400 font-medium">History</span> tab</p>
              <p>3. Right-click / Menu ➔ <span className="text-accent-400 font-medium">Report ➔ HTML Statement</span></p>
              <p>4. Upload the <span className="text-white font-medium">.html</span> file below or paste its code!</p>
            </div>
          </div>

          {/* Upload Button */}
          <div className="glass-card rounded-2xl p-4 mb-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg glow"
            >
              <Upload className="w-5 h-5" />
              Upload MT5 HTML File (.html / .csv)
            </button>

            {fileName && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-700/50 border border-dark-600">
                <FileText className="w-4 h-4 text-accent-400" />
                <span className="text-xs text-white truncate flex-1">{fileName}</span>
                <button
                  onClick={() => { setFileName(""); setPasteData(""); setParsedTrades([]); }}
                  className="text-dark-400 text-xs hover:text-white"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="text-center text-dark-400 text-xs font-medium py-1">— or paste HTML / Statement code —</div>

            <textarea
              rows={5}
              placeholder="Paste HTML code or CSV statement text here..."
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full !rounded-xl !text-xs font-mono"
            />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!pasteData.trim()}
              className="w-full py-2.5 rounded-xl glass border border-accent-500/30 text-accent-400 text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Parse & Preview Trades
            </button>
          </div>

          {/* Parsed Trades Preview */}
          {parsedTrades.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">📊 Found {parsedTrades.length} Trades</h3>
                <button
                  onClick={() => setParsedTrades([])}
                  className="text-xs text-dark-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parsedTrades.map((trade, i) => (
                  <div key={i} className="bg-dark-700/40 rounded-xl p-3 flex items-center justify-between border border-dark-600/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{trade.pair}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          trade.position === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {trade.position}
                        </span>
                      </div>
                      <p className="text-dark-300 text-[10px] mt-0.5">
                        Lot: {trade.lotSize} · Entry: {trade.entry || "—"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        trade.result === "Win" ? "text-green-400" : trade.result === "Loss" ? "text-red-400" : "text-gray-400"
                      }`}>
                        {trade.result === "Win" ? `+$${trade.profit}` : trade.result === "Loss" ? `-$${trade.loss}` : "$0"}
                      </p>
                      <p className="text-[10px] text-dark-400">
                        {trade.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full mt-4 py-3.5 rounded-xl gradient-green text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg glow-green"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing to Database...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Import All {parsedTrades.length} Trades Now
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
