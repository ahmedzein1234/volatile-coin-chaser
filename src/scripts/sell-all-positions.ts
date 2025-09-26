#!/usr/bin/env node

import { BinanceAPIService } from '../services/binance-api';
import logger from '../services/logger';

interface SellOrder {
  symbol: string;
  asset: string;
  quantity: number;
  price?: number;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

async function sellAllPositions() {
  try {
    logger.info('💰 Starting to sell all positions...');
    
    const binanceAPI = new BinanceAPIService();
    
    // Get account info
    logger.info('📊 Getting account information...');
    const accountInfo = await binanceAPI.getAccountInfo();
    
    // Filter out USDT and get all other assets with balances
    const assetsToSell = accountInfo.balances.filter((balance: any) => {
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;
      
      return balance.asset !== 'USDT' && total > 0;
    });
    
    console.log('\n💰 CURRENT POSITIONS TO SELL');
    console.log('='.repeat(50));
    console.log(`Found ${assetsToSell.length} assets with balances:`);
    
    assetsToSell.forEach((balance: any) => {
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;
      console.log(`${balance.asset}: ${total.toFixed(6)} (Free: ${free.toFixed(6)}, Locked: ${locked.toFixed(6)})`);
    });
    
    // Get exchange info to check trading pairs
    logger.info('🔄 Getting exchange information...');
    const exchangeInfo = await binanceAPI.getExchangeInfo();
    
    const sellOrders: SellOrder[] = [];
    
    // Process each asset
    for (const balance of assetsToSell) {
      const asset = balance.asset;
      const free = parseFloat(balance.free);
      const locked = parseFloat(balance.locked);
      const total = free + locked;
      
      if (total <= 0) continue;
      
      // Find USDT trading pair for this asset
      const tradingPair = exchangeInfo.symbols.find((symbol: any) => 
        symbol.symbol === `${asset}USDT` && 
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      );
      
      if (!tradingPair) {
        console.log(`❌ ${asset}: No USDT trading pair available`);
        sellOrders.push({
          symbol: `${asset}USDT`,
          asset,
          quantity: total,
          status: 'failed',
          error: 'No USDT trading pair'
        });
        continue;
      }
      
      // Get current price
      try {
        const ticker = await binanceAPI.get24hrTicker(`${asset}USDT`);
        const currentPrice = parseFloat(ticker.lastPrice);
        
        if (currentPrice <= 0) {
          console.log(`❌ ${asset}: Invalid price data`);
          sellOrders.push({
            symbol: `${asset}USDT`,
            asset,
            quantity: total,
            status: 'failed',
            error: 'Invalid price data'
          });
          continue;
        }
        
        // Calculate quantity to sell (use only free balance for now)
        const quantityToSell = free;
        
        if (quantityToSell <= 0) {
          console.log(`⚠️ ${asset}: No free balance to sell (${locked.toFixed(6)} locked)`);
          continue;
        }
        
        // Get lot size filter for quantity precision
        const lotSizeFilter = tradingPair.filters.find((f: any) => f.filterType === 'LOT_SIZE');
        const stepSize = lotSizeFilter ? parseFloat(lotSizeFilter.stepSize) : 0.000001;
        
        // Round quantity to step size
        const roundedQuantity = Math.floor(quantityToSell / stepSize) * stepSize;
        
        if (roundedQuantity <= 0) {
          console.log(`⚠️ ${asset}: Quantity too small after rounding`);
          continue;
        }
        
        console.log(`\n🔄 Selling ${asset}:`);
        console.log(`   Quantity: ${roundedQuantity.toFixed(6)}`);
        console.log(`   Price: $${currentPrice.toFixed(6)}`);
        console.log(`   Estimated Value: $${(roundedQuantity * currentPrice).toFixed(2)}`);
        
        // Place market sell order
        try {
          const order = await binanceAPI.placeOrder(
            `${asset}USDT`,
            'SELL',
            roundedQuantity,
            'MARKET'
          );
          
          console.log(`✅ ${asset}: Order placed successfully`);
          console.log(`   Order ID: ${order.orderId}`);
          console.log(`   Status: ${order.status}`);
          
          sellOrders.push({
            symbol: `${asset}USDT`,
            asset,
            quantity: roundedQuantity,
            status: 'success'
          });
          
        } catch (orderError) {
          console.log(`❌ ${asset}: Failed to place order - ${orderError instanceof Error ? orderError.message : String(orderError)}`);
          sellOrders.push({
            symbol: `${asset}USDT`,
            asset,
            quantity: roundedQuantity,
            status: 'failed',
            error: orderError instanceof Error ? orderError.message : String(orderError)
          });
        }
        
        // Small delay between orders
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ ${asset}: Error getting price - ${error instanceof Error ? error.message : String(error)}`);
        sellOrders.push({
          symbol: `${asset}USDT`,
          asset,
          quantity: total,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Summary
    console.log('\n📊 SELL ORDERS SUMMARY');
    console.log('='.repeat(50));
    
    const successful = sellOrders.filter(o => o.status === 'success');
    const failed = sellOrders.filter(o => o.status === 'failed');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL SALES:');
      successful.forEach(order => {
        console.log(`   ${order.asset}: ${order.quantity.toFixed(6)}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED SALES:');
      failed.forEach(order => {
        console.log(`   ${order.asset}: ${order.error}`);
      });
    }
    
    // Get final USDT balance
    console.log('\n💰 FINAL BALANCE CHECK');
    console.log('='.repeat(50));
    
    const finalAccountInfo = await binanceAPI.getAccountInfo();
    const usdtBalance = finalAccountInfo.balances.find((b: any) => b.asset === 'USDT');
    
    if (usdtBalance) {
      const finalUSDT = parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked);
      console.log(`Total USDT: ${finalUSDT.toFixed(2)}`);
    }
    
    console.log('\n✅ SELL ALL POSITIONS COMPLETED!');
    
  } catch (error) {
    logger.error('Error selling all positions:', error);
    console.error('❌ Failed to sell all positions:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the sell all positions script
sellAllPositions();
