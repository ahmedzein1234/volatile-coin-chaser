import { DailyCoinManager } from '../management/daily-coin-manager';
import logger from '../services/logger';

async function showStatus() {
  try {
    const dailyCoinManager = new DailyCoinManager();
    
    // Load today's coins
    const today = new Date().toISOString().split('T')[0];
    await dailyCoinManager.loadDailyCoins(today);
    
    // Get stats
    const stats = dailyCoinManager.getDailyStats();
    const activeCoins = dailyCoinManager.getActiveCoins();
    
    console.log('🚀 Volatile Coin Chaser Status');
    console.log('================================');
    console.log(`📅 Date: ${today}`);
    console.log(`📊 Daily Stats: ${stats.totalCoins}/${stats.maxCoins} coins (${stats.utilization.toFixed(1)}% utilization)`);
    console.log(`🔥 High Volatility: ${stats.highVolatility} coins`);
    console.log(`⚡ Medium Volatility: ${stats.mediumVolatility} coins`);
    console.log(`🐌 Low Volatility: ${stats.lowVolatility} coins`);
    console.log('');
    
    if (activeCoins.length > 0) {
      console.log('📋 Active Coins:');
      console.log('----------------');
      activeCoins.forEach((coin, index) => {
        const volatilityEmoji = coin.volatility === 'high' ? '🔥' : coin.volatility === 'medium' ? '⚡' : '🐌';
        console.log(`${index + 1}. ${coin.symbol} ${volatilityEmoji} (${coin.volatility}) - Added: ${coin.addedDate}`);
      });
    } else {
      console.log('📋 No active coins');
    }
    
    console.log('');
    console.log('💡 Commands:');
    console.log('  npm run add-coin <SYMBOL> <VOLATILITY>  - Add a coin');
    console.log('  npm run remove-coin <SYMBOL>            - Remove a coin');
    console.log('  npm run performance                      - Show performance metrics');
    
  } catch (error) {
    logger.error('Error showing status:', error);
    console.log(`❌ Error showing status:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

showStatus();
