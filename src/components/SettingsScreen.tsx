"use client";
import { useState, useRef } from "react";
import { Shield, DollarSign, Activity, Download, Upload, Trash2, Check, AlertTriangle } from "./icons";
import type { Account, Trade } from "@/lib/types";
import { createFullBackup, downloadBackup, restoreFullBackup, estimateBackupSize } from "@/lib/backup";

interface SettingsScreenProps {
  accounts: Account[];
  trades: Trade[];
  onClearData: () => void;
  mediaStats: { used: number; total: number; items: number };
}

export default function SettingsScreen({ accounts, trades, onClearData, mediaStats }: SettingsScreenProps) {
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backupSize, setBackupSize] = useState<{ textMB: number; mediaMB: number; totalMB: number } | null>(null);
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { json, size } = await createFullBackup();
      downloadBackup(json);
    } catch (err) {
      alert("Failed to create backup: " + String(err));
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) return;
    setImportStatus("Restoring...");
    const result = await restoreFullBackup(importData);
    setImportStatus(result.message);
    if (result.success) {
      setImportSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleClearData = () => {
    if (confirm("⚠️ Delete ALL data? This cannot be undone!")) {
      if (confirm("Are you REALLY sure? All trades, media, and accounts will be deleted!")) {
        onClearData();
      }
    }
  };

  const checkBackupSize = async () => {
    const size = await estimateBackupSize();
    setBackupSize(size);
    setShowBackupInfo(true);
  };

  const totalProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || "0"), 0);
  const totalLoss = trades.reduce((sum, t) => sum + parseFloat(t.loss || "0"), 0);
  const netProfit = totalProfit - totalLoss;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-5 animate-fade-in">⚙️ Settings</h1>

      {/* Stats Summary */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
        <h3 className="text-white font-semibold text-sm mb-3">📊 Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase">Accounts</p><p className="text-accent-400 text-lg font-bold">{accounts.length}</p></div>
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase">Trades</p><p className="text-white text-lg font-bold">{trades.length}</p></div>
          <div className="text-center"><p className="text-dark-300 text-[10px] uppercase">Net P/L</p><p className={`text-lg font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>${netProfit.toFixed(0)}</p></div>
        </div>
      </div>

      {/* ===== FULL BACKUP SECTION ===== */}
      <div className="glass-card rounded-2xl p-4 mb-4 border border-accent-500/30 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">💾 Full Backup (with Images & Voice)</h3>
        
        {/* Backup Size Info */}
        {!showBackupInfo ? (
          <button onClick={checkBackupSize} className="w-full mb-3 py-2 rounded-xl glass text-dark-200 text-xs">
            Check backup size first
          </button>
        ) : backupSize && (
          <div className="bg-dark-700/30 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-dark-200">📝 Text Data</span>
              <span className="text-dark-300">{backupSize.textMB} MB</span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-dark-200">📸 Images & 🎙️ Voice</span>
              <span className="text-dark-300">{backupSize.mediaMB} MB</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-dark-600">
              <span className="text-white">Total Backup Size</span>
              <span className="text-accent-400">{backupSize.totalMB} MB</span>
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mb-2"
        >
          {exporting ? (
            <><div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> Creating backup...</>
          ) : (
            <><Download className="w-4 h-4" /> Export Full Backup (JSON)</>
          )}
        </button>

        <p className="text-dark-400 text-[10px] text-center mb-3">
          ✅ Contains all trades + accounts + media (images & voice notes)
        </p>

        {/* Import */}
        {!showImport ? (
          <button onClick={() => setShowImport(true)} className="w-full py-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-medium flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" /> Restore Backup
          </button>
        ) : importSuccess ? (
          <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Restored! Reloading...
          </div>
        ) : (
          <div className="space-y-2">
            {importStatus && !importSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-500/10 border border-accent-500/30">
                <AlertTriangle className="w-4 h-4 text-accent-400 flex-shrink-0" />
                <span className="text-accent-400 text-xs">{importStatus}</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl glass text-dark-200 text-sm font-medium">
              {importData ? "✅ File selected" : "Select backup file..."}
            </button>
            {importData && (
              <button onClick={handleImport} className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold">
                Restore Everything
              </button>
            )}
            <button onClick={() => { setShowImport(false); setImportData(""); setImportStatus(null); }} className="w-full py-2 rounded-xl glass text-dark-300 text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Hybrid Storage Info */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">💾 Hybrid Storage</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">📝 Trade Data</span>
            <span className="text-green-400 text-sm font-medium">☁️ Neon Cloud</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">📸 Images & 🎙️ Voice</span>
            <span className="text-accent-400 text-sm font-medium">📱 Your Device</span>
          </div>
          <div className="bg-dark-700/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-dark-100 text-sm">📸 Media Storage</span>
              <span className={`text-sm font-medium ${mediaStats.used > 40 ? "text-red-400" : "text-green-400"}`}>{mediaStats.used}MB / {mediaStats.total}MB</span>
            </div>
            <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${mediaStats.used > 40 ? "bg-red-400" : "bg-accent-400"}`} style={{ width: `${Math.min((mediaStats.used / mediaStats.total) * 100, 100)}%` }} />
            </div>
            <p className="text-dark-400 text-[10px] mt-1">{mediaStats.items} images & voice notes</p>
          </div>
        </div>
        <p className="text-dark-400 text-[10px] mt-3 text-center">
          🔄 Switch phones? Export backup on old phone → Import on new phone
        </p>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">ℹ️ About</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Version</span>
            <span className="text-dark-300 text-sm">2.0.0</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Theme</span>
            <span className="text-dark-300 text-sm">Dark</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Database</span>
            <span className="text-green-400 text-sm">Neon Cloud ☁️</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-4 mb-4 border border-red-500/20 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="text-red-400 font-semibold text-sm mb-3">⚠️ Danger Zone</h3>
        <button onClick={handleClearData} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete All Data
        </button>
      </div>

      <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <p className="text-dark-400 text-xs">FX Hawk Journal v2.0.0</p>
        <p className="text-dark-500 text-[10px] mt-1">Made with 💜 for Traders</p>
      </div>
    </div>
  );
}
