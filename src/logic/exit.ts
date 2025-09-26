import { Position, Indicators, ExitReason } from '../types';
import logger from '../services/logger';

export class ExitLogicEngine {
  
  shouldExit(position: Position, indicators: Indicators): ExitReason {
    const profit = this.calculateProfit(position);
    const holdTime = Date.now() - position.entryTime;
    const holdTimeMinutes = holdTime / (1000 * 60);

    // Priority 1: Profit targets (highest priority) - Fee-aware
    const totalFees = 0.002; // 0.2% Binance fees
    const minProfitableExit = totalFees + 0.003; // 0.5% minimum profit after fees
    
    if (profit >= minProfitableExit) { // 0.5% profit after fees
      return {
        reason: `Profit target reached: ${(profit * 100).toFixed(2)}% (after fees)`,
        priority: 1,
        triggered: true
      };
    }

    // Priority 2: Momentum exhaustion
    if (indicators.williamsR > -20) {
      return {
        reason: `Williams %R overbought: ${indicators.williamsR.toFixed(2)}`,
        priority: 2,
        triggered: true
      };
    }

    if (indicators.cci > 100) {
      return {
        reason: `CCI overbought: ${indicators.cci.toFixed(2)}`,
        priority: 2,
        triggered: true
      };
    }

    if (indicators.roc < -1) {
      return {
        reason: `ROC negative momentum: ${indicators.roc.toFixed(2)}`,
        priority: 2,
        triggered: true
      };
    }

    // Priority 3: Volume exhaustion
    if (indicators.volumeDrop < 0.5) {
      return {
        reason: `Volume exhaustion: ${(indicators.volumeDrop * 100).toFixed(1)}% of entry volume`,
        priority: 3,
        triggered: true
      };
    }

    // Priority 4: Volatility contraction
    if (indicators.atr < position.entryATR * 0.7) {
      return {
        reason: `Volatility contraction: ATR ${((indicators.atr / position.entryATR) * 100).toFixed(1)}% of entry`,
        priority: 4,
        triggered: true
      };
    }

    // Priority 5: Time limit
    if (holdTimeMinutes > 30) {
      return {
        reason: `Time limit reached: ${holdTimeMinutes.toFixed(1)} minutes`,
        priority: 5,
        triggered: true
      };
    }

    // Priority 6: RSI overbought
    if (indicators.rsi > 80) {
      return {
        reason: `RSI overbought: ${indicators.rsi.toFixed(2)}`,
        priority: 6,
        triggered: true
      };
    }

    // Priority 7: MACD bearish divergence
    if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      return {
        reason: `MACD bearish divergence`,
        priority: 7,
        triggered: true
      };
    }

    // Priority 8: Ultimate Oscillator overbought
    if (indicators.uo > 70) {
      return {
        reason: `Ultimate Oscillator overbought: ${indicators.uo.toFixed(2)}`,
        priority: 8,
        triggered: true
      };
    }

    // No exit conditions met
    return {
      reason: 'No exit conditions met',
      priority: 0,
      triggered: false
    };
  }

  calculateProfit(position: Position): number {
    // This will be updated with current price in the main engine
    return 0;
  }

  updateTrailingStop(position: Position, currentPrice: number): number {
    const profit = this.calculateProfit(position);
    
    // Progressive trailing stops based on profit
    if (profit >= 0.015) { // 1.5%
      return currentPrice * 0.992; // 0.8% trail
    } else if (profit >= 0.01) { // 1.0%
      return currentPrice * 0.995; // 0.5% trail
    } else if (profit >= 0.005) { // 0.5%
      return currentPrice * 0.997; // 0.3% trail
    }
    
    return position.trailingStop;
  }

  // Check if trailing stop should be triggered
  shouldTriggerTrailingStop(position: Position, currentPrice: number): boolean {
    const profit = this.calculateProfit(position);
    
    // Only use trailing stop if we're in profit
    if (profit <= 0) return false;
    
    // Update trailing stop
    const newTrailingStop = this.updateTrailingStop(position, currentPrice);
    
    // Trigger if price falls below trailing stop
    return currentPrice <= newTrailingStop;
  }

  // Get exit confidence level
  getExitConfidence(position: Position, indicators: Indicators): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    const exitReason = this.shouldExit(position, indicators);
    
    if (!exitReason.triggered) return 'LOW';
    
    // Higher priority = higher confidence
    if (exitReason.priority <= 2) return 'VERY_HIGH';
    if (exitReason.priority <= 4) return 'HIGH';
    if (exitReason.priority <= 6) return 'MEDIUM';
    return 'LOW';
  }

  // Check for exit divergence (price vs indicators)
  hasExitDivergence(position: Position, indicators: Indicators, priceHistory: any[]): boolean {
    if (priceHistory.length < 10) return false;

    const currentPrice = priceHistory[priceHistory.length - 1].price;
    const pastPrice = priceHistory[priceHistory.length - 5].price;
    
    // Price making higher highs but indicators making lower highs (bearish divergence)
    if (currentPrice > pastPrice && indicators.rsi < 70 && indicators.williamsR < -30) {
      return true;
    }

    return false;
  }

  // Get optimal exit timing
  getExitTiming(position: Position, indicators: Indicators): 'IMMEDIATE' | 'WAIT' | 'HOLD' {
    const exitReason = this.shouldExit(position, indicators);
    
    if (!exitReason.triggered) return 'HOLD';
    
    // Immediate exit for high priority reasons
    if (exitReason.priority <= 3) return 'IMMEDIATE';
    
    // Wait for better exit for lower priority reasons
    return 'WAIT';
  }

  // Calculate risk-reward ratio
  calculateRiskReward(position: Position, currentPrice: number): number {
    const profit = this.calculateProfit(position);
    const risk = Math.abs(currentPrice - position.stopLoss) / position.entryPrice;
    const reward = Math.abs(position.takeProfit - currentPrice) / position.entryPrice;
    
    if (risk === 0) return 0;
    return reward / risk;
  }

  // Check if position should be scaled out (partial exit)
  shouldScaleOut(position: Position, indicators: Indicators): boolean {
    const profit = this.calculateProfit(position);
    const holdTime = Date.now() - position.entryTime;
    const holdTimeMinutes = holdTime / (1000 * 60);
    
    // Scale out if we have good profit and some time has passed
    return profit >= 0.008 && holdTimeMinutes >= 10; // 0.8% profit after 10 minutes
  }

  // Get scale out percentage
  getScaleOutPercentage(position: Position, indicators: Indicators): number {
    const profit = this.calculateProfit(position);
    
    if (profit >= 0.012) return 0.5; // 50% scale out at 1.2% profit
    if (profit >= 0.008) return 0.3; // 30% scale out at 0.8% profit
    
    return 0;
  }
}

