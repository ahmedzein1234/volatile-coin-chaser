import { DailyCoinManager } from '../management/daily-coin-manager';
import logger from '../services/logger';

async function removeCoin() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: npm run remove-coin <SYMBOL>');
    console.log('Example: npm run remove-coin BTCUSDT');
    process.exit(1);
  }
  
  const symbol = args[0].toUpperCase();
  
  try {
    const dailyCoinManager = new DailyCoinManager();
    
    // Load today's coins
    const today = new Date().toISOString().split('T')[0];
    await dailyCoinManager.loadDailyCoins(today);
    
    // Remove the coin
    const success = await dailyCoinManager.removeDailyCoin(symbol);
    
    if (success) {
      console.log(`✅ Successfully removed ${symbol}`);
      
      // Show updated stats
      const stats = dailyCoinManager.getDailyStats();
      console.log(`📊 Daily Stats: ${stats.totalCoins}/${stats.maxCoins} coins (${stats.utilization.toFixed(1)}% utilization)`);
    } else {
      console.log(`❌ Failed to remove ${symbol} (coin not found)`);
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('Error removing coin:', error);
    console.log(`❌ Error removing ${symbol}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

removeCoin();
