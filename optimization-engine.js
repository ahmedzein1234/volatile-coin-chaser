const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { IndicatorCalculator } = require('./dist/indicators/calculator');
const { EntryLogicEngine } = require('./dist/logic/entry');

// Configuration
const PORTFOLIO_USDT = 200;
const POSITION_FRACTION = 0.2;
const NOTIONAL_PER_TRADE = PORTFOLIO_USDT * POSITION_FRACTION;
const ROUNDTRIP_FEES = 0.002;

// Parameter ranges for optimization
const PARAMETER_RANGES = {
  entryThreshold: [60, 65, 70, 75, 80],
  atrPercentileMin: [50, 60, 70, 80],
  liquidityPercentileMin: [25, 50, 75],
  spreadMaxBps: [5, 10, 15, 20],
  imbalanceMin: [1.0, 1.1, 1.2, 1.3],
  timeStopBars: [30, 45, 60, 90, 120],
  scaleOutProfit: [0.6, 0.7, 0.8],
  trailStartProfit: [0.4, 0.5, 0.6],
  atrMultiplier: [1.0, 1.2, 1.5]
};

// Enhanced entry logic with gates
function shouldEnterEnhanced(indicators, params) {
  const score = new EntryLogicEngine().calculateEntryScore(indicators);
  
  // Basic threshold
  if (score.total < params.entryThreshold) return false;
  
  // ATR percentile gate
  if (indicators.atrPercentile < params.atrPercentileMin) return false;
  
  // Liquidity gate (simplified - using volume as proxy)
  const volumePercentile = (indicators.volume / indicators.volumeSMA) * 50;
  if (volumePercentile < params.liquidityPercentileMin) return false;
  
  // Spread gate (simplified - using ATR as proxy)
  const spreadBps = (indicators.atr / indicators.rsi) * 10000; // rough estimate
  if (spreadBps > params.spreadMaxBps) return false;
  
  // Order book imbalance gate
  if (indicators.orderBook.imbalanceRatio < params.imbalanceMin) return false;
  
  // Smart money gate
  if (indicators.smartMoney.delta <= 0) return false;
  
  return true;
}

// Enhanced exit logic with scale-out and volatility-based TP
function shouldExitEnhanced(entryPrice, currentPrice, indicators, holdBars, params, positionSize = 1.0) {
  const grossChange = (currentPrice - entryPrice) / entryPrice;
  const netChange = grossChange - ROUNDTRIP_FEES;
  
  // Time stop
  if (holdBars >= params.timeStopBars) return { exit: true, reason: 'time_stop', size: positionSize };
  
  // Scale-out profit target
  if (netChange >= params.scaleOutProfit / 100 && positionSize > 0.5) {
    return { exit: true, reason: 'scale_out', size: 0.5 };
  }
  
  // Volatility-based TP
  const atrTp = entryPrice * (params.atrMultiplier * indicators.atr / entryPrice);
  if (currentPrice >= atrTp) return { exit: true, reason: 'atr_tp', size: positionSize };
  
  // Trailing stop (starts after trailStartProfit)
  if (netChange >= params.trailStartProfit / 100) {
    const trailDistance = Math.max(0.3, netChange - params.trailStartProfit / 100);
    const trailStop = currentPrice * (1 - trailDistance);
    if (currentPrice <= trailStop) return { exit: true, reason: 'trail_stop', size: positionSize };
  }
  
  // Momentum exhaustion
  if (indicators.williamsR > -20) return { exit: true, reason: 'momentum', size: positionSize };
  if (indicators.stochastic && indicators.stochastic.k > 80) return { exit: true, reason: 'stochastic', size: positionSize };
  
  return { exit: false, reason: 'hold', size: positionSize };
}

async function fetchKlines(client, symbol, interval, limit) {
  try {
    const candles = await client.candles({ symbol, interval, limit });
    return candles.map(c => ({
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseFloat(c.volume),
      openTime: c.openTime,
      closeTime: c.closeTime,
    }));
  } catch (e) {
    return [];
  }
}

async function backtestWithParams(client, symbol, params, days = 3) {
  const klines = await fetchKlines(client, symbol, '1m', 1440 * days);
  if (!klines.length || klines.length < 60) {
    return { symbol, trades: 0, wins: 0, losses: 0, pnlUsd: 0, sharpe: 0, maxDD: 0 };
  }

  const calc = new IndicatorCalculator();
  
  let inPosition = false;
  let entryPrice = 0;
  let entryIndex = 0;
  let positionSize = 1.0;
  let trades = 0;
  let wins = 0;
  let losses = 0;
  let pnlUsd = 0;
  let tradeReturns = [];
  let peakBalance = PORTFOLIO_USDT;
  let maxDrawdown = 0;

  for (let i = 60; i < klines.length; i++) {
    const window = klines.slice(0, i + 1);
    const indicators = calc.calculateAllIndicators(window.map(k => ({
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
      volume: k.volume,
    })));

    const price = klines[i].close;

    if (!inPosition) {
      if (shouldEnterEnhanced(indicators, params)) {
        inPosition = true;
        entryPrice = price;
        entryIndex = i;
        positionSize = 1.0;
      }
    } else {
      const holdBars = i - entryIndex;
      const exitDecision = shouldExitEnhanced(entryPrice, price, indicators, holdBars, params, positionSize);
      
      if (exitDecision.exit) {
        const grossChange = (price - entryPrice) / entryPrice;
        const netChange = grossChange - ROUNDTRIP_FEES;
        const tradePnl = NOTIONAL_PER_TRADE * netChange * exitDecision.size;
        
        pnlUsd += tradePnl;
        trades += 1;
        tradeReturns.push(netChange);
        
        if (tradePnl > 0) wins += 1; else losses += 1;
        
        // Update drawdown
        const currentBalance = PORTFOLIO_USDT + pnlUsd;
        if (currentBalance > peakBalance) peakBalance = currentBalance;
        const drawdown = (peakBalance - currentBalance) / peakBalance;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        // Handle partial exits
        if (exitDecision.size < positionSize) {
          positionSize -= exitDecision.size;
        } else {
          inPosition = false;
          positionSize = 1.0;
        }
      }
    }
  }

  // Calculate Sharpe ratio
  const avgReturn = tradeReturns.length > 0 ? tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length : 0;
  const returnStd = tradeReturns.length > 1 ? 
    Math.sqrt(tradeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (tradeReturns.length - 1)) : 0;
  const sharpe = returnStd > 0 ? avgReturn / returnStd : 0;

  return { 
    symbol, 
    trades, 
    wins, 
    losses, 
    pnlUsd, 
    sharpe, 
    maxDrawdown,
    winRate: trades > 0 ? (wins / trades) * 100 : 0,
    avgReturn,
    returnStd
  };
}

function generateParameterCombinations() {
  const combinations = [];
  const keys = Object.keys(PARAMETER_RANGES);
  
  function generateRecursive(index, current) {
    if (index === keys.length) {
      combinations.push({ ...current });
      return;
    }
    
    const key = keys[index];
    for (const value of PARAMETER_RANGES[key]) {
      current[key] = value;
      generateRecursive(index + 1, current);
    }
  }
  
  generateRecursive(0, {});
  return combinations;
}

async function optimizeParameters() {
  console.log('🚀 Starting Parameter Optimization...');
  console.log(`📊 Testing ${Object.values(PARAMETER_RANGES).reduce((a, b) => a * b.length, 1)} combinations`);
  
  const symbols = ['OGUSDT', 'AVNTUSDT', 'ZROUSDT', 'SPKUSDT', 'STGUSDT'];
  const client = Binance({});
  
  const combinations = generateParameterCombinations();
  const results = [];
  
  // Test a subset for initial optimization (first 100 combinations)
  const testCombinations = combinations.slice(0, 100);
  
  for (let i = 0; i < testCombinations.length; i++) {
    const params = testCombinations[i];
    console.log(`\n🔍 Testing combination ${i + 1}/${testCombinations.length}`);
    console.log(`   Threshold: ${params.entryThreshold}, ATR: ${params.atrPercentileMin}, Liquidity: ${params.liquidityPercentileMin}`);
    
    const symbolResults = [];
    let totalTrades = 0;
    let totalWins = 0;
    let totalPnl = 0;
    let totalSharpe = 0;
    let maxMaxDD = 0;
    
    for (const symbol of symbols) {
      const result = await backtestWithParams(client, symbol, params, 3);
      symbolResults.push(result);
      totalTrades += result.trades;
      totalWins += result.wins;
      totalPnl += result.pnlUsd;
      totalSharpe += result.sharpe;
      if (result.maxDrawdown > maxMaxDD) maxMaxDD = result.maxDrawdown;
    }
    
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const avgSharpe = totalSharpe / symbols.length;
    const dailyRoi = (totalPnl / PORTFOLIO_USDT) * 100;
    
    results.push({
      params,
      totalTrades,
      winRate,
      totalPnl,
      dailyRoi,
      avgSharpe,
      maxMaxDD,
      symbolResults
    });
    
    console.log(`   Result: ${totalTrades} trades, ${winRate.toFixed(1)}% win rate, $${totalPnl.toFixed(2)} PnL, ${dailyRoi.toFixed(2)}% ROI`);
  }
  
  // Sort by multiple criteria (Sharpe ratio, then PnL, then win rate)
  results.sort((a, b) => {
    if (Math.abs(a.avgSharpe - b.avgSharpe) > 0.1) return b.avgSharpe - a.avgSharpe;
    if (Math.abs(a.totalPnl - b.totalPnl) > 1) return b.totalPnl - a.totalPnl;
    return b.winRate - a.winRate;
  });
  
  console.log('\n🏆 TOP 10 OPTIMIZED PARAMETER COMBINATIONS:');
  console.log('='.repeat(80));
  
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const r = results[i];
    console.log(`\n${i + 1}. Score: ${r.avgSharpe.toFixed(3)} Sharpe, $${r.totalPnl.toFixed(2)} PnL, ${r.winRate.toFixed(1)}% win rate`);
    console.log(`   Threshold: ${r.params.entryThreshold}, ATR: ${r.params.atrPercentileMin}, Liquidity: ${r.params.liquidityPercentileMin}`);
    console.log(`   Spread: ${r.params.spreadMaxBps}bps, Imbalance: ${r.params.imbalanceMin}, Time: ${r.params.timeStopBars}bars`);
    console.log(`   Scale-out: ${r.params.scaleOutProfit}%, Trail: ${r.params.trailStartProfit}%, ATR: ${r.params.atrMultiplier}x`);
    console.log(`   Trades: ${r.totalTrades}, ROI: ${r.dailyRoi.toFixed(2)}%, Max DD: ${(r.maxMaxDD * 100).toFixed(1)}%`);
  }
  
  return results[0]; // Return best combination
}

// Run optimization
optimizeParameters().then(bestParams => {
  console.log('\n🎯 OPTIMIZATION COMPLETE!');
  console.log('Best parameters found and ready for implementation.');
}).catch(err => {
  console.error('❌ Optimization failed:', err.message);
});