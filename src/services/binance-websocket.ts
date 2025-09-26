import WebSocket from 'ws';
import { PriceData } from '../types';
import logger from './logger';

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, (data: PriceData) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
        
        this.ws.on('open', () => {
          logger.info('Binance WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const tickers = JSON.parse(data.toString());
            this.processTickerData(tickers);
          } catch (error) {
            logger.error('Error parsing ticker data:', error);
          }
        });

        this.ws.on('close', () => {
          logger.warn('Binance WebSocket disconnected');
          this.handleReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error('Binance WebSocket error:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to connect to Binance WebSocket:', error);
        reject(error);
      }
    });
  }

  private processTickerData(tickers: any[]): void {
    for (const ticker of tickers) {
      const symbol = ticker.s;
      const callback = this.subscriptions.get(symbol);
      
      if (callback) {
        const priceData: PriceData = {
          symbol: symbol,
          price: parseFloat(ticker.c),
          volume: parseFloat(ticker.v),
          high: parseFloat(ticker.h),
          low: parseFloat(ticker.l),
          open: parseFloat(ticker.o),
          close: parseFloat(ticker.c),
          timestamp: Date.now()
        };
        
        callback(priceData);
      }
    }
  }

  subscribeToCoin(symbol: string, callback: (data: PriceData) => void): void {
    this.subscriptions.set(symbol, callback);
    logger.info(`Subscribed to ${symbol}`);
  }

  unsubscribeFromCoin(symbol: string): void {
    this.subscriptions.delete(symbol);
    logger.info(`Unsubscribed from ${symbol}`);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          logger.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    logger.info('Binance WebSocket disconnected');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

