"use client";
import { useState, useRef } from "react";
import { Shield, DollarSign, Activity, Download, Upload, Trash2, Check } from "./icons";
import type { Account, Trade } from "@/lib/types";
import { exportAllData, importAllData } from "@/lib/storage";

interface SettingsScreenProps {
  accounts: Account[];
  trades: Trade[];
  onClearData: () => void;
}

export default function SettingsScreen({ accounts, trades, onClearData }: SettingsScreenProps) {
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fxhawk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const handleImport = () => {
    if (importAllData(importData)) {
      setImportSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      alert("Invalid backup file");
    }
  };

  const handleClearData = () => {
    if (confirm("⚠️ Delete ALL data? This cannot be undone!")) {
      if (confirm("Are you REALLY sure? All trades and accounts will be deleted!")) {
        onClearData();
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

      {/* Stats Summary */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up">
        <h3 className="text-white font-semibold text-sm mb-3">📊 Summary</h3>
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

      {/* Backup & Restore */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">💾 Backup & Restore</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Backup (JSON)
          </button>

          {!showImport ? (
            <button
              onClick={() => setShowImport(true)}
              className="w-full py-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Backup
            </button>
          ) : importSuccess ? (
            <div className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Imported! Reloading...
            </div>
          ) : (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl glass text-dark-200 text-sm font-medium"
              >
                Select backup file...
              </button>
              {importData && (
                <button
                  onClick={handleImport}
                  className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold"
                >
                  Restore Backup
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Storage Info */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">📱 Storage</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Data Location</span>
            <span className="text-green-400 text-sm font-medium">Your Device</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Sync Required</span>
            <span className="text-accent-400 text-sm font-medium">No</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Works Offline</span>
            <span className="text-green-400 text-sm font-medium">✓ Yes</span>
          </div>
        </div>
        <p className="text-dark-400 text-[10px] mt-3 text-center">
          All data is stored locally on your device. Export backups regularly!
        </p>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-white font-semibold text-sm mb-3">ℹ️ About</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Version</span>
            <span className="text-dark-300 text-sm">1.0.0</span>
          </div>
          <div className="flex items-center justify-between bg-dark-700/30 rounded-xl p-3">
            <span className="text-dark-100 text-sm">Theme</span>
            <span className="text-dark-300 text-sm">Dark</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-4 mb-4 border border-red-500/20 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <h3 className="text-red-400 font-semibold text-sm mb-3">⚠️ Danger Zone</h3>
        <button
          onClick={handleClearData}
          className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete All Data
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        <p className="text-dark-400 text-xs">FX Hawk Journal v1.0.0</p>
        <p className="text-dark-500 text-[10px] mt-1">Made with 💜 for Traders</p>
      </div>
    </div>
  );
}
