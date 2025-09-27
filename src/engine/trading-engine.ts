import { PriceData, Coin, Position, Indicators } from '../types';
import { BinanceWebSocketService } from '../services/binance-websocket';
import { RealtimeIndicatorEngine } from '../indicators/realtime';
import { EntryLogicEngine } from '../logic/entry';
import { ExitLogicEngine } from '../logic/exit';
import { PositionManager } from '../management/position-manager';
import { RiskManager } from '../management/risk-manager';
import { DailyCoinManager } from '../management/daily-coin-manager';
import logger from '../services/logger';

export class VolatileCoinChaser {
  private binanceWS: BinanceWebSocketService;
  private indicatorEngine: RealtimeIndicatorEngine;
  private entryLogic: EntryLogicEngine;
  private exitLogic: ExitLogicEngine;
  private positionManager: PositionManager;
  private riskManager: RiskManager;
  private dailyCoinManager: DailyCoinManager;
  
  private isRunning: boolean = false;
  private lastDataTime: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastHealthCheck: number = 0;

  constructor() {
    this.binanceWS = new BinanceWebSocketService();
    this.indicatorEngine = new RealtimeIndicatorEngine();
    this.entryLogic = new EntryLogicEngine();
    this.exitLogic = new ExitLogicEngine();
    this.positionManager = new PositionManager();
    this.riskManager = new RiskManager(0); // Will be updated with actual balance
    this.dailyCoinManager = new DailyCoinManager();
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Volatile Coin Chaser...');
      
      // Initialize all services
      await this.initializeServices();
      
      // Load daily coins
      const today = new Date().toISOString().split('T')[0];
      await this.dailyCoinManager.loadDailyCoins(today);
      
      // Start monitoring
      await this.startMonitoring();
      
      this.isRunning = true;
      logger.info('Volatile Coin Chaser started successfully');
      
    } catch (error) {
      logger.error('Error starting Volatile Coin Chaser:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping Volatile Coin Chaser...');
      
      this.isRunning = false;
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      this.binanceWS.disconnect();
      
      logger.info('Volatile Coin Chaser stopped');
    } catch (error) {
      logger.error('Error stopping Volatile Coin Chaser:', error);
    }
  }

  private async initializeServices(): Promise<void> {
    // Initialize position manager
    await this.positionManager.initialize();
    
    // Update risk manager with current balance
    const balance = this.positionManager.getAccountBalance();
    this.riskManager = new RiskManager(balance);
    
    // Connect to Binance WebSocket
    await this.binanceWS.connect();
    
    logger.info('All services initialized successfully');
  }

  private async startMonitoring(): Promise<void> {
    const activeCoins = this.dailyCoinManager.getActiveCoins();
    
    if (activeCoins.length === 0) {
      logger.warn('No active coins to monitor');
      return;
    }

    logger.info(`Starting monitoring for ${activeCoins.length} coins: ${activeCoins.map(c => c.symbol).join(', ')}`);

    // Subscribe to price updates for all active coins
    for (const coin of activeCoins) {
      // Convert symbol to USDT pair format for WebSocket subscription
      const usdtSymbol = coin.symbol.endsWith('USDT') ? coin.symbol : `${coin.symbol}USDT`;
      this.binanceWS.subscribeToCoin(usdtSymbol, (priceData: PriceData) => {
        this.processPriceUpdate(coin.symbol, priceData); // Still use original symbol for internal processing
      });
    }

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Health check every 30 seconds
  }

  private async processPriceUpdate(symbol: string, priceData: PriceData): Promise<void> {
    try {
      // Track when we last received data for this symbol
      this.lastDataTime.set(symbol, Date.now());
      
      // Update indicators
      this.indicatorEngine.updateIndicators(symbol, priceData);
      
      // Check if we have enough data
      if (!this.indicatorEngine.hasEnoughData(symbol)) {
        return;
      }

      const indicators = this.indicatorEngine.getIndicators(symbol);
      if (!indicators) {
        return;
      }

      // Check for entry signals
      await this.checkEntrySignals(symbol, priceData, indicators);
      
      // Check for exit signals
      await this.checkExitSignals(symbol, priceData, indicators);
      
      // Update trailing stops
      await this.updateTrailingStops(symbol, priceData);
      
    } catch (error) {
      logger.error(`Error processing price update for ${symbol}:`, error);
    }
  }

  private async checkEntrySignals(symbol: string, priceData: PriceData, indicators: Indicators): Promise<void> {
    try {
      // Skip if we already have a position
      if (this.positionManager.hasPosition(symbol)) {
        return;
      }

      // Check if we should enter
      if (this.entryLogic.shouldEnter(symbol, indicators)) {
        const confidence = this.entryLogic.getEntryConfidence(symbol, indicators);
        const conditions = this.entryLogic.getEntryConditions(symbol, indicators);
        
        logger.info(`Entry signal for ${symbol}: ${confidence} confidence, Conditions: ${conditions.join(', ')}`);
        
        // Check risk limits before entering
        const currentPositions = this.positionManager.getAllPositions();
        const currentBalance = this.positionManager.getAccountBalance();
        
        if (this.riskManager.checkRiskLimits(currentPositions, currentBalance)) {
          const success = await this.positionManager.openPosition(symbol, priceData.price, indicators);
          
          if (success) {
            logger.info(`Successfully opened position for ${symbol}`);
          } else {
            logger.error(`Failed to open position for ${symbol}`);
          }
        } else {
          logger.warn(`Risk limits exceeded, skipping entry for ${symbol}`);
        }
      }
    } catch (error) {
      logger.error(`Error checking entry signals for ${symbol}:`, error);
    }
  }

  private async checkExitSignals(symbol: string, priceData: PriceData, indicators: Indicators): Promise<void> {
    try {
      const position = this.positionManager.getPosition(symbol);
      if (!position) {
        return;
      }

      // Update exit logic with current price
      const profit = this.positionManager.calculateProfit(position, priceData.price);
      
      // Check if we should exit
      const exitReason = this.exitLogic.shouldExit(position, indicators);
      
      if (exitReason.triggered) {
        const confidence = this.exitLogic.getExitConfidence(position, indicators);
        const timing = this.exitLogic.getExitTiming(position, indicators);
        
        logger.info(`Exit signal for ${symbol}: ${confidence} confidence, ${timing} timing, Reason: ${exitReason.reason}`);
        
        if (timing === 'IMMEDIATE') {
          const success = await this.positionManager.closePosition(symbol, exitReason.reason);
          
          if (success) {
            logger.info(`Successfully closed position for ${symbol}`);
          } else {
            logger.error(`Failed to close position for ${symbol}`);
          }
        }
      }

      // Check for scale out opportunities
      if (this.exitLogic.shouldScaleOut(position, indicators)) {
        const scaleOutPercentage = this.exitLogic.getScaleOutPercentage(position, indicators);
        
        if (scaleOutPercentage > 0) {
          logger.info(`Scale out signal for ${symbol}: ${(scaleOutPercentage * 100).toFixed(0)}%`);
          
          const success = await this.positionManager.scaleOutPosition(symbol, scaleOutPercentage, 'Scale out');
          
          if (success) {
            logger.info(`Successfully scaled out position for ${symbol}`);
          } else {
            logger.error(`Failed to scale out position for ${symbol}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error checking exit signals for ${symbol}:`, error);
    }
  }

  private async updateTrailingStops(symbol: string, priceData: PriceData): Promise<void> {
    try {
      const position = this.positionManager.getPosition(symbol);
      if (!position) {
        return;
      }

      // Update trailing stop
      this.positionManager.updateTrailingStop(position, priceData.price);
      
      // Check if trailing stop should be triggered
      if (this.exitLogic.shouldTriggerTrailingStop(position, priceData.price)) {
        logger.info(`Trailing stop triggered for ${symbol} at ${priceData.price}`);
        
        const success = await this.positionManager.closePosition(symbol, 'Trailing stop triggered');
        
        if (success) {
          logger.info(`Successfully closed position via trailing stop for ${symbol}`);
        } else {
          logger.error(`Failed to close position via trailing stop for ${symbol}`);
        }
      }
    } catch (error) {
      logger.error(`Error updating trailing stops for ${symbol}:`, error);
    }
  }

  private getLastDataTime(symbol: string): number | undefined {
    return this.lastDataTime.get(symbol);
  }

  private performHealthCheck(): void {
    try {
      const now = Date.now();
      
      // Check WebSocket connection
      if (!this.binanceWS.isConnected()) {
        logger.warn('WebSocket connection lost, attempting to reconnect...');
        this.binanceWS.connect().catch(error => {
          logger.error('Failed to reconnect WebSocket:', error);
        });
      }
      
      // Check active coins - only resubscribe if we have no data for a symbol for more than 60 seconds
      const activeCoins = this.dailyCoinManager.getActiveCoins();
      const monitoredSymbols = this.indicatorEngine.getSymbols();
      
      // Track symbols that need resubscription (only if they've been missing data for too long)
      for (const coin of activeCoins) {
        if (!monitoredSymbols.includes(coin.symbol)) {
          // Only resubscribe if this is the first time we notice it's missing
          // This prevents the constant resubscription warnings
          const lastDataTime = this.getLastDataTime(coin.symbol);
          if (!lastDataTime || (now - lastDataTime) > 60000) { // 60 seconds without data
            logger.warn(`Coin ${coin.symbol} not receiving data for 60+ seconds, resubscribing...`);
            // Convert symbol to USDT pair format for WebSocket subscription
            const usdtSymbol = coin.symbol.endsWith('USDT') ? coin.symbol : `${coin.symbol}USDT`;
            this.binanceWS.subscribeToCoin(usdtSymbol, (priceData: PriceData) => {
              this.processPriceUpdate(coin.symbol, priceData);
            });
          }
        }
      }
      
      // Log system status
      if (now - this.lastHealthCheck > 300000) { // Every 5 minutes
        this.logSystemStatus();
        this.lastHealthCheck = now;
      }
      
    } catch (error) {
      logger.error('Error during health check:', error);
    }
  }

  private logSystemStatus(): void {
    try {
      const activeCoins = this.dailyCoinManager.getActiveCoins();
      const positions = this.positionManager.getAllPositions();
      const balance = this.positionManager.getAccountBalance();
      const totalRisk = this.positionManager.getTotalRiskPercentage();
      
      logger.info(`System Status - Coins: ${activeCoins.length}, Positions: ${positions.length}, Balance: ${balance.toFixed(2)} USDT, Risk: ${totalRisk.toFixed(2)}%`);
      
      // Log position details
      for (const position of positions) {
        const indicators = this.indicatorEngine.getIndicators(position.symbol);
        if (indicators) {
          const profit = this.positionManager.calculateProfit(position, indicators.rsi); // Using RSI as placeholder for current price
          logger.info(`Position ${position.symbol}: ${(profit * 100).toFixed(2)}% profit`);
        }
      }
    } catch (error) {
      logger.error('Error logging system status:', error);
    }
  }

  // Public methods for external control
  async addDailyCoin(symbol: string, volatility: 'low' | 'medium' | 'high'): Promise<boolean> {
    const success = await this.dailyCoinManager.addDailyCoin(symbol, volatility);
    
    if (success) {
      // Subscribe to the new coin
      // Convert symbol to USDT pair format for WebSocket subscription
      const usdtSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
      this.binanceWS.subscribeToCoin(usdtSymbol, (priceData: PriceData) => {
        this.processPriceUpdate(symbol, priceData); // Still use original symbol for internal processing
      });
      
      logger.info(`Added and started monitoring ${symbol}`);
    }
    
    return success;
  }

  async removeDailyCoin(symbol: string): Promise<boolean> {
    const success = await this.dailyCoinManager.removeDailyCoin(symbol);
    
    if (success) {
      // Unsubscribe from the coin
      this.binanceWS.unsubscribeFromCoin(symbol);
      
      logger.info(`Removed and stopped monitoring ${symbol}`);
    }
    
    return success;
  }

  getSystemStatus(): any {
    const activeCoins = this.dailyCoinManager.getActiveCoins();
    const positions = this.positionManager.getAllPositions();
    const balance = this.positionManager.getAccountBalance();
    const totalRisk = this.positionManager.getTotalRiskPercentage();
    const performance = this.riskManager.calculatePerformanceMetrics();
    
    return {
      isRunning: this.isRunning,
      activeCoins: activeCoins.length,
      positions: positions.length,
      balance: balance,
      totalRisk: totalRisk,
      performance: performance,
      dailyStats: this.dailyCoinManager.getDailyStats()
    };
  }
}


