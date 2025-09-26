import { Position, Indicators, Trade } from '../types';
import { BinanceAPIService } from '../services/binance-api';
import { config } from '../config';
import logger from '../services/logger';

export class PositionManager {
  private positions: Map<string, Position> = new Map();
  private binanceAPI: BinanceAPIService;
  private accountBalance: number = 0;
  private symbolInfo: Map<string, any> = new Map();

  constructor() {
    this.binanceAPI = new BinanceAPIService();
  }

  async initialize(): Promise<void> {
    try {
      this.accountBalance = await this.binanceAPI.getBalance();
      logger.info(`Account balance: ${this.accountBalance} USDT`);
      
      // Load symbol information for proper quantity precision
      await this.loadSymbolInfo();
    } catch (error) {
      logger.error('Error initializing position manager:', error);
      throw error;
    }
  }

  private async loadSymbolInfo(): Promise<void> {
    try {
      const exchangeInfo = await this.binanceAPI.getExchangeInfo();
      
      for (const symbolData of exchangeInfo.symbols) {
        if (symbolData.status === 'TRADING') {
          const lotSizeFilter = symbolData.filters.find((f: any) => f.filterType === 'LOT_SIZE');
          const minNotionalFilter = symbolData.filters.find((f: any) => f.filterType === 'MIN_NOTIONAL' || f.filterType === 'NOTIONAL');
          
          this.symbolInfo.set(symbolData.symbol, {
            stepSize: parseFloat(lotSizeFilter?.stepSize || '0.001'),
            minQty: parseFloat(lotSizeFilter?.minQty || '0.001'),
            maxQty: parseFloat(lotSizeFilter?.maxQty || '1000000'),
            minNotional: parseFloat(minNotionalFilter?.minNotional || '10'),
            baseAssetPrecision: symbolData.baseAssetPrecision,
            quotePrecision: symbolData.quotePrecision
          });
        }
      }
      
      logger.info(`Loaded symbol info for ${this.symbolInfo.size} trading pairs`);
    } catch (error) {
      logger.error('Error loading symbol info:', error);
      // Continue without symbol info - will use defaults
    }
  }

  async openPosition(symbol: string, entryPrice: number, indicators: Indicators): Promise<boolean> {
    try {
      // Check if we can open a new position
      if (this.positions.size >= config.trading.maxPositions) {
        logger.warn(`Maximum positions reached (${config.trading.maxPositions})`);
        return false;
      }

      // Check if position already exists
      if (this.positions.has(symbol)) {
        logger.warn(`Position already exists for ${symbol}`);
        return false;
      }

      // Calculate position size
      const quantity = this.calculatePositionSize(entryPrice, indicators, symbol);
      if (quantity <= 0) {
        logger.warn(`Invalid position size for ${symbol}: ${quantity}`);
        return false;
      }

      // Calculate stop loss and take profit
      const stopLoss = this.calculateStopLoss(entryPrice, indicators);
      const takeProfit = this.calculateTakeProfit(entryPrice, indicators);

      // Create position
      const position: Position = {
        symbol,
        entryPrice,
        entryTime: Date.now(),
        quantity,
        stopLoss,
        takeProfit,
        trailingStop: stopLoss,
        peakPrice: entryPrice,
        entryVolume: indicators.volume,
        entryATR: indicators.atr
      };

      // Place buy order
      const order = await this.binanceAPI.placeOrder(symbol, 'BUY', quantity, 'MARKET');
      
      if (order && order.status === 'FILLED') {
        // Update position with actual fill price
        position.entryPrice = parseFloat(order.fills[0].price);
        position.quantity = parseFloat(order.fills[0].qty);
        
        this.positions.set(symbol, position);
        
        logger.info(`Position opened for ${symbol}: ${quantity} @ ${position.entryPrice}, SL: ${stopLoss}, TP: ${takeProfit}`);
        
        // Update account balance
        this.accountBalance = await this.binanceAPI.getBalance();
        
        return true;
      } else {
        logger.error(`Failed to place order for ${symbol}:`, order);
        return false;
      }
    } catch (error) {
      logger.error(`Error opening position for ${symbol}:`, error);
      return false;
    }
  }

  async closePosition(symbol: string, reason: string): Promise<boolean> {
    try {
      const position = this.positions.get(symbol);
      if (!position) {
        logger.warn(`No position found for ${symbol}`);
        return false;
      }

      // Place sell order
      const order = await this.binanceAPI.placeOrder(symbol, 'SELL', position.quantity, 'MARKET');
      
      if (order && order.status === 'FILLED') {
        const exitPrice = parseFloat(order.fills[0].price);
        const profit = this.calculateProfit(position, exitPrice);
        const holdTime = Date.now() - position.entryTime;
        const holdTimeMinutes = holdTime / (1000 * 60);

        logger.info(`Position closed for ${symbol}: ${position.quantity} @ ${exitPrice}, Profit: ${(profit * 100).toFixed(2)}%, Hold time: ${holdTimeMinutes.toFixed(1)}min, Reason: ${reason}`);

        // Remove position
        this.positions.delete(symbol);
        
        // Update account balance
        this.accountBalance = await this.binanceAPI.getBalance();
        
        return true;
      } else {
        logger.error(`Failed to close position for ${symbol}:`, order);
        return false;
      }
    } catch (error) {
      logger.error(`Error closing position for ${symbol}:`, error);
      return false;
    }
  }

  async scaleOutPosition(symbol: string, percentage: number, reason: string): Promise<boolean> {
    try {
      const position = this.positions.get(symbol);
      if (!position) {
        logger.warn(`No position found for ${symbol}`);
        return false;
      }

      const scaleOutQuantity = position.quantity * percentage;
      
      // Place partial sell order
      const order = await this.binanceAPI.placeOrder(symbol, 'SELL', scaleOutQuantity, 'MARKET');
      
      if (order && order.status === 'FILLED') {
        const exitPrice = parseFloat(order.fills[0].price);
        const profit = this.calculateProfit(position, exitPrice);
        
        // Update position quantity
        position.quantity -= scaleOutQuantity;
        
        logger.info(`Scaled out ${symbol}: ${scaleOutQuantity} @ ${exitPrice}, Profit: ${(profit * 100).toFixed(2)}%, Remaining: ${position.quantity}, Reason: ${reason}`);
        
        // Update account balance
        this.accountBalance = await this.binanceAPI.getBalance();
        
        return true;
      } else {
        logger.error(`Failed to scale out position for ${symbol}:`, order);
        return false;
      }
    } catch (error) {
      logger.error(`Error scaling out position for ${symbol}:`, error);
      return false;
    }
  }

  calculatePositionSize(entryPrice: number, indicators: Indicators, symbol: string): number {
    try {
      // Use fixed 5 USDT risk per trade
      const riskAmount = config.trading.maxRiskPerTradeUSDT; // 5 USDT
      
      // Calculate stop loss distance
      const stopLoss = this.calculateStopLoss(entryPrice, indicators);
      const stopLossDistance = Math.abs(entryPrice - stopLoss);
      
      // Calculate position size based on risk amount
      let quantity = riskAmount / stopLossDistance;
      
      // Adjust for Binance fees (0.2% total: 0.1% buy + 0.1% sell)
      const feeAdjustment = 1.002;
      quantity = quantity / feeAdjustment;
      
      // Ensure minimum viable profit (0.25% to cover fees + small profit)
      const minProfit = entryPrice * 0.0025;
      const maxQuantity = (config.trading.maxPortfolioUSDT * 0.2) / entryPrice; // Max 20% of portfolio per position
      
      quantity = Math.min(quantity, maxQuantity);
      
      // Apply proper quantity precision based on symbol
      quantity = this.adjustQuantityPrecision(quantity, symbol);
      
      return Math.max(quantity, 0);
    } catch (error) {
      logger.error('Error calculating position size:', error);
      return 0;
    }
  }

  calculateStopLoss(entryPrice: number, indicators: Indicators): number {
    // Use ATR-based stop loss
    const atrMultiplier = 2.0; // 2x ATR
    const atrStopLoss = entryPrice - (indicators.atr * atrMultiplier);
    
    // Use percentage-based stop loss as backup
    const percentageStopLoss = entryPrice * 0.98; // 2% stop loss
    
    // Use the closer stop loss (less risky)
    return Math.max(atrStopLoss, percentageStopLoss);
  }

  calculateTakeProfit(entryPrice: number, indicators: Indicators): number {
    // Use ATR-based take profit
    const atrMultiplier = 3.0; // 3x ATR
    const atrTakeProfit = entryPrice + (indicators.atr * atrMultiplier);
    
    // Use percentage-based take profit as backup
    const percentageTakeProfit = entryPrice * 1.015; // 1.5% take profit
    
    // Use the closer take profit (more conservative)
    return Math.min(atrTakeProfit, percentageTakeProfit);
  }

  calculateProfit(position: Position, currentPrice: number): number {
    const profit = (currentPrice - position.entryPrice) / position.entryPrice;
    return profit;
  }

  updateTrailingStop(position: Position, currentPrice: number): void {
    const profit = this.calculateProfit(position, currentPrice);
    
    // Update peak price
    if (currentPrice > position.peakPrice) {
      position.peakPrice = currentPrice;
    }
    
    // Progressive trailing stops
    if (profit >= 0.015) { // 1.5%
      position.trailingStop = currentPrice * 0.992; // 0.8% trail
    } else if (profit >= 0.01) { // 1.0%
      position.trailingStop = currentPrice * 0.995; // 0.5% trail
    } else if (profit >= 0.005) { // 0.5%
      position.trailingStop = currentPrice * 0.997; // 0.3% trail
    }
  }

  getPosition(symbol: string): Position | null {
    return this.positions.get(symbol) || null;
  }

  getAllPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPositionCount(): number {
    return this.positions.size;
  }

  hasPosition(symbol: string): boolean {
    return this.positions.has(symbol);
  }

  getAccountBalance(): number {
    return this.accountBalance;
  }

  getTotalPortfolioValue(): number {
    // This would need to be calculated with current prices
    // For now, return account balance
    return this.accountBalance;
  }

  getTotalRisk(): number {
    let totalRisk = 0;
    for (const position of this.positions.values()) {
      const risk = Math.abs(position.entryPrice - position.stopLoss) * position.quantity;
      totalRisk += risk;
    }
    return totalRisk;
  }

  getTotalRiskPercentage(): number {
    const totalRisk = this.getTotalRisk();
    return (totalRisk / this.accountBalance) * 100;
  }

  private adjustQuantityPrecision(quantity: number, symbol: string): number {
    try {
      const symbolData = this.symbolInfo.get(symbol);
      
      if (!symbolData) {
        // Fallback to default precision if symbol info not available
        logger.warn(`No symbol info for ${symbol}, using default precision`);
        return Math.floor(quantity * 1000) / 1000; // 3 decimal places
      }
      
      const { stepSize, minQty, maxQty, minNotional } = symbolData;
      
      // Round to step size
      let adjustedQuantity = Math.floor(quantity / stepSize) * stepSize;
      
      // Ensure minimum quantity
      adjustedQuantity = Math.max(adjustedQuantity, minQty);
      
      // Ensure maximum quantity
      adjustedQuantity = Math.min(adjustedQuantity, maxQty);
      
      // Check minimum notional value
      const notionalValue = adjustedQuantity * (symbol.includes('USDT') ? 1 : 1); // This should use current price
      if (notionalValue < minNotional) {
        // Increase quantity to meet minimum notional
        const requiredQuantity = Math.ceil(minNotional / (symbol.includes('USDT') ? 1 : 1) / stepSize) * stepSize;
        adjustedQuantity = Math.max(adjustedQuantity, requiredQuantity);
      }
      
      // Round to appropriate decimal places based on step size
      const decimalPlaces = this.getDecimalPlaces(stepSize);
      adjustedQuantity = Math.round(adjustedQuantity * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      
      logger.debug(`Quantity precision adjustment for ${symbol}: ${quantity} -> ${adjustedQuantity} (stepSize: ${stepSize})`);
      
      return adjustedQuantity;
    } catch (error) {
      logger.error(`Error adjusting quantity precision for ${symbol}:`, error);
      return Math.floor(quantity * 1000) / 1000; // Fallback to 3 decimal places
    }
  }

  private getDecimalPlaces(stepSize: number): number {
    const stepStr = stepSize.toString();
    if (stepStr.includes('.')) {
      return stepStr.split('.')[1].length;
    }
    return 0;
  }

  private getStepSize(symbol: string): number {
    const symbolData = this.symbolInfo.get(symbol);
    return symbolData?.stepSize || 0.001;
  }
}

