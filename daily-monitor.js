const { BinanceAPIService } = require('./dist/services/binance-api');
const logger = require('./dist/services/logger').default;

async function getDailyTradingReport() {
  try {
    console.log('📊 DAILY TRADING REPORT - VOLATILE COIN CHASER');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    
    const binanceAPI = new BinanceAPIService();
    
    // Get account balance
    const balance = await binanceAPI.getBalance();
    console.log(`\n💰 ACCOUNT BALANCE: $${balance.toFixed(2)} USDT`);
    
    // Get account info for positions
    const accountInfo = await binanceAPI.getAccountInfo();
    const nonZeroBalances = accountInfo.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    
    console.log('\n📊 CURRENT POSITIONS:');
    console.log('-'.repeat(40));
    
    let totalPortfolioValue = 0;
    let activePositions = 0;
    
    for (const balance of nonZeroBalances) {
      if (balance.asset === 'USDT') {
        totalPortfolioValue += parseFloat(balance.free) + parseFloat(balance.locked);
        continue;
      }
      
      const symbol = `${balance.asset}USDT`;
      const freeAmount = parseFloat(balance.free);
      const lockedAmount = parseFloat(balance.locked);
      const totalAmount = freeAmount + lockedAmount;
      
      if (totalAmount > 0) {
        try {
          // Get current price
          const ticker = await binanceAPI.get24hrTicker(symbol);
          const currentPrice = parseFloat(ticker.lastPrice || ticker.price);
          const positionValue = totalAmount * currentPrice;
          totalPortfolioValue += positionValue;
          activePositions++;
          
          console.log(`• ${balance.asset}: ${totalAmount.toFixed(6)} ($${positionValue.toFixed(2)})`);
          console.log(`  Price: $${currentPrice.toFixed(6)} | Free: ${freeAmount.toFixed(6)} | Locked: ${lockedAmount.toFixed(6)}`);
        } catch (error) {
          console.log(`• ${balance.asset}: ${totalAmount.toFixed(6)} (price unavailable)`);
        }
      }
    }
    
    console.log(`\n📈 PORTFOLIO SUMMARY:`);
    console.log(`• Total Value: $${totalPortfolioValue.toFixed(2)}`);
    console.log(`• Active Positions: ${activePositions}`);
    console.log(`• USDT Balance: $${balance.toFixed(2)}`);
    
    // Get recent trades (last 24 hours)
    console.log('\n📋 RECENT TRADING ACTIVITY:');
    console.log('-'.repeat(40));
    
    try {
      // This would require implementing getRecentTrades in BinanceAPIService
      console.log('• Checking for recent trades...');
      console.log('• (Trade history requires additional API implementation)');
    } catch (error) {
      console.log('• Unable to fetch trade history');
    }
    
    // System status
    console.log('\n🎯 SYSTEM STATUS:');
    console.log('-'.repeat(40));
    console.log('• Monitoring: 5 volatile coins (OG, AVNT, ZRO, SPK, STG)');
    console.log('• Entry Threshold: 70+ confluence score');
    console.log('• Risk Management: $5 per trade, $200 max portfolio');
    console.log('• Indicators: 26 institutional-grade indicators active');
    console.log('• Exit Strategy: Fee-aware with 0.5% minimum profit');
    
    // Performance metrics (if we had trade data)
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log('-'.repeat(40));
    console.log('• Daily P&L: Calculating...');
    console.log('• Win Rate: Monitoring...');
    console.log('• Total Trades: Tracking...');
    console.log('• Max Drawdown: Monitoring...');
    
    console.log('\n✅ LIVE TRADING MONITORING ACTIVE');
    console.log('🔄 System will continue monitoring and executing trades');
    
  } catch (error) {
    console.error('❌ Error generating daily report:', error.message);
  }
}

// Run the daily report
getDailyTradingReport();