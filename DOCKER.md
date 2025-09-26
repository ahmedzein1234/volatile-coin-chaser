# 🐳 Docker Deployment Guide

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- Binance API credentials

### 2. Environment Setup
```bash
# Copy the Docker environment template
cp env.docker .env

# Edit .env with your Binance API credentials
# Set BINANCE_TESTNET=true for testing
```

### 3. Deploy with Docker Compose
```bash
# Start the application with Redis
npm run docker:up

# View logs
npm run docker:logs

# Stop the application
npm run docker:down
```

## 🚀 Deployment Options

### Production Deployment
```bash
# Build and start production containers
npm run docker:up

# Check status
docker-compose ps

# View logs
npm run docker:logs
```

### Development Deployment
```bash
# Start development environment with hot reload
npm run docker:dev

# This includes:
# - Hot reload for code changes
# - Development Redis instance
# - Debug logging
```

### Individual Docker Commands
```bash
# Build the image
npm run docker:build

# Run container manually
npm run docker:run

# Clean up everything
npm run docker:clean
```

## 📊 Services Included

### 1. Volatile Coin Chaser App
- **Container:** `volatile-coin-chaser-app`
- **Port:** 3000 (internal)
- **Features:** Full trading system with all indicators

### 2. Redis Database
- **Container:** `volatile-coin-chaser-redis`
- **Port:** 6379
- **Purpose:** Caching and data storage
- **Persistence:** Data persisted in Docker volume

### 3. Redis Commander (Optional)
- **Container:** `volatile-coin-chaser-redis-ui`
- **Port:** 8081
- **Purpose:** Redis management interface
- **Access:** http://localhost:8081

```bash
# Start Redis Commander
npm run docker:redis
```

## 🔧 Configuration

### Environment Variables
All configuration is done through environment variables:

```env
# Binance API (Required)
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
BINANCE_TESTNET=true

# Redis (Auto-configured for Docker)
REDIS_HOST=redis
REDIS_PORT=6379

# Trading Settings
MAX_POSITIONS=5
MAX_RISK_PER_TRADE=0.02
MAX_PORTFOLIO_RISK=0.10
MAX_DRAWDOWN=0.05
```

### Volume Mounts
- `./logs:/app/logs` - Application logs
- `./data:/app/data` - Daily coin data
- `./.env:/app/.env:ro` - Environment configuration

## 📈 Monitoring

### Health Checks
Both services include health checks:
- **App:** Checks if Node.js process is running
- **Redis:** Checks if Redis is responding to ping

### Logs
```bash
# View all logs
npm run docker:logs

# View specific service logs
docker-compose logs -f volatile-coin-chaser-app
docker-compose logs -f redis
```

### Status
```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats
```

## 🛠️ Management Commands

### Daily Coin Management
```bash
# Add coins (run inside container)
docker-compose exec volatile-coin-chaser-app npm run add-coin BTCUSDT high

# Check status
docker-compose exec volatile-coin-chaser-app npm run status

# View performance
docker-compose exec volatile-coin-chaser-app npm run performance
```

### Database Management
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# View Redis data
docker-compose exec redis redis-cli keys "*"
```

## 🔒 Security Features

### Container Security
- **Non-root user:** Application runs as `nodejs` user
- **Read-only volumes:** Environment file mounted read-only
- **Health checks:** Automatic restart on failure
- **Resource limits:** Configurable in docker-compose.yml

### Network Security
- **Isolated network:** Services communicate on private network
- **No external ports:** Only Redis exposed for management
- **Environment isolation:** Sensitive data in environment variables

## 🚨 Troubleshooting

### Common Issues

**1. Container won't start**
```bash
# Check logs
npm run docker:logs

# Rebuild containers
npm run docker:clean
npm run docker:up
```

**2. Redis connection issues**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

**3. API connection issues**
```bash
# Verify environment variables
docker-compose exec volatile-coin-chaser-app env | grep BINANCE

# Check network connectivity
docker-compose exec volatile-coin-chaser-app ping google.com
```

### Performance Tuning

**Memory Usage**
```bash
# Monitor memory usage
docker stats

# Adjust memory limits in docker-compose.yml
```

**Log Rotation**
```bash
# Configure log rotation in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 📋 Production Checklist

- [ ] Set `BINANCE_TESTNET=false` for live trading
- [ ] Configure proper API credentials
- [ ] Set up log rotation
- [ ] Configure monitoring and alerts
- [ ] Set up backup for Redis data
- [ ] Configure SSL/TLS if needed
- [ ] Set up health check endpoints
- [ ] Configure resource limits

## 🎯 Next Steps

1. **Configure API Keys:** Update `.env` with your Binance credentials
2. **Start Services:** Run `npm run docker:up`
3. **Add Coins:** Use the management commands to add daily coins
4. **Monitor:** Use `npm run docker:logs` to monitor the system
5. **Scale:** Adjust configuration as needed for your trading volume

Your Volatile Coin Chaser is now ready for Docker deployment! 🚀
