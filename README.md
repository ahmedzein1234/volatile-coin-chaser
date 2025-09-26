# 🚀 Volatile Coin Chaser

A high-frequency volatility extraction system for cryptocurrency trading that dynamically adapts to daily alpha coins and maximizes volatility extraction using advanced technical indicators.

## ✨ Features

### 🎯 Core Capabilities
- **Daily Alpha Integration**: Add up to 5 volatile coins daily
- **High-Frequency Monitoring**: Real-time price tracking via Binance WebSocket
- **Advanced Indicators**: 12+ sophisticated technical indicators
- **Aggressive Exit Logic**: Smart trailing stops with multiple exit conditions
- **Fee-Aware Trading**: Precise calculations including Binance fees (0.2%)
- **Risk Management**: 2% max risk per trade, 10% max portfolio risk

### 📊 Advanced Indicators
- **Williams %R**: Momentum oscillator for oversold/overbought detection
- **Commodity Channel Index (CCI)**: Volatility and trend strength
- **Rate of Change (ROC)**: Price momentum acceleration
- **On-Balance Volume (OBV)**: Volume flow analysis
- **Volume Price Trend (VPT)**: Volume-weighted momentum
- **Average True Range (ATR)**: Volatility measurement
- **Bollinger Band Squeeze**: Breakout detection
- **Keltner Channels**: Trend following with volatility
- **Relative Vigor Index (RVI)**: Momentum oscillator
- **Ultimate Oscillator**: Multi-timeframe momentum

### 🎲 Entry Logic (Confluence Scoring)
- **Momentum Indicators (40% weight)**: Williams %R, CCI, ROC, RVI
- **Volume Indicators (30% weight)**: OBV, VPT
- **Volatility Indicators (20% weight)**: ATR percentile, BB squeeze
- **Range Indicators (10% weight)**: Keltner touch, Ultimate Oscillator
- **Entry Threshold**: 70+ points out of 100

### 🚪 Exit Logic (Aggressive Multi-Condition)
- **Profit Targets**: 1.5% maximum profit
- **Momentum Exhaustion**: Williams %R > -20, CCI > 100, ROC < -1
- **Volume Exhaustion**: Volume < 50% of entry volume
- **Volatility Contraction**: ATR < 70% of entry ATR
- **Time Limits**: 30 minutes maximum hold time
- **Smart Trailing**: Progressive stops (0.3% → 0.5% → 0.8%)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd volatile-coin-chaser
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp env.example .env
# Edit .env with your Binance API credentials
```

4. **Build the project**
```bash
npm run build
```

## ⚙️ Configuration

### Environment Variables
```env
# Binance API Configuration
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here
BINANCE_TESTNET=false

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Trading Configuration
MAX_POSITIONS=5
MAX_RISK_PER_TRADE=0.02
MAX_PORTFOLIO_RISK=0.10
MAX_DRAWDOWN=0.05

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/trading.log
```

## 🚀 Usage

### Start the Trading Engine
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### Daily Coin Management
```bash
# Add a coin
npm run add-coin BTCUSDT high

# Remove a coin
npm run remove-coin BTCUSDT

# Check status
npm run status

# View performance
npm run performance
```

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `npm start` | Start the trading engine | - |
| `npm run dev` | Development mode with auto-reload | - |
| `npm run build` | Build TypeScript to JavaScript | - |
| `npm run add-coin` | Add a daily coin | `npm run add-coin ETHUSDT medium` |
| `npm run remove-coin` | Remove a daily coin | `npm run remove-coin ETHUSDT` |
| `npm run status` | Show system status | - |
| `npm run performance` | Show performance metrics | - |

## 🎯 Trading Strategy

### Entry Conditions
The system uses a confluence-based scoring system where multiple indicators must align:

1. **Momentum Confirmation**: Williams %R oversold, CCI oversold, strong ROC
2. **Volume Confirmation**: Positive OBV and VPT
3. **Volatility Confirmation**: High ATR percentile, BB squeeze potential
4. **Range Confirmation**: Keltner channel touch, Ultimate Oscillator oversold

### Exit Conditions (Priority Order)
1. **Profit Target**: 1.5% profit (highest priority)
2. **Momentum Exhaustion**: Overbought indicators
3. **Volume Exhaustion**: Volume drops below 50% of entry
4. **Volatility Contraction**: ATR drops below 70% of entry
5. **Time Limit**: 30 minutes maximum hold
6. **RSI Overbought**: RSI > 80
7. **MACD Divergence**: Bearish divergence
8. **Ultimate Oscillator**: Overbought conditions

### Risk Management
- **Position Sizing**: Kelly Criterion with volatility adjustment
- **Stop Loss**: ATR-based (2x ATR) or 2% fixed
- **Take Profit**: ATR-based (3x ATR) or 1.5% fixed
- **Trailing Stops**: Progressive tightening based on profit
- **Portfolio Risk**: Maximum 10% total exposure
- **Drawdown Limit**: 5% maximum drawdown

## 📊 Performance Monitoring

The system provides comprehensive performance tracking:

- **Real-time Status**: Active coins, positions, balance, risk
- **Performance Metrics**: Win rate, average profit/loss, Sharpe ratio
- **Risk Monitoring**: Portfolio risk, drawdown tracking
- **Trade History**: Complete trade log with reasons

## 🔧 Architecture

### Core Components
- **Trading Engine**: Main orchestrator
- **Indicator Engine**: Real-time technical analysis
- **Entry Logic**: Confluence-based scoring
- **Exit Logic**: Multi-condition aggressive exits
- **Position Manager**: Risk-aware position management
- **Daily Coin Manager**: Coin lifecycle management
- **Risk Manager**: Portfolio risk monitoring

### Data Flow
```
Binance WebSocket → Price Data → Indicators → Entry/Exit Logic → Position Manager → Binance API
```

## 🚨 Risk Warnings

- **High Risk**: This system is designed for aggressive volatility extraction
- **Market Risk**: Cryptocurrency markets are highly volatile
- **Technical Risk**: System failures could result in losses
- **API Risk**: Binance API issues could affect trading
- **Testing**: Always test with small amounts first

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the logs in `./logs/`
- Review the configuration

---

**⚠️ Disclaimer**: This software is for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. Use at your own risk.


