import { Coin, DailyCoinsData } from '../types';
import { config } from '../config';
import logger from '../services/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DailyCoinManager {
  private dailyCoins: Coin[] = [];
  private maxDailyCoins = 5;
  private dataDir = './data';

  constructor() {
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info(`Created data directory: ${this.dataDir}`);
    }
  }

  async loadDailyCoins(date: string): Promise<Coin[]> {
    try {
      const filePath = path.join(this.dataDir, `daily-coins-${date}.json`);
      
      try {
        const data = await fs.readFile(filePath, 'utf8');
        const dailyData: DailyCoinsData = JSON.parse(data);
        this.dailyCoins = dailyData.coins.filter(coin => coin.isActive);
        
        logger.info(`Loaded ${this.dailyCoins.length} daily coins for ${date}`);
        return this.dailyCoins;
      } catch (error) {
        logger.info(`No daily coins file found for ${date}, starting with empty list`);
        this.dailyCoins = [];
        return this.dailyCoins;
      }
    } catch (error) {
      logger.error(`Error loading daily coins for ${date}:`, error);
      this.dailyCoins = [];
      return this.dailyCoins;
    }
  }

  async addDailyCoin(symbol: string, volatility: 'low' | 'medium' | 'high'): Promise<boolean> {
    try {
      // Check if we've reached the maximum
      if (this.dailyCoins.length >= this.maxDailyCoins) {
        logger.warn(`Maximum daily coins reached (${this.maxDailyCoins})`);
        return false;
      }

      // Check if coin already exists
      if (this.dailyCoins.some(coin => coin.symbol === symbol)) {
        logger.warn(`Coin ${symbol} already exists in daily list`);
        return false;
      }

      const coin: Coin = {
        symbol: symbol.toUpperCase(),
        volatility,
        addedDate: new Date().toISOString().split('T')[0],
        isActive: true
      };

      this.dailyCoins.push(coin);
      await this.saveDailyCoins();
      
      logger.info(`Added daily coin: ${symbol} (${volatility} volatility)`);
      return true;
    } catch (error) {
      logger.error(`Error adding daily coin ${symbol}:`, error);
      return false;
    }
  }

  async removeDailyCoin(symbol: string): Promise<boolean> {
    try {
      const coinIndex = this.dailyCoins.findIndex(coin => coin.symbol === symbol);
      
      if (coinIndex === -1) {
        logger.warn(`Coin ${symbol} not found in daily list`);
        return false;
      }

      // Mark as inactive instead of removing
      this.dailyCoins[coinIndex].isActive = false;
      await this.saveDailyCoins();
      
      logger.info(`Removed daily coin: ${symbol}`);
      return true;
    } catch (error) {
      logger.error(`Error removing daily coin ${symbol}:`, error);
      return false;
    }
  }

  async updateCoinVolatility(symbol: string, volatility: 'low' | 'medium' | 'high'): Promise<boolean> {
    try {
      const coin = this.dailyCoins.find(c => c.symbol === symbol);
      
      if (!coin) {
        logger.warn(`Coin ${symbol} not found in daily list`);
        return false;
      }

      coin.volatility = volatility;
      await this.saveDailyCoins();
      
      logger.info(`Updated volatility for ${symbol}: ${volatility}`);
      return true;
    } catch (error) {
      logger.error(`Error updating volatility for ${symbol}:`, error);
      return false;
    }
  }

  getActiveCoins(): Coin[] {
    return this.dailyCoins.filter(coin => coin.isActive);
  }

  getAllCoins(): Coin[] {
    return this.dailyCoins;
  }

  getCoin(symbol: string): Coin | null {
    return this.dailyCoins.find(coin => coin.symbol === symbol) || null;
  }

  getCoinCount(): number {
    return this.dailyCoins.filter(coin => coin.isActive).length;
  }

  hasCoin(symbol: string): boolean {
    return this.dailyCoins.some(coin => coin.symbol === symbol && coin.isActive);
  }

  getHighVolatilityCoins(): Coin[] {
    return this.dailyCoins.filter(coin => coin.isActive && coin.volatility === 'high');
  }

  getMediumVolatilityCoins(): Coin[] {
    return this.dailyCoins.filter(coin => coin.isActive && coin.volatility === 'medium');
  }

  getLowVolatilityCoins(): Coin[] {
    return this.dailyCoins.filter(coin => coin.isActive && coin.volatility === 'low');
  }

  private async saveDailyCoins(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const filePath = path.join(this.dataDir, `daily-coins-${today}.json`);
      
      const dailyData: DailyCoinsData = {
        date: today,
        coins: this.dailyCoins
      };

      await fs.writeFile(filePath, JSON.stringify(dailyData, null, 2));
      logger.debug(`Saved daily coins to ${filePath}`);
    } catch (error) {
      logger.error('Error saving daily coins:', error);
      throw error;
    }
  }

  // Get coins added on a specific date
  getCoinsAddedOnDate(date: string): Coin[] {
    return this.dailyCoins.filter(coin => coin.addedDate === date);
  }

  // Get coins by volatility level
  getCoinsByVolatility(volatility: 'low' | 'medium' | 'high'): Coin[] {
    return this.dailyCoins.filter(coin => coin.isActive && coin.volatility === volatility);
  }

  // Get daily coin statistics
  getDailyStats(): any {
    const activeCoins = this.getActiveCoins();
    const highVol = this.getHighVolatilityCoins().length;
    const mediumVol = this.getMediumVolatilityCoins().length;
    const lowVol = this.getLowVolatilityCoins().length;

    return {
      totalCoins: activeCoins.length,
      maxCoins: this.maxDailyCoins,
      highVolatility: highVol,
      mediumVolatility: mediumVol,
      lowVolatility: lowVol,
      utilization: (activeCoins.length / this.maxDailyCoins) * 100
    };
  }

  // Clear all daily coins (for testing or reset)
  async clearAllCoins(): Promise<void> {
    this.dailyCoins = [];
    await this.saveDailyCoins();
    logger.info('Cleared all daily coins');
  }

  // Load coins from a specific date file
  async loadCoinsFromDate(date: string): Promise<Coin[]> {
    try {
      const filePath = path.join(this.dataDir, `daily-coins-${date}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const dailyData: DailyCoinsData = JSON.parse(data);
      return dailyData.coins;
    } catch (error) {
      logger.error(`Error loading coins from date ${date}:`, error);
      return [];
    }
  }

  // Get all available date files
  async getAvailableDates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const dateFiles = files
        .filter(file => file.startsWith('daily-coins-') && file.endsWith('.json'))
        .map(file => file.replace('daily-coins-', '').replace('.json', ''))
        .sort();
      
      return dateFiles;
    } catch (error) {
      logger.error('Error getting available dates:', error);
      return [];
    }
  }
}

