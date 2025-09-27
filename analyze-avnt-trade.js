const { BinanceAPIService } = require('./dist/services/binance-api');
const { IndicatorCalculator } = require('./dist/indicators/calculator');
const { EntryLogicEngine } = require('./dist/logic/entry');

async function analyzeAVNTTrade() {
  try {
    console.log('🔍 AVNT TRADE ANALYSIS - 14:28 EXECUTION');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Analysis Time: ${new Date().toLocaleTimeString()}`);
    
    const binanceAPI = new BinanceAPIService();
    const calculator = new IndicatorCalculator();
    const entryEngine = new EntryLogicEngine();
    
    // Trade details from Binance order history
    const tradeDetails = {
      symbol: 'AVNTUSDT',
      entryTime: '14:27:24',
      exitTime: '14:28:02',
      entryPrice: 1.5302,
      exitPrice: 1.5308,
      quantity: 26.1,
      entryValue: 39.93822,
      exitValue: 39.95388,
      duration: '38 seconds',
      side: 'BUY then SELL'
    };
    
    console.log('\n📊 TRADE EXECUTION DETAILS:');
    console.log('-'.repeat(50));
    console.log(`• Symbol: ${tradeDetails.symbol}`);
    console.log(`• Entry: ${tradeDetails.entryTime} @ $${tradeDetails.entryPrice}`);
    console.log(`• Exit: ${tradeDetails.exitTime} @ $${tradeDetails.exitPrice}`);
    console.log(`• Quantity: ${tradeDetails.quantity} AVNT`);
    console.log(`• Duration: ${tradeDetails.duration}`);
    console.log(`• Entry Value: $${tradeDetails.entryValue}`);
    console.log(`• Exit Value: $${tradeDetails.exitValue}`);
    
    // Calculate P&L
    const grossPnL = tradeDetails.exitValue - tradeDetails.entryValue;
    const fees = (tradeDetails.entryValue + tradeDetails.exitValue) * 0.001; // 0.1% each side
    const netPnL = grossPnL - fees;
    const netPnLPercent = (netPnL / tradeDetails.entryValue) * 100;
    
    console.log('\n💰 P&L ANALYSIS:');
    console.log('-'.repeat(50));
    console.log(`• Gross P&L: $${grossPnL.toFixed(6)}`);
    console.log(`• Trading Fees: $${fees.toFixed(6)} (0.2% total)`);
    console.log(`• Net P&L: $${netPnL.toFixed(6)}`);
    console.log(`• Net Return: ${netPnLPercent.toFixed(4)}%`);
    
    // Get current market data for analysis
    console.log('\n📈 MARKET ANALYSIS:');
    console.log('-'.repeat(50));
    
    try {
      const ticker = await binanceAPI.get24hrTicker('AVNTUSDT');
      const currentPrice = parseFloat(ticker.lastPrice);
      const priceChange24h = parseFloat(ticker.priceChangePercent);
      const volume24h = parseFloat(ticker.volume);
      
      console.log(`• Current Price: $${currentPrice}`);
      console.log(`• 24h Change: ${priceChange24h.toFixed(2)}%`);
      console.log(`• 24h Volume: ${volume24h.toLocaleString()} AVNT`);
      console.log(`• Price vs Trade: ${((currentPrice - tradeDetails.exitPrice) / tradeDetails.exitPrice * 100).toFixed(2)}%`);
      
      // Get recent klines for indicator analysis
      const klines = await binanceAPI.getKlines('AVNTUSDT', '1m', 100);
      if (klines.length > 0) {
        const priceData = klines.map(k => ({
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume)
        }));
        
        const indicators = calculator.calculateAllIndicators(priceData);
        const entryScore = entryEngine.calculateEntryScore(indicators);
        
        console.log('\n🎯 INDICATOR ANALYSIS (Current):');
        console.log('-'.repeat(50));
        console.log(`• Entry Score: ${entryScore.total}/100`);
        console.log(`• RSI: ${indicators.rsi.toFixed(2)}`);
        console.log(`• Williams %R: ${indicators.williamsR.toFixed(2)}`);
        console.log(`• CCI: ${indicators.cci.toFixed(2)}`);
        console.log(`• ATR: ${indicators.atr.toFixed(6)}`);
        console.log(`• Volume: ${indicators.volume.toLocaleString()}`);
        console.log(`• Ichimoku Signal: ${indicators.ichimoku.signal}`);
        console.log(`• Smart Money Delta: ${indicators.smartMoney.delta.toFixed(2)}`);
        console.log(`• Order Book Imbalance: ${indicators.orderBook.imbalanceRatio.toFixed(3)}`);
      }
    } catch (error) {
      console.log('• Unable to fetch current market data');
    }
    
    // Trade analysis
    console.log('\n🔍 TRADE ANALYSIS:');
    console.log('-'.repeat(50));
    
    if (netPnL > 0) {
      console.log('✅ PROFITABLE TRADE');
      console.log(`• Small but positive return: ${netPnLPercent.toFixed(4)}%`);
      console.log('• System executed quick profit-taking strategy');
    } else {
      console.log('❌ UNPROFITABLE TRADE');
      console.log(`• Loss after fees: ${netPnLPercent.toFixed(4)}%`);
      console.log('• May indicate entry/exit timing issues');
    }
    
    console.log('\n⚡ EXECUTION ANALYSIS:');
    console.log('-'.repeat(50));
    console.log('• Very quick execution (38 seconds)');
    console.log('• Suggests either:');
    console.log('  - Quick profit target hit');
    console.log('  - Stop loss triggered');
    console.log('  - Momentum exhaustion exit');
    console.log('  - System detected unfavorable conditions');
    
    console.log('\n📊 PERFORMANCE METRICS:');
    console.log('-'.repeat(50));
    console.log(`• Trade Efficiency: ${netPnL > 0 ? 'Positive' : 'Negative'}`);
    console.log(`• Fee Impact: ${(fees / tradeDetails.entryValue * 100).toFixed(3)}% of position`);
    console.log(`• Risk/Reward: ${netPnL > 0 ? 'Favorable' : 'Unfavorable'}`);
    console.log(`• Execution Speed: Very Fast (38s)`);
    
    console.log('\n💡 INSIGHTS:');
    console.log('-'.repeat(50));
    if (netPnL > 0) {
      console.log('• System successfully captured small profit');
      console.log('• Quick exit strategy working');
      console.log('• Fee-aware calculations effective');
    } else {
      console.log('• Trade lost money after fees');
      console.log('• May need to adjust:');
      console.log('  - Entry threshold (currently 70+)');
      console.log('  - Exit conditions');
      console.log('  - Minimum profit targets');
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    if (netPnL > 0) {
      console.log('• Continue current strategy');
      console.log('• Monitor for consistency');
      console.log('• Track win rate over time');
    } else {
      console.log('• Consider raising entry threshold to 75+');
      console.log('• Increase minimum profit target to 0.3%+');
      console.log('• Review exit conditions for better timing');
    }
    
    console.log('\n✅ ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeAVNTTrade();