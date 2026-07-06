// Local Storage based database - works completely offline!
import type { Trade, Account } from "./types";

const TRADES_KEY = "fxhawk_trades";
const ACCOUNTS_KEY = "fxhawk_accounts";

// Generate unique ID
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ============ ACCOUNTS ============

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAccount(account: Partial<Account>): Account {
  const accounts = getAccounts();
  const newAccount: Account = {
    id: generateId(),
    name: account.name || "Account",
    broker: account.broker || null,
    initialBalance: account.initialBalance || "10000",
    currency: account.currency || "USD",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  accounts.unshift(newAccount);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return newAccount;
}

export function updateAccount(id: number, data: Partial<Account>): Account | null {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) return null;
  
  accounts[index] = {
    ...accounts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return accounts[index];
}

export function deleteAccount(id: number): boolean {
  const accounts = getAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  if (filtered.length === accounts.length) return false;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));
  return true;
}

// ============ TRADES ============

export function getTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(TRADES_KEY);
    const trades = data ? JSON.parse(data) : [];
    // Sort by date descending
    return trades.sort((a: Trade, b: Trade) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export function saveTrade(trade: Partial<Trade>): Trade {
  const trades = getTrades();
  const newTrade: Trade = {
    id: generateId(),
    userId: 1,
    accountId: trade.accountId || null,
    pair: trade.pair || "",
    date: trade.date || new Date().toISOString(),
    session: trade.session || null,
    position: trade.position || "Buy",
    entry: trade.entry || null,
    stopLoss: trade.stopLoss || null,
    takeProfit: trade.takeProfit || null,
    riskPercent: trade.riskPercent || null,
    reward: trade.reward || null,
    rr: trade.rr || null,
    lotSize: trade.lotSize || null,
    result: trade.result || "Win",
    profit: trade.profit || "0",
    loss: trade.loss || "0",
    commission: trade.commission || "0",
    notes: trade.notes || null,
    psychologyNotes: trade.psychologyNotes || null,
    mistakes: trade.mistakes || null,
    lessonsLearned: trade.lessonsLearned || null,
    checklist: trade.checklist || null,
    emotionBefore: trade.emotionBefore || null,
    emotionAfter: trade.emotionAfter || null,
    tags: trade.tags || null,
    strategyName: trade.strategyName || null,
    market: trade.market || null,
    timeframe: trade.timeframe || null,
    broker: trade.broker || null,
    screenshotBefore: trade.screenshotBefore || null,
    screenshotAfter: trade.screenshotAfter || null,
    voiceNote: trade.voiceNote || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  trades.unshift(newTrade);
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  return newTrade;
}

export function updateTrade(id: number, data: Partial<Trade>): Trade | null {
  const trades = getTrades();
  const index = trades.findIndex((t) => t.id === id);
  if (index === -1) return null;
  
  trades[index] = {
    ...trades[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  return trades[index];
}

export function deleteTrade(id: number): boolean {
  const trades = getTrades();
  const filtered = trades.filter((t) => t.id !== id);
  if (filtered.length === trades.length) return false;
  localStorage.setItem(TRADES_KEY, JSON.stringify(filtered));
  return true;
}

// ============ EXPORT/IMPORT ============

export function exportAllData(): string {
  const data = {
    accounts: getAccounts(),
    trades: getTrades(),
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.accounts) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(data.accounts));
    }
    if (data.trades) {
      localStorage.setItem(TRADES_KEY, JSON.stringify(data.trades));
    }
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  localStorage.removeItem(TRADES_KEY);
  localStorage.removeItem(ACCOUNTS_KEY);
}
