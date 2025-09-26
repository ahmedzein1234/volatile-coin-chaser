import { VolatileCoinChaser } from './engine/trading-engine';
import logger from './services/logger';

async function main() {
  const tradingEngine = new VolatileCoinChaser();
  
  try {
    // Start the trading engine
    await tradingEngine.start();
    
    // Log system status
    const status = tradingEngine.getSystemStatus();
    logger.info('System Status:', status);
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await tradingEngine.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await tradingEngine.stop();
      process.exit(0);
    });
    
    // Log status every 5 minutes
    setInterval(() => {
      const status = tradingEngine.getSystemStatus();
      logger.info('System Status:', status);
    }, 300000);
    
  } catch (error) {
    logger.error('Failed to start trading engine:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Application failed to start:', error);
  process.exit(1);
});


