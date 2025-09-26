import { IndicatorCalculator } from '../src/indicators/calculator';
import { PriceData } from '../src/types';

describe('Indicator Calculator', () => {
  let calculator: IndicatorCalculator;
  let mockPriceData: PriceData[];

  beforeEach(() => {
    calculator = new IndicatorCalculator();
    
    // Create mock price data (50 data points)
    mockPriceData = [];
    for (let i = 0; i < 50; i++) {
      mockPriceData.push({
        symbol: 'BTCUSDT',
        price: 50000 + (Math.sin(i * 0.1) * 1000) + (Math.random() * 100),
        volume: 1000 + Math.random() * 500,
        high: 50000 + (Math.sin(i * 0.1) * 1000) + 50,
        low: 50000 + (Math.sin(i * 0.1) * 1000) - 50,
        open: 50000 + (Math.sin(i * 0.1) * 1000),
        close: 50000 + (Math.sin(i * 0.1) * 1000) + (Math.random() * 100),
        timestamp: Date.now() + i * 1000
      });
    }
  });

  describe('RSI Calculation', () => {
    test('should calculate RSI within valid range', () => {
      const prices = mockPriceData.map(d => d.close);
      const rsi = calculator.calculateRSI(prices, 14);
      
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    test('should handle insufficient data', () => {
      const prices = [100, 102, 101];
      const rsi = calculator.calculateRSI(prices, 14);
      
      expect(rsi).toBe(50); // Default value
    });
  });

  describe('MACD Calculation', () => {
    test('should calculate MACD with valid structure', () => {
      const prices = mockPriceData.map(d => d.close);
      const macd = calculator.calculateMACD(prices, 12, 26, 9);
      
      expect(macd).toHaveProperty('macd');
      expect(macd).toHaveProperty('signal');
      expect(macd).toHaveProperty('histogram');
      expect(typeof macd.macd).toBe('number');
      expect(typeof macd.signal).toBe('number');
      expect(typeof macd.histogram).toBe('number');
    });
  });

  describe('Williams %R Calculation', () => {
    test('should calculate Williams %R within valid range', () => {
      const highs = mockPriceData.map(d => d.high);
      const lows = mockPriceData.map(d => d.low);
      const closes = mockPriceData.map(d => d.close);
      
      const williamsR = calculator.calculateWilliamsR(highs, lows, closes, 14);
      
      expect(williamsR).toBeGreaterThanOrEqual(-100);
      expect(williamsR).toBeLessThanOrEqual(0);
    });
  });

  describe('CCI Calculation', () => {
    test('should calculate CCI', () => {
      const highs = mockPriceData.map(d => d.high);
      const lows = mockPriceData.map(d => d.low);
      const closes = mockPriceData.map(d => d.close);
      
      const cci = calculator.calculateCCI(highs, lows, closes, 20);
      
      expect(typeof cci).toBe('number');
    });
  });

  describe('ROC Calculation', () => {
    test('should calculate ROC', () => {
      const prices = mockPriceData.map(d => d.close);
      const roc = calculator.calculateROC(prices, 10);
      
      expect(typeof roc).toBe('number');
    });
  });

  describe('ATR Calculation', () => {
    test('should calculate ATR', () => {
      const highs = mockPriceData.map(d => d.high);
      const lows = mockPriceData.map(d => d.low);
      const closes = mockPriceData.map(d => d.close);
      
      const atr = calculator.calculateATR(highs, lows, closes, 14);
      
      expect(atr).toBeGreaterThanOrEqual(0);
    });
  });

  describe('All Indicators Calculation', () => {
    test('should calculate all indicators', () => {
      const indicators = calculator.calculateAllIndicators(mockPriceData);
      
      expect(indicators).toHaveProperty('rsi');
      expect(indicators).toHaveProperty('macd');
      expect(indicators).toHaveProperty('williamsR');
      expect(indicators).toHaveProperty('cci');
      expect(indicators).toHaveProperty('roc');
      expect(indicators).toHaveProperty('obv');
      expect(indicators).toHaveProperty('vpt');
      expect(indicators).toHaveProperty('atr');
      expect(indicators).toHaveProperty('atrPercentile');
      expect(indicators).toHaveProperty('bbSqueeze');
      expect(indicators).toHaveProperty('keltnerTouch');
      expect(indicators).toHaveProperty('rvi');
      expect(indicators).toHaveProperty('uo');
      expect(indicators).toHaveProperty('volume');
      expect(indicators).toHaveProperty('volumeSMA');
      expect(indicators).toHaveProperty('volumeDrop');
    });

    test('should handle insufficient data gracefully', () => {
      const insufficientData = mockPriceData.slice(0, 10);
      const indicators = calculator.calculateAllIndicators(insufficientData);
      
      // Should return default values
      expect(indicators.rsi).toBe(50);
      expect(indicators.williamsR).toBe(-50);
      expect(indicators.cci).toBe(0);
    });
  });
});


