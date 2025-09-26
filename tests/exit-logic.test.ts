import { ExitLogicEngine } from '../src/logic/exit';
import { Position, Indicators } from '../src/types';

describe('Exit Logic Engine', () => {
  let exitLogic: ExitLogicEngine;
  let mockPosition: Position;
  let mockIndicators: Indicators;

  beforeEach(() => {
    exitLogic = new ExitLogicEngine();
    
    mockPosition = {
      symbol: 'BTCUSDT',
      entryPrice: 50000,
      entryTime: Date.now() - 600000, // 10 minutes ago
      quantity: 0.1,
      stopLoss: 49000,
      takeProfit: 51500,
      trailingStop: 49000,
      peakPrice: 50000,
      entryVolume: 1000,
      entryATR: 500
    };

    mockIndicators = {
      rsi: 50,
      macd: { macd: 0.1, signal: 0.1, histogram: 0.0 },
      williamsR: -50,
      cci: 0,
      roc: 0,
      obv: 0,
      vpt: 0,
      atr: 500,
      atrPercentile: 50,
      bbSqueeze: false,
      keltnerTouch: false,
      rvi: 0.5,
      rviSignal: 0.5,
      uo: 50,
      volume: 1000,
      volumeSMA: 1000,
      volumeDrop: 1.0
    };
  });

  describe('Exit Decision', () => {
    test('should trigger exit for profit target', () => {
      // Mock profit calculation
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.02); // 2% profit
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(1);
      expect(exitReason.reason).toContain('Profit target reached');
    });

    test('should trigger exit for Williams %R overbought', () => {
      mockIndicators.williamsR = -15; // Overbought
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(2);
      expect(exitReason.reason).toContain('Williams %R overbought');
    });

    test('should trigger exit for CCI overbought', () => {
      mockIndicators.cci = 120; // Overbought
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(2);
      expect(exitReason.reason).toContain('CCI overbought');
    });

    test('should trigger exit for volume exhaustion', () => {
      mockIndicators.volumeDrop = 0.4; // 40% of entry volume
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(3);
      expect(exitReason.reason).toContain('Volume exhaustion');
    });

    test('should trigger exit for volatility contraction', () => {
      mockIndicators.atr = 300; // 60% of entry ATR (500)
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(4);
      expect(exitReason.reason).toContain('Volatility contraction');
    });

    test('should trigger exit for time limit', () => {
      mockPosition.entryTime = Date.now() - 2000000; // 33 minutes ago
      
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(true);
      expect(exitReason.priority).toBe(5);
      expect(exitReason.reason).toContain('Time limit reached');
    });

    test('should not trigger exit for normal conditions', () => {
      const exitReason = exitLogic.shouldExit(mockPosition, mockIndicators);
      
      expect(exitReason.triggered).toBe(false);
      expect(exitReason.priority).toBe(0);
    });
  });

  describe('Trailing Stop', () => {
    test('should update trailing stop for profit', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.01); // 1% profit
      
      const newTrailingStop = exitLogic.updateTrailingStop(mockPosition, 51000);
      
      expect(newTrailingStop).toBeLessThan(51000);
      expect(newTrailingStop).toBeGreaterThan(mockPosition.trailingStop);
    });

    test('should not update trailing stop for loss', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(-0.01); // 1% loss
      
      const newTrailingStop = exitLogic.updateTrailingStop(mockPosition, 49000);
      
      expect(newTrailingStop).toBe(mockPosition.trailingStop);
    });
  });

  describe('Scale Out', () => {
    test('should recommend scale out for good profit', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.01); // 1% profit
      mockPosition.entryTime = Date.now() - 1200000; // 20 minutes ago
      
      const shouldScaleOut = exitLogic.shouldScaleOut(mockPosition, mockIndicators);
      
      expect(shouldScaleOut).toBe(true);
    });

    test('should not recommend scale out for insufficient profit', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.005); // 0.5% profit
      
      const shouldScaleOut = exitLogic.shouldScaleOut(mockPosition, mockIndicators);
      
      expect(shouldScaleOut).toBe(false);
    });

    test('should return appropriate scale out percentage', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.015); // 1.5% profit
      
      const percentage = exitLogic.getScaleOutPercentage(mockPosition, mockIndicators);
      
      expect(percentage).toBe(0.5); // 50% scale out
    });
  });

  describe('Exit Confidence', () => {
    test('should return high confidence for priority exits', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.02); // 2% profit
      
      const confidence = exitLogic.getExitConfidence(mockPosition, mockIndicators);
      
      expect(confidence).toBe('VERY_HIGH');
    });

    test('should return low confidence for no exit', () => {
      const confidence = exitLogic.getExitConfidence(mockPosition, mockIndicators);
      
      expect(confidence).toBe('LOW');
    });
  });

  describe('Exit Timing', () => {
    test('should return immediate for high priority exits', () => {
      jest.spyOn(exitLogic, 'calculateProfit').mockReturnValue(0.02); // 2% profit
      
      const timing = exitLogic.getExitTiming(mockPosition, mockIndicators);
      
      expect(timing).toBe('IMMEDIATE');
    });

    test('should return hold for no exit conditions', () => {
      const timing = exitLogic.getExitTiming(mockPosition, mockIndicators);
      
      expect(timing).toBe('HOLD');
    });
  });
});


