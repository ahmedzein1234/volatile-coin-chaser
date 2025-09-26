import { PriceData, Indicators } from '../types';
import { IndicatorCalculator } from './calculator';
import logger from '../services/logger';

export class RealtimeIndicatorEngine {
  private priceHistory: Map<string, PriceData[]> = new Map();
  private indicatorCache: Map<string, Indicators> = new Map();
  private calculator: IndicatorCalculator;
  private maxHistoryLength = 200; // Keep last 200 data points

  constructor() {
    this.calculator = new IndicatorCalculator();
  }

  updateIndicators(symbol: string, newPrice: PriceData): void {
    try {
      // Get or create price history for this symbol
      let history = this.priceHistory.get(symbol) || [];
      
      // Add new price data
      history.push(newPrice);
      
      // Keep only the last maxHistoryLength data points
      if (history.length > this.maxHistoryLength) {
        history = history.slice(-this.maxHistoryLength);
      }
      
      // Update the history
      this.priceHistory.set(symbol, history);
      
      // Calculate indicators if we have enough data
      if (history.length >= 50) {
        const indicators = this.calculator.calculateAllIndicators(history);
        this.indicatorCache.set(symbol, indicators);
        
        logger.debug(`Updated indicators for ${symbol}: RSI=${indicators.rsi.toFixed(2)}, WilliamsR=${indicators.williamsR.toFixed(2)}, CCI=${indicators.cci.toFixed(2)}`);
      }
    } catch (error) {
      logger.error(`Error updating indicators for ${symbol}:`, error);
    }
  }

  getIndicators(symbol: string): Indicators | null {
    return this.indicatorCache.get(symbol) || null;
  }

  getPriceHistory(symbol: string): PriceData[] {
    return this.priceHistory.get(symbol) || [];
  }

  hasEnoughData(symbol: string): boolean {
    const history = this.priceHistory.get(symbol);
    return history ? history.length >= 50 : false;
  }

  clearHistory(symbol: string): void {
    this.priceHistory.delete(symbol);
    this.indicatorCache.delete(symbol);
    logger.info(`Cleared history for ${symbol}`);
  }

  clearAllHistory(): void {
    this.priceHistory.clear();
    this.indicatorCache.clear();
    logger.info('Cleared all price history and indicators');
  }

  getSymbols(): string[] {
    return Array.from(this.priceHistory.keys());
  }

  getHistoryLength(symbol: string): number {
    const history = this.priceHistory.get(symbol);
    return history ? history.length : 0;
  }

  // Get the latest price for a symbol
  getLatestPrice(symbol: string): PriceData | null {
    const history = this.priceHistory.get(symbol);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  // Get price change percentage over a period
  getPriceChange(symbol: string, periods: number = 1): number {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < periods + 1) return 0;
    
    const currentPrice = history[history.length - 1].price;
    const pastPrice = history[history.length - 1 - periods].price;
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  // Get volume change percentage
  getVolumeChange(symbol: string, periods: number = 1): number {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < periods + 1) return 0;
    
    const currentVolume = history[history.length - 1].volume;
    const pastVolume = history[history.length - 1 - periods].volume;
    
    return ((currentVolume - pastVolume) / pastVolume) * 100;
  }

  // Check if price is making new highs/lows
  isNewHigh(symbol: string, periods: number = 20): boolean {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < periods + 1) return false;
    
    const currentPrice = history[history.length - 1].price;
    const recentPrices = history.slice(-periods - 1, -1).map(p => p.price);
    
    return currentPrice > Math.max(...recentPrices);
  }

  isNewLow(symbol: string, periods: number = 20): boolean {
    const history = this.priceHistory.get(symbol);
    if (!history || history.length < periods + 1) return false;
    
    const currentPrice = history[history.length - 1].price;
    const recentPrices = history.slice(-periods - 1, -1).map(p => p.price);
    
    return currentPrice < Math.min(...recentPrices);
  }
}

