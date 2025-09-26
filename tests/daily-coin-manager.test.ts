import { DailyCoinManager } from '../src/management/daily-coin-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');

describe('Daily Coin Manager', () => {
  let dailyCoinManager: DailyCoinManager;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    dailyCoinManager = new DailyCoinManager();
    jest.clearAllMocks();
  });

  describe('Add Daily Coin', () => {
    test('should add a coin successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      const success = await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      
      expect(success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should not add duplicate coin', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      const success = await dailyCoinManager.addDailyCoin('BTCUSDT', 'medium');
      
      expect(success).toBe(false);
    });

    test('should not add more than max coins', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      // Add 5 coins (max limit)
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      await dailyCoinManager.addDailyCoin('ETHUSDT', 'high');
      await dailyCoinManager.addDailyCoin('ADAUSDT', 'high');
      await dailyCoinManager.addDailyCoin('SOLUSDT', 'high');
      await dailyCoinManager.addDailyCoin('DOTUSDT', 'high');
      
      // Try to add 6th coin
      const success = await dailyCoinManager.addDailyCoin('LINKUSDT', 'high');
      
      expect(success).toBe(false);
    });
  });

  describe('Remove Daily Coin', () => {
    test('should remove a coin successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      const success = await dailyCoinManager.removeDailyCoin('BTCUSDT');
      
      expect(success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should not remove non-existent coin', async () => {
      const success = await dailyCoinManager.removeDailyCoin('NONEXISTENT');
      
      expect(success).toBe(false);
    });
  });

  describe('Load Daily Coins', () => {
    test('should load coins from file', async () => {
      const mockData = {
        date: '2024-01-15',
        coins: [
          { symbol: 'BTCUSDT', volatility: 'high', addedDate: '2024-01-15', isActive: true },
          { symbol: 'ETHUSDT', volatility: 'medium', addedDate: '2024-01-15', isActive: true }
        ]
      };
      
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockData));
      
      const coins = await dailyCoinManager.loadDailyCoins('2024-01-15');
      
      expect(coins).toHaveLength(2);
      expect(coins[0].symbol).toBe('BTCUSDT');
      expect(coins[1].symbol).toBe('ETHUSDT');
    });

    test('should handle missing file gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const coins = await dailyCoinManager.loadDailyCoins('2024-01-15');
      
      expect(coins).toHaveLength(0);
    });
  });

  describe('Get Active Coins', () => {
    test('should return only active coins', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      await dailyCoinManager.addDailyCoin('ETHUSDT', 'medium');
      await dailyCoinManager.removeDailyCoin('ETHUSDT');
      
      const activeCoins = dailyCoinManager.getActiveCoins();
      
      expect(activeCoins).toHaveLength(1);
      expect(activeCoins[0].symbol).toBe('BTCUSDT');
    });
  });

  describe('Get Coins by Volatility', () => {
    test('should return coins by volatility level', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      await dailyCoinManager.addDailyCoin('ETHUSDT', 'medium');
      await dailyCoinManager.addDailyCoin('ADAUSDT', 'low');
      
      const highVolCoins = dailyCoinManager.getHighVolatilityCoins();
      const mediumVolCoins = dailyCoinManager.getMediumVolatilityCoins();
      const lowVolCoins = dailyCoinManager.getLowVolatilityCoins();
      
      expect(highVolCoins).toHaveLength(1);
      expect(highVolCoins[0].symbol).toBe('BTCUSDT');
      
      expect(mediumVolCoins).toHaveLength(1);
      expect(mediumVolCoins[0].symbol).toBe('ETHUSDT');
      
      expect(lowVolCoins).toHaveLength(1);
      expect(lowVolCoins[0].symbol).toBe('ADAUSDT');
    });
  });

  describe('Daily Stats', () => {
    test('should return correct statistics', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      await dailyCoinManager.addDailyCoin('ETHUSDT', 'medium');
      await dailyCoinManager.addDailyCoin('ADAUSDT', 'low');
      
      const stats = dailyCoinManager.getDailyStats();
      
      expect(stats.totalCoins).toBe(3);
      expect(stats.maxCoins).toBe(5);
      expect(stats.highVolatility).toBe(1);
      expect(stats.mediumVolatility).toBe(1);
      expect(stats.lowVolatility).toBe(1);
      expect(stats.utilization).toBe(60); // 3/5 * 100
    });
  });

  describe('Update Coin Volatility', () => {
    test('should update volatility successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await dailyCoinManager.addDailyCoin('BTCUSDT', 'high');
      const success = await dailyCoinManager.updateCoinVolatility('BTCUSDT', 'medium');
      
      expect(success).toBe(true);
      
      const coin = dailyCoinManager.getCoin('BTCUSDT');
      expect(coin?.volatility).toBe('medium');
    });

    test('should not update non-existent coin', async () => {
      const success = await dailyCoinManager.updateCoinVolatility('NONEXISTENT', 'high');
      
      expect(success).toBe(false);
    });
  });
});


