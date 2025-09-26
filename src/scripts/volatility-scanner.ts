#!/usr/bin/env node

import { BinanceAPIService } from '../services/binance-api';
import logger from '../services/logger';

interface VolatilityData {
  symbol: string;
  baseAsset: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  volatility: number;
}

async function scanTopVolatileCoins() {
  try {
    logger.info('🔍 Scanning for top volatile coins...');
    
    const binanceAPI = new BinanceAPIService();
    
    // Get 24hr ticker data
    logger.info('📊 Getting 24hr ticker data...');
    const tickerData = await binanceAPI.get24hrTicker('ALL');
    
    // Get exchange info for filtering
    logger.info('🔄 Getting exchange info...');
    const exchangeInfo = await binanceAPI.getExchangeInfo();
    
    // Filter USDT pairs that are actively trading
    const usdtPairs = exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.symbol.endsWith('USDT') && 
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => symbol.symbol);
    
    // Calculate volatility for each pair
    const volatilityData: VolatilityData[] = [];
    
    for (const symbol of usdtPairs) {
      const ticker = tickerData[symbol];
      if (ticker) {
        const priceChangePercent = parseFloat(ticker.priceChangePercent);
        const volume = parseFloat(ticker.volume);
        const price = parseFloat(ticker.lastPrice);
        
        // Calculate volatility score (price change % + volume factor)
        const volumeFactor = Math.min(volume / 1000000, 10); // Cap at 10
        const volatility = Math.abs(priceChangePercent) + (volumeFactor * 0.1);
        
        volatilityData.push({
          symbol,
          baseAsset: symbol.replace('USDT', ''),
          price,
          priceChange24h: parseFloat(ticker.priceChange),
          priceChangePercent24h: priceChangePercent,
          volume24h: volume,
          volatility
        });
      }
    }
    
    // Sort by volatility (highest first)
    volatilityData.sort((a, b) => b.volatility - a.volatility);
    
    // Filter out very low volume coins and get top 20
    const topVolatile = volatilityData
      .filter(coin => coin.volume24h > 100000) // Min $100k volume
      .filter(coin => coin.price > 0.001) // Min price
      .slice(0, 20);
    
    // Display results
    console.log('\n🚀 TOP 20 MOST VOLATILE COINS TODAY');
    console.log('='.repeat(60));
    console.log('Rank | Symbol      | Price      | 24h Change | Volume 24h    | Volatility');
    console.log('-'.repeat(60));
    
    topVolatile.forEach((coin, index) => {
      const rank = (index + 1).toString().padStart(2);
      const symbol = coin.symbol.padEnd(12);
      const price = `$${coin.price.toFixed(4)}`.padEnd(10);
      const change = `${coin.priceChangePercent24h.toFixed(2)}%`.padEnd(10);
      const volume = `$${(coin.volume24h / 1000000).toFixed(1)}M`.padEnd(13);
      const volatility = coin.volatility.toFixed(2);
      
      const changeColor = coin.priceChangePercent24h >= 0 ? '🟢' : '🔴';
      
      console.log(`${rank}   | ${symbol} | ${price} | ${changeColor}${change} | ${volume} | ${volatility}`);
    });
    
    // Show top 5 recommendations
    console.log('\n🎯 TOP 5 RECOMMENDED FOR VOLATILE COIN CHASER');
    console.log('='.repeat(60));
    
    const top5 = topVolatile.slice(0, 5);
    top5.forEach((coin, index) => {
      console.log(`\n${index + 1}. ${coin.symbol} - ${coin.baseAsset}`);
      console.log(`   💰 Price: $${coin.price.toFixed(4)}`);
      console.log(`   📈 24h Change: ${coin.priceChangePercent24h.toFixed(2)}%`);
      console.log(`   📊 Volume: $${(coin.volume24h / 1000000).toFixed(1)}M`);
      console.log(`   🔥 Volatility Score: ${coin.volatility.toFixed(2)}`);
      console.log(`   ✅ Ready for trading`);
    });
    
    // Show current portfolio for comparison
    console.log('\n📋 CURRENT PORTFOLIO COMPARISON');
    console.log('='.repeat(60));
    console.log('Current coins in your portfolio:');
    console.log('1. BTCUSDT - Bitcoin');
    console.log('2. ETHUSDT - Ethereum');
    console.log('3. SOLUSDT - Solana');
    console.log('4. AVAXUSDT - Avalanche');
    console.log('5. AVNTUSDT - Aventus');
    
    // Check if any current coins are in top volatile
    const currentCoins = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'AVNTUSDT'];
    const currentInTop = topVolatile.filter(coin => currentCoins.includes(coin.symbol));
    
    console.log('\n🎯 CURRENT COINS IN TOP VOLATILE:');
    currentInTop.forEach(coin => {
      const rank = topVolatile.findIndex(c => c.symbol === coin.symbol) + 1;
      console.log(`✅ ${coin.symbol} - Rank #${rank} (${coin.priceChangePercent24h.toFixed(2)}% today)`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('• Consider replacing lower-ranked coins with higher volatility options');
    console.log('• Focus on coins with >5% daily movement');
    console.log('• Ensure minimum $1M+ daily volume for liquidity');
    console.log('• Monitor volume spikes for entry opportunities');
    
    console.log('\n✅ SCAN COMPLETE - Ready for high volatility trading!');
    
  } catch (error) {
    logger.error('Error scanning volatile coins:', error);
    console.error('❌ Failed to scan volatile coins:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the volatility scan
scanTopVolatileCoins();
