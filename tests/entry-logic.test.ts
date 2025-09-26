import { EntryLogicEngine } from '../src/logic/entry';
import { Indicators } from '../src/types';

describe('Entry Logic Engine', () => {
  let entryLogic: EntryLogicEngine;

  beforeEach(() => {
    entryLogic = new EntryLogicEngine();
  });

  describe('Entry Score Calculation', () => {
    test('should calculate high entry score for strong signals', () => {
      const indicators: Indicators = {
        rsi: 30,
        macd: { macd: 0.5, signal: 0.3, histogram: 0.2 },
        williamsR: -85, // Oversold
        cci: -120, // Oversold
        roc: 3.5, // Strong momentum
        obv: 1000, // Positive
        vpt: 500, // Positive
        atr: 100,
        atrPercentile: 85, // High volatility
        bbSqueeze: true, // Squeeze potential
        keltnerTouch: true, // Channel touch
        rvi: 0.8,
        rviSignal: 0.6,
        uo: 25, // Oversold
        volume: 1000,
        volumeSMA: 800,
        volumeDrop: 1.2
      };

      const score = entryLogic.calculateEntryScore(indicators);
      
      expect(score.total).toBeGreaterThan(70);
      expect(score.momentum).toBeGreaterThan(30);
      expect(score.volume).toBe(30);
      expect(score.volatility).toBe(20);
      expect(score.range).toBe(10);
    });

    test('should calculate low entry score for weak signals', () => {
      const indicators: Indicators = {
        rsi: 70,
        macd: { macd: -0.2, signal: 0.1, histogram: -0.3 },
        williamsR: -20, // Not oversold
        cci: 50, // Neutral
        roc: -1.0, // Negative momentum
        obv: -500, // Negative
        vpt: -200, // Negative
        atr: 50,
        atrPercentile: 30, // Low volatility
        bbSqueeze: false,
        keltnerTouch: false,
        rvi: 0.2,
        rviSignal: 0.4,
        uo: 70, // Overbought
        volume: 500,
        volumeSMA: 800,
        volumeDrop: 0.6
      };

      const score = entryLogic.calculateEntryScore(indicators);
      
      expect(score.total).toBeLessThan(70);
      expect(score.momentum).toBeLessThan(20);
      expect(score.volume).toBe(0);
      expect(score.volatility).toBeLessThan(10);
      expect(score.range).toBe(0);
    });
  });

  describe('Entry Decision', () => {
    test('should recommend entry for high score', () => {
      const indicators: Indicators = {
        rsi: 35,
        macd: { macd: 0.3, signal: 0.2, histogram: 0.1 },
        williamsR: -80,
        cci: -100,
        roc: 2.5,
        obv: 800,
        vpt: 400,
        atr: 80,
        atrPercentile: 80,
        bbSqueeze: true,
        keltnerTouch: true,
        rvi: 0.7,
        rviSignal: 0.5,
        uo: 30,
        volume: 900,
        volumeSMA: 700,
        volumeDrop: 1.3
      };

      const shouldEnter = entryLogic.shouldEnter('BTCUSDT', indicators);
      expect(shouldEnter).toBe(true);
    });

    test('should not recommend entry for low score', () => {
      const indicators: Indicators = {
        rsi: 65,
        macd: { macd: -0.1, signal: 0.1, histogram: -0.2 },
        williamsR: -30,
        cci: 30,
        roc: 0.5,
        obv: -200,
        vpt: -100,
        atr: 40,
        atrPercentile: 40,
        bbSqueeze: false,
        keltnerTouch: false,
        rvi: 0.3,
        rviSignal: 0.4,
        uo: 60,
        volume: 600,
        volumeSMA: 800,
        volumeDrop: 0.75
      };

      const shouldEnter = entryLogic.shouldEnter('BTCUSDT', indicators);
      expect(shouldEnter).toBe(false);
    });
  });

  describe('Entry Confidence', () => {
    test('should return appropriate confidence levels', () => {
      const highScoreIndicators: Indicators = {
        rsi: 25,
        macd: { macd: 0.8, signal: 0.4, histogram: 0.4 },
        williamsR: -90,
        cci: -150,
        roc: 4.0,
        obv: 1500,
        vpt: 800,
        atr: 120,
        atrPercentile: 90,
        bbSqueeze: true,
        keltnerTouch: true,
        rvi: 0.9,
        rviSignal: 0.6,
        uo: 20,
        volume: 1200,
        volumeSMA: 800,
        volumeDrop: 1.5
      };

      const confidence = entryLogic.getEntryConfidence('BTCUSDT', highScoreIndicators);
      expect(['HIGH', 'VERY_HIGH']).toContain(confidence);
    });
  });

  describe('Entry Conditions', () => {
    test('should identify entry conditions', () => {
      const indicators: Indicators = {
        rsi: 30,
        macd: { macd: 0.5, signal: 0.3, histogram: 0.2 },
        williamsR: -85,
        cci: -120,
        roc: 3.0,
        obv: 1000,
        vpt: 500,
        atr: 100,
        atrPercentile: 85,
        bbSqueeze: true,
        keltnerTouch: true,
        rvi: 0.8,
        rviSignal: 0.6,
        uo: 25,
        volume: 1000,
        volumeSMA: 800,
        volumeDrop: 1.2
      };

      const conditions = entryLogic.getEntryConditions('BTCUSDT', indicators);
      
      expect(conditions).toContain('Williams %R oversold');
      expect(conditions).toContain('CCI oversold');
      expect(conditions).toContain('Strong ROC momentum');
      expect(conditions).toContain('RVI bullish');
      expect(conditions).toContain('Positive OBV');
      expect(conditions).toContain('Positive VPT');
      expect(conditions).toContain('High volatility');
      expect(conditions).toContain('BB squeeze potential');
      expect(conditions).toContain('Keltner channel touch');
      expect(conditions).toContain('Ultimate oscillator oversold');
    });
  });
});


