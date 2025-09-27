import WebSocket from 'ws';
import { PriceData } from '../types';
import logger from './logger';

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, (data: PriceData) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptionCheckInterval: NodeJS.Timeout | null = null;
  private lastMessageTime = 0;
  private connectionStatus = false;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr', {
          handshakeTimeout: 10000,
          perMessageDeflate: false
        });
        
        this.ws.on('open', () => {
          logger.info('Binance WebSocket connected');
          this.connectionStatus = true;
          this.reconnectAttempts = 0;
          this.lastMessageTime = Date.now();
          this.startHeartbeat();
          this.startSubscriptionCheck();
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.lastMessageTime = Date.now();
          logger.info(`Received raw WebSocket data: ${data.toString().substring(0, 200)}...`);
          try {
            const tickers = JSON.parse(data.toString());
            this.processTickerData(tickers);
          } catch (error) {
            logger.error('Error parsing ticker data:', error);
          }
        });

        this.ws.on('close', (code, reason) => {
          logger.warn(`Binance WebSocket disconnected: ${code} - ${reason}`);
          this.connectionStatus = false;
          this.stopHeartbeat();
          this.stopSubscriptionCheck();
          this.handleReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error('Binance WebSocket error:', error);
          this.connectionStatus = false;
          reject(error);
        });

        this.ws.on('ping', () => {
          logger.debug('Received ping from server');
          this.ws?.pong();
        });

        this.ws.on('pong', () => {
          logger.debug('Received pong from server');
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
        logger.info(`Processing ticker data for subscribed symbol: ${symbol}`);
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
      } else {
        logger.info(`Received ticker data for unsubscribed symbol: ${symbol}`);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
        if (this.ws && this.connectionStatus) {
        const timeSinceLastMessage = Date.now() - this.lastMessageTime;
        if (timeSinceLastMessage > 30000) { // 30 seconds without data
          logger.warn('No data received for 30 seconds, sending ping');
          this.ws.ping();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startSubscriptionCheck(): void {
    this.subscriptionCheckInterval = setInterval(() => {
      if (this.subscriptions.size > 0 && this.connectionStatus) {
        logger.debug(`Active subscriptions: ${Array.from(this.subscriptions.keys()).join(', ')}`);
      }
    }, 30000); // Check every 30 seconds
  }

  private stopSubscriptionCheck(): void {
    if (this.subscriptionCheckInterval) {
      clearInterval(this.subscriptionCheckInterval);
      this.subscriptionCheckInterval = null;
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
    this.stopHeartbeat();
    this.stopSubscriptionCheck();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.connectionStatus = false;
    logger.info('Binance WebSocket disconnected');
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN && this.connectionStatus;
  }
}

