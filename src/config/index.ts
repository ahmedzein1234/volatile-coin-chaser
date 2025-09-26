import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    secretKey: process.env.BINANCE_SECRET_KEY || '',
    testnet: process.env.BINANCE_TESTNET === 'true'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  trading: {
    maxPositions: parseInt(process.env.MAX_POSITIONS || '5'),
    maxRiskPerTrade: parseFloat(process.env.MAX_RISK_PER_TRADE || '0.02'),
    maxPortfolioRisk: parseFloat(process.env.MAX_PORTFOLIO_RISK || '0.10'),
    maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '0.05')
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/trading.log'
  }
};

export default config;

