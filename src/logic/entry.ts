import { Indicators, EntryScore } from '../types';
import logger from '../services/logger';

export class EntryLogicEngine {
  
  calculateEntryScore(indicators: Indicators): EntryScore {
    let momentumScore = 0;
    let volumeScore = 0;
    let volatilityScore = 0;
    let rangeScore = 0;

    // Momentum indicators (40% weight) - Enhanced with advanced indicators
    if (indicators.williamsR < -80) momentumScore += 8; // Oversold
    else if (indicators.williamsR < -60) momentumScore += 4; // Approaching oversold
    
    if (indicators.cci < -100) momentumScore += 8; // Oversold
    else if (indicators.cci < -50) momentumScore += 4; // Approaching oversold
    
    if (indicators.roc > 2) momentumScore += 8; // Strong momentum
    else if (indicators.roc > 1) momentumScore += 4; // Moderate momentum
    
    if (indicators.rvi > indicators.rviSignal) momentumScore += 6; // RVI bullish
    else if (indicators.rvi > 0) momentumScore += 3; // RVI positive
    
    // Ichimoku Cloud signals
    if (indicators.ichimoku.signal === 'bullish') momentumScore += 8; // Strong trend confirmation
    else if (indicators.ichimoku.signal === 'neutral') momentumScore += 2; // Neutral trend
    
    // Hurst Exponent (trend persistence)
    if (indicators.hurstExponent > 0.6) momentumScore += 4; // Persistent trend
    else if (indicators.hurstExponent > 0.5) momentumScore += 2; // Mild persistence

    // Volume indicators (30% weight) - Enhanced with smart money
    if (indicators.obv > 0) volumeScore += 6; // Positive OBV
    if (indicators.vpt > 0) volumeScore += 6; // Positive VPT
    if (indicators.adLine > 0) volumeScore += 4; // Positive A/D Line
    if (indicators.mfi < 20) volumeScore += 4; // MFI oversold (volume confirmation)
    
    // Smart Money indicators
    if (indicators.smartMoney.delta > 0) volumeScore += 5; // Positive buying pressure
    if (indicators.smartMoney.cvd > 0) volumeScore += 3; // Cumulative volume delta positive
    if (indicators.smartMoney.orderFlow > 0.1) volumeScore += 2; // Strong order flow
    
    // Volume Profile
    const currentPrice = indicators.volumeProfile.pointOfControl;
    if (currentPrice > 0 && currentPrice >= indicators.volumeProfile.valueAreaLow && 
        currentPrice <= indicators.volumeProfile.valueAreaHigh) {
      volumeScore += 4; // Price in value area
    }

    // Volatility indicators (20% weight) - Enhanced with GARCH and Fractal
    if (indicators.atrPercentile > 80) volatilityScore += 8; // High volatility
    else if (indicators.atrPercentile > 60) volatilityScore += 4; // Moderate volatility
    
    if (indicators.bbSqueeze) volatilityScore += 6; // Squeeze breakout potential
    
    // GARCH volatility
    if (indicators.garchVolatility > 0.02) volatilityScore += 4; // High GARCH volatility
    else if (indicators.garchVolatility > 0.01) volatilityScore += 2; // Moderate GARCH volatility
    
    // Fractal Dimension (market complexity)
    if (indicators.fractalDimension < 1.3) volatilityScore += 2; // High complexity/trending

    // Range indicators (10% weight) - Enhanced with liquidity
    if (indicators.keltnerTouch) rangeScore += 2; // Touching channel
    if (indicators.uo < 30) rangeScore += 2; // Oversold
    if (indicators.stochastic.k < 20) rangeScore += 2; // Stochastic oversold
    if (indicators.parabolicSAR < indicators.rsi) rangeScore += 1; // SAR trend confirmation
    
    // Liquidity and Order Book
    if (indicators.orderBook.imbalanceRatio > 1.2) rangeScore += 2; // Bid pressure
    if (indicators.liquidity.efficiency < 0.001) rangeScore += 1; // High liquidity efficiency

    const totalScore = momentumScore + volumeScore + volatilityScore + rangeScore;

    logger.debug(`Entry score breakdown for: Momentum=${momentumScore}, Volume=${volumeScore}, Volatility=${volatilityScore}, Range=${rangeScore}, Total=${totalScore}`);

    return {
      total: totalScore,
      momentum: momentumScore,
      volume: volumeScore,
      volatility: volatilityScore,
      range: rangeScore
    };
  }

  shouldEnter(symbol: string, indicators: Indicators): boolean {
    const score = this.calculateEntryScore(indicators);
    const shouldEnter = score.total >= 70; // Enter if score >= 70/100

    if (shouldEnter) {
      logger.info(`Entry signal for ${symbol}: Score=${score.total}/100 (M:${score.momentum}, V:${score.volume}, Vol:${score.volatility}, R:${score.range})`);
    }

    return shouldEnter;
  }

  // Additional entry conditions for more precision
  getEntryConditions(symbol: string, indicators: Indicators): string[] {
    const conditions: string[] = [];
    const score = this.calculateEntryScore(indicators);

    // Momentum conditions
    if (indicators.williamsR < -80) conditions.push('Williams %R oversold');
    if (indicators.cci < -100) conditions.push('CCI oversold');
    if (indicators.roc > 2) conditions.push('Strong ROC momentum');
    if (indicators.rvi > indicators.rviSignal) conditions.push('RVI bullish');

    // Volume conditions
    if (indicators.obv > 0) conditions.push('Positive OBV');
    if (indicators.vpt > 0) conditions.push('Positive VPT');
    if (indicators.adLine > 0) conditions.push('Positive A/D Line');
    if (indicators.mfi < 20) conditions.push('MFI oversold');

    // Volatility conditions
    if (indicators.atrPercentile > 80) conditions.push('High volatility');
    if (indicators.bbSqueeze) conditions.push('BB squeeze potential');

    // Range conditions
    if (indicators.keltnerTouch) conditions.push('Keltner channel touch');
    if (indicators.uo < 30) conditions.push('Ultimate oscillator oversold');
    if (indicators.stochastic.k < 20) conditions.push('Stochastic oversold');
    if (indicators.parabolicSAR < indicators.rsi) conditions.push('SAR trend confirmation');

    return conditions;
  }

  // Check for strong entry signals (score > 85)
  isStrongEntry(symbol: string, indicators: Indicators): boolean {
    const score = this.calculateEntryScore(indicators);
    return score.total >= 85;
  }

  // Check for weak entry signals (score 60-70)
  isWeakEntry(symbol: string, indicators: Indicators): boolean {
    const score = this.calculateEntryScore(indicators);
    return score.total >= 60 && score.total < 70;
  }

  // Get entry confidence level
  getEntryConfidence(symbol: string, indicators: Indicators): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    const score = this.calculateEntryScore(indicators);
    
    if (score.total >= 90) return 'VERY_HIGH';
    if (score.total >= 80) return 'HIGH';
    if (score.total >= 70) return 'MEDIUM';
    return 'LOW';
  }

  // Check for entry divergence (price vs indicators)
  hasEntryDivergence(symbol: string, indicators: Indicators, priceHistory: any[]): boolean {
    if (priceHistory.length < 20) return false;

    const currentPrice = priceHistory[priceHistory.length - 1].price;
    const pastPrice = priceHistory[priceHistory.length - 10].price;
    
    // Price making lower lows but indicators making higher lows (bullish divergence)
    if (currentPrice < pastPrice && indicators.rsi > 30 && indicators.williamsR > -90) {
      return true;
    }

    return false;
  }

  // Get optimal entry timing
  getEntryTiming(symbol: string, indicators: Indicators): 'IMMEDIATE' | 'WAIT' | 'AVOID' {
    const score = this.calculateEntryScore(indicators);
    
    if (score.total >= 80) return 'IMMEDIATE';
    if (score.total >= 70) return 'WAIT';
    return 'AVOID';
  }
}

