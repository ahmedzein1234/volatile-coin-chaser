const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { IndicatorCalculator } = require('./dist/indicators/calculator');
const { EntryLogicEngine } = require('./dist/logic/entry');

// Config for PnL and entry threshold (standalone; does not affect live system)
const PORTFOLIO_USDT = 200;
const POSITION_FRACTION = 0.2; // 20% per position
const NOTIONAL_PER_TRADE = PORTFOLIO_USDT * POSITION_FRACTION; // $40
const ROUNDTRIP_FEES = 0.002; // 0.2% net (buy+sell)
const ENTRY_THRESHOLD = 65; // Threshold for backtest only

// Standalone exit helper consistent with fee-aware logic
function shouldExitSimple(entryPrice, currentPrice, indicators, holdBars) {
  const grossChange = (currentPrice - entryPrice) / entryPrice;
  const netChange = grossChange - ROUNDTRIP_FEES; // net after fees
  if (netChange >= 0.005) return true; // 0.5% net target
  if (holdBars >= 120) return true; // max hold 2h
  // momentum exhaustion / overbought from indicators
  if (indicators.williamsR > -20) return true;
  if (indicators.stochastic && indicators.stochastic.k > 80) return true;
  return false;
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

async function backtestSymbol(client, symbol) {
  const klines = await fetchKlines(client, symbol, '1m', 1440); // last 24h
  if (!klines.length || klines.length < 60) {
    return { symbol, trades: 0, wins: 0, losses: 0, pnlUsd: 0, days: 1, notes: 'no_data' };
  }

  const calc = new IndicatorCalculator();
  const entry = new EntryLogicEngine();

  let inPosition = false;
  let entryPrice = 0;
  let entryIndex = 0;
  let trades = 0;
  let wins = 0;
  let losses = 0;
  let pnlUsd = 0;

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
      // Use score directly with backtest-only threshold
      const score = entry.calculateEntryScore(indicators);
      const ok = score.total >= ENTRY_THRESHOLD;
      if (ok) {
        inPosition = true;
        entryPrice = price;
        entryIndex = i;
      }
    } else {
      const holdBars = i - entryIndex;
      if (shouldExitSimple(entryPrice, price, indicators, holdBars)) {
        const grossChange = (price - entryPrice) / entryPrice;
        const netChange = grossChange - ROUNDTRIP_FEES;
        const tradePnl = NOTIONAL_PER_TRADE * netChange;
        pnlUsd += tradePnl;
        trades += 1;
        if (tradePnl > 0) wins += 1; else losses += 1;
        inPosition = false;
      }
    }
  }

  // If still in position at the end, exit at last price
  if (inPosition) {
    const lastPrice = klines[klines.length - 1].close;
    const grossChange = (lastPrice - entryPrice) / entryPrice;
    const netChange = grossChange - ROUNDTRIP_FEES;
    const tradePnl = NOTIONAL_PER_TRADE * netChange;
    pnlUsd += tradePnl;
    trades += 1;
    if (tradePnl > 0) wins += 1; else losses += 1;
  }

  return { symbol, trades, wins, losses, pnlUsd, days: 1, notes: 'ok' };
}

async function main() {
  const symbols = ['OGUSDT', 'AVNTUSDT', 'ZROUSDT', 'SPKUSDT', 'STGUSDT'];
  const client = Binance({}); // public endpoints are fine

  const results = [];
  for (const s of symbols) {
    const r = await backtestSymbol(client, s);
    results.push(r);
  }

  const valid = results.filter(r => r.notes === 'ok');
  const totalTrades = valid.reduce((a, r) => a + r.trades, 0);
  const totalWins = valid.reduce((a, r) => a + r.wins, 0);
  const totalLosses = valid.reduce((a, r) => a + r.losses, 0);
  const totalPnl = valid.reduce((a, r) => a + r.pnlUsd, 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const dailyRoi = (totalPnl / PORTFOLIO_USDT) * 100;

  console.log(`\nBacktest (1m, last 24h, threshold=${ENTRY_THRESHOLD}) — trades/day, win%, PnL`);
  for (const r of results) {
    if (r.notes !== 'ok') {
      console.log(`- ${r.symbol}: N/A (${r.notes})`);
    } else {
      const wr = r.trades > 0 ? ((r.wins / r.trades) * 100).toFixed(1) : '0.0';
      const avg = r.trades > 0 ? (r.pnlUsd / r.trades) : 0;
      console.log(`- ${r.symbol}: trades=${r.trades}, win%=${wr}%, pnl=$${r.pnlUsd.toFixed(2)}, avg=$${avg.toFixed(2)}`);
    }
  }
  console.log(`Total: trades=${totalTrades}, wins=${totalWins}, losses=${totalLosses}, win%=${winRate.toFixed(1)}%, PnL=$${totalPnl.toFixed(2)}, ROI/day=${dailyRoi.toFixed(2)}%`);
}

main().catch(err => {
  console.error('Backtest failed:', err && err.message ? err.message : String(err));
});