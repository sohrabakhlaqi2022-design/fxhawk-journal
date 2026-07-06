export interface Trade {
  id: number;
  userId: number;
  accountId: number | null;
  pair: string;
  date: string;
  session: string | null;
  position: string;
  entry: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  riskPercent: string | null;
  reward: string | null;
  rr: string | null;
  lotSize: string | null;
  result: string;
  profit: string | null;
  loss: string | null;
  commission: string | null;
  notes: string | null;
  psychologyNotes: string | null;
  mistakes: string | null;
  lessonsLearned: string | null;
  checklist: string[] | null;
  emotionBefore: string | null;
  emotionAfter: string | null;
  tags: string[] | null;
  strategyName: string | null;
  market: string | null;
  timeframe: string | null;
  broker: string | null;
  screenshotBefore: string | null;
  screenshotAfter: string | null;
  voiceNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: number;
  name: string;
  broker: string | null;
  initialBalance: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  currency?: string;
  initialBalance?: string;
}

export interface MissedTrade {
  id: number;
  accountId: number | null;
  pair: string;
  date: string;
  session: string | null;
  position: string;
  entry: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  rr: string | null;
  potentialProfit: string | null;
  strategyName: string | null;
  market: string | null;
  timeframe: string | null;
  reason: string | null;
  category: string | null;
  screenshotAfter: string | null;
  notes: string | null;
  createdAt: string;
}

export interface OffSessionTrade {
  id: number;
  accountId: number | null;
  pair: string;
  date: string;
  tradeHour: number;
  tradeMinute: number;
  position: string;
  entry: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  rr: string | null;
  lotSize: string | null;
  result: string;
  profit: string | null;
  loss: string | null;
  commission: string | null;
  strategyName: string | null;
  market: string | null;
  timeframe: string | null;
  screenshotAfter: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TradeStats {
  totalTrades: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  avgRR: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
  winningStreak: number;
  losingStreak: number;
  largestWin: number;
  largestLoss: number;
  wins: number;
  losses: number;
  breakevens: number;
}
