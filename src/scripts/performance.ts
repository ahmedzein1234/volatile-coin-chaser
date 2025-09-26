import { DailyCoinManager } from '../management/daily-coin-manager';
import logger from '../services/logger';

async function showPerformance() {
  try {
    const dailyCoinManager = new DailyCoinManager();
    
    // Load today's coins
    const today = new Date().toISOString().split('T')[0];
    await dailyCoinManager.loadDailyCoins(today);
    
    // Get stats
    const stats = dailyCoinManager.getDailyStats();
    const activeCoins = dailyCoinManager.getActiveCoins();
    
    console.log('📈 Volatile Coin Chaser Performance');
    console.log('===================================');
    console.log(`📅 Date: ${today}`);
    console.log('');
    
    console.log('📊 Daily Statistics:');
    console.log(`  Total Coins: ${stats.totalCoins}/${stats.maxCoins}`);
    console.log(`  Utilization: ${stats.utilization.toFixed(1)}%`);
    console.log(`  High Volatility: ${stats.highVolatility} coins`);
    console.log(`  Medium Volatility: ${stats.mediumVolatility} coins`);
    console.log(`  Low Volatility: ${stats.lowVolatility} coins`);
    console.log('');
    
    if (activeCoins.length > 0) {
      console.log('🔥 Active Coins by Volatility:');
      console.log('-------------------------------');
      
      const highVolCoins = dailyCoinManager.getHighVolatilityCoins();
      const mediumVolCoins = dailyCoinManager.getMediumVolatilityCoins();
      const lowVolCoins = dailyCoinManager.getLowVolatilityCoins();
      
      if (highVolCoins.length > 0) {
        console.log('🔥 High Volatility:');
        highVolCoins.forEach(coin => {
          console.log(`  • ${coin.symbol} (Added: ${coin.addedDate})`);
        });
      }
      
      if (mediumVolCoins.length > 0) {
        console.log('⚡ Medium Volatility:');
        mediumVolCoins.forEach(coin => {
          console.log(`  • ${coin.symbol} (Added: ${coin.addedDate})`);
        });
      }
      
      if (lowVolCoins.length > 0) {
        console.log('🐌 Low Volatility:');
        lowVolCoins.forEach(coin => {
          console.log(`  • ${coin.symbol} (Added: ${coin.addedDate})`);
        });
      }
    } else {
      console.log('📋 No active coins');
    }
    
    console.log('');
    console.log('💡 Trading System Features:');
    console.log('  • Advanced indicators: Williams %R, CCI, ROC, OBV, VPT, ATR');
    console.log('  • Confluence-based entry scoring (70+ points to enter)');
    console.log('  • Aggressive exit logic with multiple conditions');
    console.log('  • Smart trailing stops with progressive tightening');
    console.log('  • Fee-aware position sizing (0.2% Binance fees)');
    console.log('  • Risk management with 2% max risk per trade');
    console.log('  • High-frequency monitoring (1-second updates)');
    
  } catch (error) {
    logger.error('Error showing performance:', error);
    console.log(`❌ Error showing performance:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

showPerformance();
