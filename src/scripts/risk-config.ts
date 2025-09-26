#!/usr/bin/env node

import { config } from '../config';
import logger from '../services/logger';

function showRiskConfig() {
  try {
    console.log('\n🎯 VOLATILE COIN CHASER - RISK CONFIGURATION');
    console.log('='.repeat(50));
    
    console.log('\n💰 PORTFOLIO LIMITS:');
    console.log(`Max Portfolio USDT: $${config.trading.maxPortfolioUSDT}`);
    console.log(`Max Positions: ${config.trading.maxPositions}`);
    console.log(`Max Risk Per Trade: ${(config.trading.maxRiskPerTrade * 100).toFixed(2)}%`);
    console.log(`Max Portfolio Risk: ${(config.trading.maxPortfolioRisk * 100).toFixed(2)}%`);
    console.log(`Max Drawdown: ${(config.trading.maxDrawdown * 100).toFixed(2)}%`);
    
    console.log('\n📊 POSITION SIZING:');
    const maxRiskPerTradeUSDT = config.trading.maxPortfolioUSDT * config.trading.maxRiskPerTrade;
    const maxPositionUSDT = config.trading.maxPortfolioUSDT * 0.2; // 20% per position
    console.log(`Max Risk Per Trade: $${maxRiskPerTradeUSDT.toFixed(2)}`);
    console.log(`Max Position Size: $${maxPositionUSDT.toFixed(2)}`);
    console.log(`Risk per $1000 position: $${(maxRiskPerTradeUSDT * 5).toFixed(2)}`);
    
    console.log('\n🛡️ RISK MANAGEMENT:');
    console.log(`Stop Loss: ATR-based (dynamic)`);
    console.log(`Take Profit: Aggressive trailing stops`);
    console.log(`Fees: 0.2% total (0.1% buy + 0.1% sell)`);
    console.log(`Min Profit Target: 0.25% (to cover fees)`);
    
    console.log('\n📈 TRADING STRATEGY:');
    console.log(`Entry Signal: Confluence score ≥ 70`);
    console.log(`Indicators: 12+ advanced technical indicators`);
    console.log(`Monitoring: High-frequency real-time`);
    console.log(`Exit Strategy: Smart trailing stops`);
    
    console.log('\n✅ CONFIGURATION ACTIVE:');
    console.log(`✅ Fixed USDT portfolio limit: $${config.trading.maxPortfolioUSDT}`);
    console.log(`✅ Position sizing based on fixed amount`);
    console.log(`✅ Risk management optimized for volatility`);
    console.log(`✅ Fee-aware calculations`);
    
    console.log('\n🎯 READY FOR TRADING!');
    
  } catch (error) {
    logger.error('Error showing risk configuration:', error);
    console.error('❌ Failed to show risk configuration:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the configuration display
showRiskConfig();
