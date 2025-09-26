#!/usr/bin/env node

import { BinanceAPIService } from '../services/binance-api';
import logger from '../services/logger';

async function scanAddresses() {
  try {
    logger.info('🔍 Scanning Binance account for trading addresses...');
    
    const binanceAPI = new BinanceAPIService();
    
    // Get account information
    logger.info('📊 Getting account information...');
    const accountInfo = await binanceAPI.getAccountInfo();
    
    // Get balance
    logger.info('💰 Getting account balance...');
    const balance = await binanceAPI.getBalance();
    
    // Get all trading pairs
    logger.info('🔄 Getting available trading pairs...');
    const exchangeInfo = await binanceAPI.getExchangeInfo();
    
    // Filter USDT pairs
    const usdtPairs = exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.symbol.endsWith('USDT') && 
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        minQty: symbol.filters.find((f: any) => f.filterType === 'LOT_SIZE')?.minQty || '0',
        stepSize: symbol.filters.find((f: any) => f.filterType === 'LOT_SIZE')?.stepSize || '0',
        minNotional: symbol.filters.find((f: any) => f.filterType === 'MIN_NOTIONAL')?.minNotional || '0'
      }))
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));
    
    // Display results
    console.log('\n🎯 ACCOUNT SCAN RESULTS');
    console.log('='.repeat(50));
    
    console.log('\n💰 ACCOUNT BALANCE:');
    console.log(`Total USDT: ${balance.toFixed(2)} USDT`);
    
    console.log('\n📊 ACCOUNT INFO:');
    console.log(`Account Type: ${accountInfo.accountType}`);
    console.log(`Can Trade: ${accountInfo.canTrade}`);
    console.log(`Can Withdraw: ${accountInfo.canWithdraw}`);
    console.log(`Can Deposit: ${accountInfo.canDeposit}`);
    
    console.log('\n🔄 AVAILABLE USDT TRADING PAIRS:');
    console.log(`Total USDT Pairs: ${usdtPairs.length}`);
    
    // Show first 20 pairs as examples
    console.log('\n📈 Sample Trading Pairs:');
    usdtPairs.slice(0, 20).forEach((pair: any, index: number) => {
      console.log(`${index + 1}. ${pair.symbol} (${pair.baseAsset}/${pair.quoteAsset})`);
      console.log(`   Min Qty: ${pair.minQty}, Step: ${pair.stepSize}, Min Notional: ${pair.minNotional}`);
    });
    
    if (usdtPairs.length > 20) {
      console.log(`\n... and ${usdtPairs.length - 20} more pairs available`);
    }
    
    // Show popular volatile coins
    const popularCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'ATOM', 'NEAR', 'SUI', 'AVAX', 'DOT', 'MATIC', 'LINK'];
    const availablePopular = usdtPairs.filter((pair: any) => 
      popularCoins.includes(pair.baseAsset)
    );
    
    console.log('\n🚀 POPULAR VOLATILE COINS AVAILABLE:');
    availablePopular.forEach((pair: any) => {
      console.log(`✅ ${pair.symbol} - Ready for trading`);
    });
    
    console.log('\n🎯 RECOMMENDED FOR VOLATILE COIN CHASER:');
    const recommended = availablePopular.slice(0, 8);
    recommended.forEach((pair: any, index: number) => {
      console.log(`${index + 1}. ${pair.symbol} - High volatility potential`);
    });
    
    console.log('\n✅ SCAN COMPLETE - System ready for trading!');
    
  } catch (error) {
    logger.error('Error scanning addresses:', error);
    console.error('❌ Failed to scan addresses:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the scan
scanAddresses();
