import { Indicators, MACD, PriceData } from '../types';

export class IndicatorCalculator {
  
  // Simple Moving Average
  private SMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Exponential Moving Average
  private EMA(values: number[], period: number): number {
    if (values.length < period) return 0;
    const multiplier = 2 / (period + 1);
    let ema = this.SMA(values.slice(0, period), period);
    
    for (let i = period; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // RSI Calculation
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // MACD Calculation
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACD {
    const fastEMA = this.EMA(prices, fastPeriod);
    const slowEMA = this.EMA(prices, slowPeriod);
    const macd = fastEMA - slowEMA;
    
    // For signal line, we need historical MACD values
    const macdValues = [];
    for (let i = slowPeriod; i < prices.length; i++) {
      const fast = this.EMA(prices.slice(0, i + 1), fastPeriod);
      const slow = this.EMA(prices.slice(0, i + 1), slowPeriod);
      macdValues.push(fast - slow);
    }
    
    const signal = this.EMA(macdValues, signalPeriod);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  // Williams %R Calculation
  calculateWilliamsR(high: number[], low: number[], close: number[], period: number = 14): number {
    if (high.length < period || low.length < period || close.length < period) return -50;
    
    const recentHighs = high.slice(-period);
    const recentLows = low.slice(-period);
    const currentClose = close[close.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    if (highestHigh === lowestLow) return -50;
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  // Commodity Channel Index (CCI)
  calculateCCI(high: number[], low: number[], close: number[], period: number = 20): number {
    if (high.length < period || low.length < period || close.length < period) return 0;
    
    const typicalPrices = [];
    for (let i = 0; i < period; i++) {
      typicalPrices.push((high[i] + low[i] + close[i]) / 3);
    }
    
    const smaTP = this.SMA(typicalPrices, period);
    const meanDeviation = this.SMA(typicalPrices.map(tp => Math.abs(tp - smaTP)), period);
    
    if (meanDeviation === 0) return 0;
    
    const currentTP = (high[high.length - 1] + low[low.length - 1] + close[close.length - 1]) / 3;
    return (currentTP - smaTP) / (0.015 * meanDeviation);
  }

  // Rate of Change (ROC)
  calculateROC(prices: number[], period: number = 10): number {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    
    return ((currentPrice - pastPrice) / pastPrice) * 100;
  }

  // On-Balance Volume (OBV)
  calculateOBV(prices: number[], volumes: number[]): number {
    if (prices.length !== volumes.length || prices.length < 2) return 0;
    
    let obv = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
    }
    
    return obv;
  }

  // Volume Price Trend (VPT)
  calculateVPT(prices: number[], volumes: number[]): number {
    if (prices.length !== volumes.length || prices.length < 2) return 0;
    
    let vpt = 0;
    for (let i = 1; i < prices.length; i++) {
      const priceChange = (prices[i] - prices[i - 1]) / prices[i - 1];
      vpt += volumes[i] * priceChange;
    }
    
    return vpt;
  }

  // Average True Range (ATR)
  calculateATR(high: number[], low: number[], close: number[], period: number = 14): number {
    if (high.length < period + 1 || low.length < period + 1 || close.length < period + 1) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < period + 1; i++) {
      const tr1 = high[i] - low[i];
      const tr2 = Math.abs(high[i] - close[i - 1]);
      const tr3 = Math.abs(low[i] - close[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    return this.SMA(trueRanges, period);
  }

  // ATR Percentile
  calculateATRPercentile(atrValues: number[], lookback: number = 100): number {
    if (atrValues.length < lookback) return 50;
    
    const recentATR = atrValues[atrValues.length - 1];
    const historicalATRs = atrValues.slice(-lookback);
    const sortedATRs = historicalATRs.sort((a, b) => a - b);
    
    const rank = sortedATRs.findIndex(atr => atr >= recentATR);
    return (rank / (lookback - 1)) * 100;
  }

  // Bollinger Band Squeeze Detection
  calculateBBSqueeze(prices: number[], period: number = 20, stdDev: number = 2): boolean {
    if (prices.length < period) return false;
    
    const sma = this.SMA(prices, period);
    const variance = this.SMA(prices.map(p => Math.pow(p - sma, 2)), period);
    const standardDeviation = Math.sqrt(variance);
    
    const upperBand = sma + (stdDev * standardDeviation);
    const lowerBand = sma - (stdDev * standardDeviation);
    const bandWidth = (upperBand - lowerBand) / sma;
    
    const avgBandWidth = this.SMA(prices.map((_, i) => {
      if (i < period) return 0;
      const sma_i = this.SMA(prices.slice(i - period, i + 1), period);
      const variance_i = this.SMA(prices.slice(i - period, i + 1).map(p => Math.pow(p - sma_i, 2)), period);
      const stdDev_i = Math.sqrt(variance_i);
      return ((sma_i + (stdDev * stdDev_i)) - (sma_i - (stdDev * stdDev_i))) / sma_i;
    }), 20);
    
    return bandWidth < avgBandWidth * 0.8;
  }

  // Keltner Channel Touch Detection
  calculateKeltnerTouch(prices: number[], high: number[], low: number[], period: number = 20, multiplier: number = 2): boolean {
    if (prices.length < period || high.length < period || low.length < period) return false;
    
    const ema = this.EMA(prices, period);
    const atr = this.calculateATR(high, low, prices, period);
    
    const upperChannel = ema + (multiplier * atr);
    const lowerChannel = ema - (multiplier * atr);
    const currentPrice = prices[prices.length - 1];
    
    return currentPrice <= lowerChannel || currentPrice >= upperChannel;
  }

  // Relative Vigor Index (RVI)
  calculateRVI(open: number[], high: number[], low: number[], close: number[]): number {
    if (open.length < 4 || high.length < 4 || low.length < 4 || close.length < 4) return 0;
    
    const numerator = ((close[3] - open[3]) + 2 * (close[2] - open[2]) + 2 * (close[1] - open[1]) + (close[0] - open[0])) / 6;
    const denominator = ((high[3] - low[3]) + 2 * (high[2] - low[2]) + 2 * (high[1] - low[1]) + (high[0] - low[0])) / 6;
    
    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }

  // Ultimate Oscillator
  calculateUltimateOscillator(high: number[], low: number[], close: number[]): number {
    if (high.length < 28 || low.length < 28 || close.length < 28) return 50;
    
    let bp7 = 0, tr7 = 0;
    let bp14 = 0, tr14 = 0;
    let bp28 = 0, tr28 = 0;
    
    // Calculate 7-period
    for (let i = 0; i < 7; i++) {
      const bp = close[i] - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      const tr = Math.max(high[i], i > 0 ? close[i - 1] : high[i]) - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      bp7 += bp;
      tr7 += tr;
    }
    
    // Calculate 14-period
    for (let i = 0; i < 14; i++) {
      const bp = close[i] - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      const tr = Math.max(high[i], i > 0 ? close[i - 1] : high[i]) - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      bp14 += bp;
      tr14 += tr;
    }
    
    // Calculate 28-period
    for (let i = 0; i < 28; i++) {
      const bp = close[i] - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      const tr = Math.max(high[i], i > 0 ? close[i - 1] : high[i]) - Math.min(low[i], i > 0 ? close[i - 1] : low[i]);
      bp28 += bp;
      tr28 += tr;
    }
    
    const avg7 = tr7 > 0 ? bp7 / tr7 : 0;
    const avg14 = tr14 > 0 ? bp14 / tr14 : 0;
    const avg28 = tr28 > 0 ? bp28 / tr28 : 0;
    
    return 100 * ((4 * avg7) + (2 * avg14) + avg28) / 7;
  }

  // Money Flow Index (MFI) - Volume-weighted RSI
  calculateMFI(high: number[], low: number[], close: number[], volume: number[], period: number = 14): number {
    if (high.length < period + 1 || low.length < period + 1 || close.length < period + 1 || volume.length < period + 1) return 50;
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 1; i <= period; i++) {
      const typicalPrice = (high[i] + low[i] + close[i]) / 3;
      const prevTypicalPrice = (high[i - 1] + low[i - 1] + close[i - 1]) / 3;
      
      const moneyFlow = typicalPrice * volume[i];
      
      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += moneyFlow;
      } else if (typicalPrice < prevTypicalPrice) {
        negativeFlow += moneyFlow;
      }
    }
    
    if (negativeFlow === 0) return 100;
    
    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyRatio));
  }

  // Accumulation/Distribution Line
  calculateADLine(high: number[], low: number[], close: number[], volume: number[]): number {
    if (high.length !== low.length || high.length !== close.length || high.length !== volume.length || high.length < 2) return 0;
    
    let adLine = 0;
    
    for (let i = 0; i < high.length; i++) {
      const highLowDiff = high[i] - low[i];
      if (highLowDiff === 0) continue; // Skip if high equals low
      
      const clv = ((close[i] - low[i]) - (high[i] - close[i])) / highLowDiff;
      adLine += clv * volume[i];
    }
    
    return adLine;
  }

  // Parabolic SAR
  calculateParabolicSAR(high: number[], low: number[], acceleration: number = 0.02, maximum: number = 0.2): number {
    if (high.length < 2 || low.length < 2) return 0;
    
    let sar = low[0];
    let trend = 1; // 1 for uptrend, -1 for downtrend
    let af = acceleration;
    let ep = high[0]; // extreme point
    
    for (let i = 1; i < high.length; i++) {
      const prevSar = sar;
      
      // Calculate new SAR
      sar = prevSar + af * (ep - prevSar);
      
      // Check for trend reversal
      if (trend === 1) {
        if (low[i] <= sar) {
          trend = -1;
          sar = ep;
          ep = low[i];
          af = acceleration;
        } else {
          if (high[i] > ep) {
            ep = high[i];
            af = Math.min(af + acceleration, maximum);
          }
          sar = Math.min(sar, low[i - 1], low[i]);
        }
      } else {
        if (high[i] >= sar) {
          trend = 1;
          sar = ep;
          ep = high[i];
          af = acceleration;
        } else {
          if (low[i] < ep) {
            ep = low[i];
            af = Math.min(af + acceleration, maximum);
          }
          sar = Math.max(sar, high[i - 1], high[i]);
        }
      }
    }
    
    return sar;
  }

  // Stochastic Oscillator
  calculateStochastic(high: number[], low: number[], close: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number, d: number } {
    if (high.length < kPeriod || low.length < kPeriod || close.length < kPeriod) return { k: 50, d: 50 };
    
    const recentHighs = high.slice(-kPeriod);
    const recentLows = low.slice(-kPeriod);
    const currentClose = close[close.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    if (highestHigh === lowestLow) return { k: 50, d: 50 };
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (simple moving average of %K)
    const kValues = [];
    for (let i = kPeriod - 1; i < close.length; i++) {
      const periodHighs = high.slice(i - kPeriod + 1, i + 1);
      const periodLows = low.slice(i - kPeriod + 1, i + 1);
      const periodClose = close[i];
      
      const periodHighest = Math.max(...periodHighs);
      const periodLowest = Math.min(...periodLows);
      
      if (periodHighest !== periodLowest) {
        kValues.push(((periodClose - periodLowest) / (periodHighest - periodLowest)) * 100);
      }
    }
    
    const d = kValues.length >= dPeriod ? this.SMA(kValues, dPeriod) : k;
    
    return { k, d };
  }

  // Calculate all indicators for a symbol
  calculateAllIndicators(priceHistory: PriceData[]): Indicators {
    if (priceHistory.length < 50) {
      // Return default values if not enough data
      return {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        williamsR: -50,
        cci: 0,
        roc: 0,
        obv: 0,
        vpt: 0,
        atr: 0,
        atrPercentile: 50,
        bbSqueeze: false,
        keltnerTouch: false,
        rvi: 0,
        rviSignal: 0,
        uo: 50,
        volume: 0,
        volumeSMA: 0,
        volumeDrop: 0,
        // New advanced indicators
        mfi: 50,
        adLine: 0,
        parabolicSAR: 0,
        stochastic: { k: 50, d: 50 }
      };
    }

    const prices = priceHistory.map(p => p.close);
    const highs = priceHistory.map(p => p.high);
    const lows = priceHistory.map(p => p.low);
    const opens = priceHistory.map(p => p.open);
    const volumes = priceHistory.map(p => p.volume);

    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const williamsR = this.calculateWilliamsR(highs, lows, prices);
    const cci = this.calculateCCI(highs, lows, prices);
    const roc = this.calculateROC(prices);
    const obv = this.calculateOBV(prices, volumes);
    const vpt = this.calculateVPT(prices, volumes);
    const atr = this.calculateATR(highs, lows, prices);
    
    // Calculate ATR percentile (simplified)
    const atrPercentile = atr > 0 ? Math.min(100, Math.max(0, (atr / this.SMA(prices.map((_, i) => 
      i > 0 ? Math.abs(prices[i] - prices[i-1]) : 0
    ), 20)) * 50)) : 50;
    
    const bbSqueeze = this.calculateBBSqueeze(prices);
    const keltnerTouch = this.calculateKeltnerTouch(prices, highs, lows);
    const rvi = this.calculateRVI(opens, highs, lows, prices);
    const uo = this.calculateUltimateOscillator(highs, lows, prices);
    
    // New advanced indicators
    const mfi = this.calculateMFI(highs, lows, prices, volumes);
    const adLine = this.calculateADLine(highs, lows, prices, volumes);
    const parabolicSAR = this.calculateParabolicSAR(highs, lows);
    const stochastic = this.calculateStochastic(highs, lows, prices);
    
    const currentVolume = volumes[volumes.length - 1];
    const volumeSMA = this.SMA(volumes, 20);
    const volumeDrop = volumeSMA > 0 ? (currentVolume / volumeSMA) : 1;

    return {
      rsi,
      macd,
      williamsR,
      cci,
      roc,
      obv,
      vpt,
      atr,
      atrPercentile,
      bbSqueeze,
      keltnerTouch,
      rvi,
      rviSignal: this.SMA([rvi], 4), // Simplified signal line
      uo,
      volume: currentVolume,
      volumeSMA,
      volumeDrop,
      // New advanced indicators
      mfi,
      adLine,
      parabolicSAR,
      stochastic
    };
  }
}

