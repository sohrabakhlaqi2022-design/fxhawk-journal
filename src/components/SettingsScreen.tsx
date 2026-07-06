"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Shield, Download, Upload, Trash2, Check, RefreshCw, Layers, HardDrive, Volume2, Camera } from "./icons";
import type { Account, Trade } from "@/lib/types";

interface StorageInfo {
  usedBytes: number;
  usedKB: number;
  usedMB: number;
  totalMB: number;
  usedPercent: number;
  remainingMB: number;
  totalItems: number;
  totalTradesCount: number;
  totalMissedCount: number;
  totalOffSessionCount: number;
  totalPhotos: number;
  totalVoiceNotes: number;
  estimatedRemainingTrades: number;
}

interface SettingsScreenProps {
  accounts: Account[];
  trades: Trade[];
  onClearData: () => void;
  onReload: () => Promise<void>;
}

export default function SettingsScreen({ accounts, trades, onClearData, onReload }: SettingsScreenProps) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [error, setError] = useState("");
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch storage stats
  const fetchStorageInfo = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const res = await fetch("/api/storage");
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch (e) {
      console.error("Storage fetch error:", e);
    } finally {
      setLoadingStorage(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo, trades]);

  // Cloud Export
  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Export failed");
      const backupData = await res.json();
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FXHawk-FullBackup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to generate backup file");
    } finally {
      setExporting(false);
    }
  };

  // Cloud Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupObj = JSON.parse(content);

        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backupObj),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Import failed");
        }

        setImportSuccess(true);
        await onReload();
        await fetchStorageInfo();
        setTimeout(() => {
          setImportSuccess(false);
        }, 3000);
      } catch (err) {
        console.error(err);
        setError("Invalid backup file or import error");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (confirm("⚠️ Delete ALL data? This will clear all accounts, trades, photos, and voice notes!")) {
      if (confirm("Are you REALLY sure? This action cannot be undone!")) {
        await onClearData();
        await fetchStorageInfo();
      }
    }
  };

  // Calculate total stats
  const totalProfit = trades.reduce((sum, t) => sum + parseFloat(t.profit || "0"), 0);
  const totalLoss = trades.reduce((sum, t) => sum + parseFloat(t.loss || "0"), 0);
  const netProfit = totalProfit - totalLoss;

  return (
    <div className="pb-28 pt-4 px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-5 animate-fade-in">⚙️ Settings</h1>

      {/* Cloud & Storage Usage Indicator Card */}
      <div className="glass-card rounded-2xl p-4 mb-4 border border-accent-500/30 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Cloud Storage Usage</h3>
              <p className="text-green-400 text-[10px] font-medium">☁️ Neon Cloud Database</p>
            </div>
          </div>
          <button
            onClick={fetchStorageInfo}
            className="w-7 h-7 rounded-lg glass flex items-center justify-center text-dark-300 hover:text-white"
            title="Refresh Storage Info"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStorage ? "animate-spin text-accent-400" : ""}`} />
          </button>
        </div>

        {/* Storage Progress Bar */}
        {storageInfo && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-dark-200 font-medium">Used Space:</span>
                <span className="text-white font-bold">
                  {storageInfo.usedMB < 0.1 ? `${storageInfo.usedKB.toFixed(1)} KB` : `${storageInfo.usedMB.toFixed(2)} MB`}
                  <span className="text-dark-300 font-normal"> / {storageInfo.totalMB} MB ({storageInfo.usedPercent}%)</span>
                </span>
              </div>

              {/* Bar */}
              <div className="h-3 w-full bg-dark-700/60 rounded-full overflow-hidden p-0.5 border border-dark-600/40">
                <div
                  className="h-full rounded-full gradient-bg transition-all duration-500"
                  style={{ width: `${Math.max(storageInfo.usedPercent, 1.5)}%` }}
                />
              </div>
            </div>

            {/* Storage Breakdown Details */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-600/30">
              <div className="bg-dark-700/30 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-accent-400 mb-0.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-white text-xs font-bold">{storageInfo.totalPhotos}</span>
                </div>
                <p className="text-dark-300 text-[9px] uppercase">Photos</p>
              </div>

              <div className="bg-dark-700/30 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-white text-xs font-bold">{storageInfo.totalVoiceNotes}</span>
                </div>
                <p className="text-dark-300 text-[9px] uppercase">Audio Notes</p>
              </div>

              <div className="bg-dark-700/30 rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-green-400 mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-white text-xs font-bold">{storageInfo.remainingMB.toFixed(0)} MB</span>
                </div>
                <p className="text-dark-300 text-[9px] uppercase">Free Space</p>
              </div>
            </div>

            {/* Estimated Trades Capacity */}
            <div className="bg-accent-500/10 rounded-xl p-3 border border-accent-500/20 flex items-center justify-between">
              <p className="text-dark-200 text-xs">Estimated Remaining Trades Capacity:</p>
              <span className="text-accent-400 font-bold text-sm">
                ~{storageInfo.estimatedRemainingTrades.toLocaleString()} trades
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">📊 Total Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-dark-300 text-[10px] uppercase">Accounts</p>
            <p className="text-accent-400 text-lg font-bold">{accounts.length}</p>
          </div>
          <div className="text-center">
            <p className="text-dark-300 text-[10px] uppercase">Trades</p>
            <p className="text-white text-lg font-bold">{trades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-dark-300 text-[10px] uppercase">Net P/L</p>
            <p className={`text-lg font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${netProfit.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Full Backup & Restore (File) */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="text-white font-semibold text-sm mb-1">💾 Export / Import Backup File</h3>
        <p className="text-dark-300 text-xs mb-3">
          Download a complete backup file containing all accounts, trades, photos, and audio notes to keep as a physical backup or restore on another phone.
        </p>

        {error && (
          <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {importSuccess && (
          <div className="p-3 mb-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            Backup restored successfully! All photos, audio, and trades restored.
          </div>
        )}

        <div className="space-y-2">
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Full Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Full Backup File (.json)
              </>
            )}
          </button>

          {/* Import button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full py-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-accent-500/20 transition-all disabled:opacity-50"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Restoring Backup...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import & Restore Backup File
              </>
            )}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">ℹ️ App Info</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">App Version</span>
            <span className="text-dark-300 text-sm">2.2.0</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Cloud Database</span>
            <span className="text-green-400 text-sm font-medium">Neon PostgreSQL (500 MB)</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Photos & Audio Storage</span>
            <span className="text-green-400 text-sm font-medium">Base64 Cloud Stored</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-4 mb-4 border border-red-500/20 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-red-400 font-semibold text-sm mb-3">⚠️ Danger Zone</h3>
        <button
          onClick={handleClearData}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete All Trades & Data
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <p className="text-dark-400 text-xs">FX Hawk Journal v2.2.0</p>
        <p className="text-dark-500 text-[10px] mt-1">Made with 💜 for Professional Traders</p>
      </div>
    </div>
  );
}
