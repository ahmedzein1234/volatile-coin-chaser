import Binance from 'binance-api-node';
import { config } from '../config';
import logger from './logger';

export class BinanceAPIService {
  private client: any;

  constructor() {
    this.client = Binance({
      apiKey: config.binance.apiKey,
      apiSecret: config.binance.secretKey
    });
  }

  async getAccountInfo(): Promise<any> {
    try {
      return await this.client.accountInfo();
    } catch (error) {
      logger.error('Error getting account info:', error);
      throw error;
    }
  }

  async getBalance(): Promise<number> {
    try {
      const account = await this.getAccountInfo();
      const usdtBalance = account.balances.find((b: any) => b.asset === 'USDT');
      return parseFloat(usdtBalance?.free || '0');
    } catch (error) {
      logger.error('Error getting balance:', error);
      throw error;
    }
  }

  async placeOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, type: 'MARKET' | 'LIMIT' = 'MARKET', price?: number): Promise<any> {
    try {
      // Ensure quantity is properly formatted
      const formattedQuantity = this.formatQuantity(quantity);
      
      const order: any = {
        symbol: symbol,
        side: side,
        type: type,
        quantity: formattedQuantity
      };

      if (type === 'LIMIT' && price) {
        order.price = price.toString();
        order.timeInForce = 'GTC';
      }

      logger.info(`Placing ${side} order for ${formattedQuantity} ${symbol} at ${price || 'market'}`);
      const result = await this.client.order(order);
      logger.info(`Order placed successfully:`, result);
      return result;
    } catch (error) {
      logger.error(`Error placing order for ${symbol}:`, error);
      throw error;
    }
  }

  private formatQuantity(quantity: number): string {
    // Remove trailing zeros and unnecessary decimal places
    return parseFloat(quantity.toFixed(8)).toString();
  }

  async getOrderStatus(symbol: string, orderId: number): Promise<any> {
    try {
      return await this.client.getOrder({ symbol, orderId });
    } catch (error) {
      logger.error(`Error getting order status for ${symbol}:`, error);
      throw error;
    }
  }

  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    try {
      logger.info(`Cancelling order ${orderId} for ${symbol}`);
      return await this.client.cancelOrder({ symbol, orderId });
    } catch (error) {
      logger.error(`Error cancelling order for ${symbol}:`, error);
      throw error;
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 100): Promise<any[]> {
    try {
      return await this.client.candles({ symbol, interval, limit });
    } catch (error) {
      logger.error(`Error getting klines for ${symbol}:`, error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    try {
      if (symbol === 'ALL') {
        return await this.client.dailyStats();
      }
      return await this.client.prices({ symbol });
    } catch (error) {
      logger.error(`Error getting 24hr ticker for ${symbol}:`, error);
      throw error;
    }
  }

  async getExchangeInfo(): Promise<any> {
    try {
      return await this.client.exchangeInfo();
    } catch (error) {
      logger.error('Error getting exchange info:', error);
      throw error;
    }
  }
}
