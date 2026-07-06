"use client";
import { useState, useEffect, useCallback } from "react";
import Dashboard from "@/components/Dashboard";
import AddTrade from "@/components/AddTrade";
import TradeDetail from "@/components/TradeDetail";
import Analytics from "@/components/Analytics";
import CalendarView from "@/components/CalendarView";
import SearchFilter from "@/components/SearchFilter";
import SettingsScreen from "@/components/SettingsScreen";
import AccountsScreen from "@/components/AccountsScreen";
import MT5Import, { ParsedTrade } from "@/components/MT5Import";
import MissedTrades from "@/components/MissedTrades";
import OffSessionTrades from "@/components/OffSessionTrades";
import BottomNav from "@/components/BottomNav";
import type { Trade, Account, MissedTrade, OffSessionTrade } from "@/lib/types";

type Screen = "dashboard" | "add" | "analytics" | "calendar" | "search" | "settings" | "detail" | "edit" | "accounts" | "mt5import" | "missed" | "offsession";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)" }}>
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center animate-pulse-glow"><svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
        <h1 className="text-xl font-bold gradient-text">FX Hawk Journal</h1>
        <p className="text-dark-300 text-sm mt-2">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>([]);
  const [offSessionTrades, setOffSessionTrades] = useState<OffSessionTrade[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [importingAccountId, setImportingAccountId] = useState<number | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  const filteredTrades = selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;

  // Full reload from DB
  const reloadAll = useCallback(async () => {
    try {
      const [a, t, m, o] = await Promise.all([
        fetch("/api/accounts"), fetch("/api/trades/all"), fetch("/api/missed"), fetch("/api/offsession"),
      ]);
      if (a.ok) setAccounts((await a.json()).accounts || []);
      if (t.ok) setTrades((await t.json()).trades || []);
      if (m.ok) setMissedTrades((await m.json()).missedTrades || []);
      if (o.ok) setOffSessionTrades((await o.json()).offSessionTrades || []);
    } catch (err) { console.error("Reload error:", err); }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try { await fetch("/api/seed", { method: "POST" }); } catch {}
      await reloadAll();
      setLoading(false);
    })();
  }, [reloadAll]);

  // ===== ACCOUNT =====
  const handleSaveAccount = async (data: Partial<Account>) => {
    const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
    const { account } = await res.json();
    await reloadAll();
    return account;
  };
  const handleUpdateAccount = async (id: number, data: Partial<Account>) => {
    const res = await fetch(`/api/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed");
    await reloadAll();
  };
  const handleDeleteAccount = async (id: number) => {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (selectedAccountId === id) setSelectedAccountId(null);
    await reloadAll();
  };
  const handleStartImport = (accountId: number) => { setImportingAccountId(accountId); setScreen("mt5import"); };
  const handleImportTrades = async (parsedTrades: ParsedTrade[]) => {
    if (!importingAccountId) return;
    for (const pt of parsedTrades) {
      await fetch("/api/trades/all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: importingAccountId, ...pt }) });
    }
    await reloadAll();
  };

  // ===== TRADE =====
  const handleSaveTrade = async (data: Partial<Trade>) => {
    const res = await fetch("/api/trades/all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json();
    if (!res.ok || !json.trade) throw new Error(json.error || "Failed to save trade");
    await reloadAll();
  };
  const handleUpdateTrade = async (data: Partial<Trade>) => {
    if (!selectedTrade) return;
    const res = await fetch(`/api/trades/all/${selectedTrade.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update");
    const { trade } = await res.json();
    setSelectedTrade(trade);
    setScreen("detail");
    await reloadAll();
  };
  const handleDeleteTrade = async (id: number) => {
    await fetch(`/api/trades/all/${id}`, { method: "DELETE" });
    setScreen("dashboard");
    setSelectedTrade(null);
    await reloadAll();
  };

  // ===== MISSED =====
  const handleSaveMissed = async (data: Partial<MissedTrade>) => {
    const res = await fetch("/api/missed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed");
    await reloadAll();
  };
  const handleDeleteMissed = async (id: number) => {
    await fetch(`/api/missed/${id}`, { method: "DELETE" });
    await reloadAll();
  };

  // ===== OFF-SESSION =====
  const handleSaveOffSession = async (data: Partial<OffSessionTrade>) => {
    const res = await fetch("/api/offsession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed");
    await reloadAll();
  };
  const handleDeleteOffSession = async (id: number) => {
    await fetch(`/api/offsession/${id}`, { method: "DELETE" });
    await reloadAll();
  };

  const handleViewTrade = (trade: Trade) => { setSelectedTrade(trade); setScreen("detail"); };
  const handleEditTrade = (trade: Trade) => { setSelectedTrade(trade); setScreen("edit"); };

  if (loading) return <LoadingScreen />;
  const importingAccount = accounts.find(a => a.id === importingAccountId);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)" }}>
      {!["add","detail","edit","accounts","mt5import","missed","offsession"].includes(screen) && (
        <div className="sticky top-0 z-30 glass-strong border-b border-dark-600/30">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div><span className="text-white font-bold text-sm">FX Hawk</span></div>
            <span className="text-green-400 text-[10px]">🟢 Online</span>
          </div>
        </div>
      )}

      {screen === "dashboard" && <Dashboard trades={trades} accounts={accounts} selectedAccountId={selectedAccountId} onViewTrade={handleViewTrade} onSelectAccount={setSelectedAccountId} onManageAccounts={() => setScreen("accounts")} />}
      {screen === "accounts" && <AccountsScreen accounts={accounts} onBack={() => setScreen("dashboard")} onSave={handleSaveAccount} onUpdate={handleUpdateAccount} onDelete={handleDeleteAccount} onImport={handleStartImport} />}
      {screen === "mt5import" && importingAccount && <MT5Import account={importingAccount} onBack={() => setScreen("accounts")} onImport={handleImportTrades} />}
      {screen === "add" && <AddTrade onBack={() => setScreen("dashboard")} onSave={handleSaveTrade} accounts={accounts} defaultAccountId={selectedAccountId} />}
      {screen === "edit" && selectedTrade && <AddTrade onBack={() => setScreen("detail")} onSave={handleUpdateTrade} editTrade={selectedTrade} accounts={accounts} defaultAccountId={selectedAccountId} />}
      {screen === "detail" && selectedTrade && <TradeDetail trade={selectedTrade} onBack={() => setScreen("dashboard")} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />}
      {screen === "analytics" && <Analytics trades={filteredTrades} accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} />}
      {screen === "calendar" && <CalendarView trades={filteredTrades} accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} onViewTrade={handleViewTrade} />}
      {screen === "missed" && <MissedTrades missedTrades={missedTrades} accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} onSave={handleSaveMissed} onDelete={handleDeleteMissed} onBack={() => setScreen("dashboard")} />}
      {screen === "offsession" && <OffSessionTrades offSessionTrades={offSessionTrades} accounts={accounts} selectedAccountId={selectedAccountId} onSelectAccount={setSelectedAccountId} onSave={handleSaveOffSession} onDelete={handleDeleteOffSession} onBack={() => setScreen("dashboard")} />}
      {screen === "settings" && <SettingsScreen accounts={accounts} trades={trades} onClearData={async () => {
        // Clear all trades in DB
        for (const t of trades) {
          await fetch(`/api/trades/all/${t.id}`, { method: "DELETE" });
        }
        for (const m of missedTrades) {
          await fetch(`/api/missed/${m.id}`, { method: "DELETE" });
        }
        for (const o of offSessionTrades) {
          await fetch(`/api/offsession/${o.id}`, { method: "DELETE" });
        }
        await reloadAll();
      }} onReload={reloadAll} />}
      <BottomNav active={screen} onNavigate={setScreen} />
    </div>
  );
}
