import { DailyCoinManager } from '../management/daily-coin-manager';
import logger from '../services/logger';

async function addCoin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run add-coin <SYMBOL> <VOLATILITY>');
    console.log('Example: npm run add-coin BTCUSDT high');
    console.log('Volatility options: low, medium, high');
    process.exit(1);
  }
  
  const symbol = args[0].toUpperCase();
  const volatility = args[1] as 'low' | 'medium' | 'high';
  
  if (!['low', 'medium', 'high'].includes(volatility)) {
    console.log('Invalid volatility. Must be: low, medium, or high');
    process.exit(1);
  }
  
  try {
    const dailyCoinManager = new DailyCoinManager();
    
    // Load today's coins
    const today = new Date().toISOString().split('T')[0];
    await dailyCoinManager.loadDailyCoins(today);
    
    // Add the coin
    const success = await dailyCoinManager.addDailyCoin(symbol, volatility);
    
    if (success) {
      console.log(`✅ Successfully added ${symbol} with ${volatility} volatility`);
      
      // Show updated stats
      const stats = dailyCoinManager.getDailyStats();
      console.log(`📊 Daily Stats: ${stats.totalCoins}/${stats.maxCoins} coins (${stats.utilization.toFixed(1)}% utilization)`);
    } else {
      console.log(`❌ Failed to add ${symbol}`);
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('Error adding coin:', error);
    console.log(`❌ Error adding ${symbol}:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

addCoin();
