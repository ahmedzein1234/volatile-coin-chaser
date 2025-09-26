export interface Coin {
  symbol: string;
  volatility: 'low' | 'medium' | 'high';
  addedDate: string;
  isActive: boolean;
}

export interface Position {
  symbol: string;
  entryPrice: number;
  entryTime: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  trailingStop: number;
  peakPrice: number;
  entryVolume: number;
  entryATR: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: number;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
}

export interface Indicators {
  rsi: number;
  macd: MACD;
  williamsR: number;
  cci: number;
  roc: number;
  obv: number;
  vpt: number;
  atr: number;
  atrPercentile: number;
  bbSqueeze: boolean;
  keltnerTouch: boolean;
  rvi: number;
  rviSignal: number;
  uo: number;
  volume: number;
  volumeSMA: number;
  volumeDrop: number;
}

export interface Trade {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  profit?: number;
  reason: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface DailyCoinsData {
  date: string;
  coins: Coin[];
}

export interface Config {
  binance: {
    apiKey: string;
    secretKey: string;
    testnet: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  trading: {
    maxPositions: number;
    maxRiskPerTrade: number;
    maxPortfolioRisk: number;
    maxPortfolioUSDT: number;
    maxRiskPerTradeUSDT: number;
    maxDrawdown: number;
  };
  logging: {
    level: string;
    file: string;
  };
}

export interface EntryScore {
  total: number;
  momentum: number;
  volume: number;
  volatility: number;
  range: number;
}

export interface ExitReason {
  reason: string;
  priority: number;
  triggered: boolean;
}

