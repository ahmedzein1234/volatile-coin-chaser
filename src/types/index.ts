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

export interface Stochastic {
  k: number;
  d: number;
}

export interface IchimokuCloud {
  tenkanSen: number;
  kijunSen: number;
  senkouSpanA: number;
  senkouSpanB: number;
  chikouSpan: number;
  cloudTop: number;
  cloudBottom: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface VolumeProfile {
  valueAreaHigh: number;
  valueAreaLow: number;
  pointOfControl: number;
  volumeAtPrice: Map<number, number>;
  valueAreaVolume: number;
  totalVolume: number;
}

export interface SmartMoney {
  cvd: number; // Cumulative Volume Delta
  delta: number; // Buy vs Sell pressure
  orderFlow: number; // Order flow imbalance
  smartMoneyIndex: number; // Smart money indicator
  institutionalFlow: number; // Institutional flow
}

export interface OrderBookData {
  bidAskSpread: number;
  bidDepth: number;
  askDepth: number;
  imbalanceRatio: number;
  liquidityScore: number;
  depthPressure: number;
}

export interface LiquidityIndicators {
  spread: number;
  depth: number;
  flow: number;
  efficiency: number;
  impact: number;
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
  // New advanced indicators
  mfi: number;
  adLine: number;
  parabolicSAR: number;
  stochastic: Stochastic;
  // Professional-grade indicators
  ichimoku: IchimokuCloud;
  volumeProfile: VolumeProfile;
  garchVolatility: number;
  fractalDimension: number;
  hurstExponent: number;
  // Smart money & liquidity
  smartMoney: SmartMoney;
  orderBook: OrderBookData;
  liquidity: LiquidityIndicators;
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

