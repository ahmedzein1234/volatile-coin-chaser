import { Position, PerformanceMetrics } from '../types';
import { config } from '../config';
import logger from '../services/logger';

export class RiskManager {
  private maxPortfolioRisk = config.trading.maxPortfolioRisk;
  private maxDrawdown = config.trading.maxDrawdown;
  private initialBalance: number = 0;
  private peakBalance: number = 0;
  private currentDrawdown: number = 0;
  private tradeHistory: any[] = [];

  constructor(initialBalance: number) {
    this.initialBalance = initialBalance;
    this.peakBalance = initialBalance;
  }

  checkRiskLimits(positions: Position[], currentBalance: number): boolean {
    const totalRisk = this.calculateTotalPortfolioRisk(positions);
    const currentDrawdown = this.calculateCurrentDrawdown(currentBalance);
    
    const riskOk = totalRisk < this.maxPortfolioRisk;
    const drawdownOk = currentDrawdown < this.maxDrawdown;
    
    if (!riskOk) {
      logger.warn(`Portfolio risk limit exceeded: ${(totalRisk * 100).toFixed(2)}% > ${(this.maxPortfolioRisk * 100).toFixed(2)}%`);
    }
    
    if (!drawdownOk) {
      logger.warn(`Drawdown limit exceeded: ${(currentDrawdown * 100).toFixed(2)}% > ${(this.maxDrawdown * 100).toFixed(2)}%`);
    }
    
    return riskOk && drawdownOk;
  }

  calculateTotalPortfolioRisk(positions: Position[]): number {
    let totalRisk = 0;
    for (const position of positions) {
      const positionRisk = this.calculatePositionRisk(position);
      totalRisk += positionRisk;
    }
    return totalRisk;
  }

  calculatePositionRisk(position: Position): number {
    const riskAmount = Math.abs(position.entryPrice - position.stopLoss) * position.quantity;
    return riskAmount;
  }

  calculateCurrentDrawdown(currentBalance: number): number {
    if (currentBalance > this.peakBalance) {
      this.peakBalance = currentBalance;
    }
    
    this.currentDrawdown = (this.peakBalance - currentBalance) / this.peakBalance;
    return this.currentDrawdown;
  }

  // Check if we should reduce position sizes due to high risk
  shouldReducePositionSize(positions: Position[], currentBalance: number): boolean {
    const totalRisk = this.calculateTotalPortfolioRisk(positions);
    const riskPercentage = totalRisk / currentBalance;
    
    return riskPercentage > (this.maxPortfolioRisk * 0.8); // 80% of max risk
  }

  // Get recommended position size reduction factor
  getPositionSizeReductionFactor(positions: Position[], currentBalance: number): number {
    const totalRisk = this.calculateTotalPortfolioRisk(positions);
    const riskPercentage = totalRisk / currentBalance;
    
    if (riskPercentage > this.maxPortfolioRisk) {
      return 0.5; // Reduce by 50%
    } else if (riskPercentage > (this.maxPortfolioRisk * 0.8)) {
      return 0.7; // Reduce by 30%
    }
    
    return 1.0; // No reduction
  }

  // Check if we should stop trading due to drawdown
  shouldStopTrading(currentBalance: number): boolean {
    const drawdown = this.calculateCurrentDrawdown(currentBalance);
    return drawdown >= this.maxDrawdown;
  }

  // Check if we should reduce risk due to consecutive losses
  shouldReduceRisk(): boolean {
    if (this.tradeHistory.length < 3) return false;
    
    const recentTrades = this.tradeHistory.slice(-3);
    const losingTrades = recentTrades.filter(trade => trade.profit < 0);
    
    return losingTrades.length >= 2; // 2 out of last 3 trades were losses
  }

  // Add trade to history for risk analysis
  addTradeToHistory(trade: any): void {
    this.tradeHistory.push(trade);
    
    // Keep only last 100 trades
    if (this.tradeHistory.length > 100) {
      this.tradeHistory = this.tradeHistory.slice(-100);
    }
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(): PerformanceMetrics {
    if (this.tradeHistory.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        winRate: 0,
        averageProfit: 0,
        averageLoss: 0,
        maxDrawdown: this.currentDrawdown,
        sharpeRatio: 0
      };
    }

    const winningTrades = this.tradeHistory.filter(trade => trade.profit > 0);
    const losingTrades = this.tradeHistory.filter(trade => trade.profit < 0);
    
    const totalProfit = this.tradeHistory.reduce((sum, trade) => sum + trade.profit, 0);
    const averageProfit = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, trade) => sum + trade.profit, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? 
      losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length : 0;
    
    const winRate = (winningTrades.length / this.tradeHistory.length) * 100;
    
    // Calculate Sharpe ratio (simplified)
    const returns = this.tradeHistory.map(trade => trade.profit);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
      totalTrades: this.tradeHistory.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      winRate,
      averageProfit,
      averageLoss,
      maxDrawdown: this.currentDrawdown,
      sharpeRatio
    };
  }

  // Get risk status
  getRiskStatus(positions: Position[], currentBalance: number): string {
    const totalRisk = this.calculateTotalPortfolioRisk(positions);
    const riskPercentage = (totalRisk / currentBalance) * 100;
    const drawdown = this.calculateCurrentDrawdown(currentBalance);
    
    if (riskPercentage > this.maxPortfolioRisk * 100) {
      return 'HIGH_RISK';
    } else if (riskPercentage > this.maxPortfolioRisk * 100 * 0.8) {
      return 'MEDIUM_RISK';
    } else if (drawdown > this.maxDrawdown) {
      return 'HIGH_DRAWDOWN';
    } else {
      return 'LOW_RISK';
    }
  }

  // Get recommended actions based on risk
  getRecommendedActions(positions: Position[], currentBalance: number): string[] {
    const actions: string[] = [];
    const totalRisk = this.calculateTotalPortfolioRisk(positions);
    const riskPercentage = (totalRisk / currentBalance) * 100;
    const drawdown = this.calculateCurrentDrawdown(currentBalance);
    
    if (riskPercentage > this.maxPortfolioRisk * 100) {
      actions.push('Reduce position sizes immediately');
      actions.push('Consider closing some positions');
    }
    
    if (drawdown > this.maxDrawdown) {
      actions.push('Stop trading due to drawdown limit');
      actions.push('Review trading strategy');
    }
    
    if (this.shouldReduceRisk()) {
      actions.push('Reduce risk due to consecutive losses');
    }
    
    if (actions.length === 0) {
      actions.push('Risk levels are acceptable');
    }
    
    return actions;
  }

  // Reset risk metrics (for new trading session)
  resetRiskMetrics(newBalance: number): void {
    this.initialBalance = newBalance;
    this.peakBalance = newBalance;
    this.currentDrawdown = 0;
    this.tradeHistory = [];
    logger.info('Risk metrics reset for new trading session');
  }
}

