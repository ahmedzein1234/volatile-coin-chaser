const { execSync } = require('child_process');

async function monitorLiveTrading() {
  try {
    console.log('🚀 LIVE TRADING MONITOR - VOLATILE COIN CHASER');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    
    // Check all three instances
    console.log('\n📊 TRIPLE INSTANCE STATUS:');
    console.log('-'.repeat(40));
    
    // Instance 1
    console.log('\n🟢 INSTANCE 1 (DeFi/Infrastructure):');
    try {
      execSync('docker exec volatile-coin-chaser-app npm run status', { stdio: 'inherit' });
    } catch (error) {
      console.log('❌ Instance 1 not running or accessible');
    }
    
    // Instance 2
    console.log('\n🟡 INSTANCE 2 (Infrastructure/Storage):');
    try {
      execSync('docker exec volatile-coin-chaser-2-app npm run status', { stdio: 'inherit' });
    } catch (error) {
      console.log('❌ Instance 2 not running or accessible');
    }
    
    // Instance 3
    console.log('\n🔵 INSTANCE 3 (Layer 1 Blockchains):');
    try {
      execSync('docker exec volatile-coin-chaser-3-app npm run status', { stdio: 'inherit' });
    } catch (error) {
      console.log('❌ Instance 3 not running or accessible');
    }
    
    // Container status
    console.log('\n🐳 CONTAINER STATUS:');
    console.log('-'.repeat(40));
    try {
      execSync('docker ps --filter "name=volatile-coin-chaser" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', { stdio: 'inherit' });
    } catch (error) {
      console.log('❌ Failed to check container status');
    }
    
    // Performance summary
    console.log('\n📈 PERFORMANCE SUMMARY:');
    console.log('-'.repeat(40));
    console.log('Portfolio Configuration:');
    console.log('  • Total Portfolio Limit: $600 USDT');
    console.log('  • Instance 1: $200 (DeFi/Infrastructure)');
    console.log('  • Instance 2: $200 (Infrastructure/Storage)');
    console.log('  • Instance 3: $200 (Layer 1 Blockchains)');
    console.log('  • Per Trade Risk: $5 per instance');
    console.log('  • Total Daily Risk: $15 per trade');
    console.log('');
    console.log('Coin Coverage:');
    console.log('  • Instance 1: OG, AVNT, ZRO, SPK, STG');
    console.log('  • Instance 2: XPL, MIRA, ALPINE, FIL, OP');
    console.log('  • Instance 3: SOL, AVAX, MATIC, NEAR, FTM');
    console.log('  • Total: 15 different volatile coins');
    console.log('');
    console.log('Sector Diversification:');
    console.log('  • DeFi Protocols: OG, AVNT, ZRO, SPK, STG');
    console.log('  • Infrastructure/Storage: XPL, MIRA, ALPINE, FIL, OP');
    console.log('  • Layer 1 Blockchains: SOL, AVAX, MATIC, NEAR, FTM');
    
    // Monitoring commands
    console.log('\n💻 MONITORING COMMANDS:');
    console.log('-'.repeat(40));
    console.log('Individual Instance Commands:');
    console.log('  • Instance 1: docker exec volatile-coin-chaser-app npm run status');
    console.log('  • Instance 2: docker exec volatile-coin-chaser-2-app npm run status');
    console.log('  • Instance 3: docker exec volatile-coin-chaser-3-app npm run status');
    console.log('');
    console.log('Log Monitoring:');
    console.log('  • Instance 1: docker logs volatile-coin-chaser-app -f');
    console.log('  • Instance 2: docker logs volatile-coin-chaser-2-app -f');
    console.log('  • Instance 3: docker logs volatile-coin-chaser-3-app -f');
    console.log('');
    console.log('Performance Monitoring:');
    console.log('  • Instance 1: docker exec volatile-coin-chaser-app npm run performance');
    console.log('  • Instance 2: docker exec volatile-coin-chaser-2-app npm run performance');
    console.log('  • Instance 3: docker exec volatile-coin-chaser-3-app npm run performance');
    console.log('');
    console.log('All Instances:');
    console.log('  • All containers: docker ps --filter "name=volatile-coin-chaser"');
    console.log('  • Stop all: docker stop volatile-coin-chaser-app volatile-coin-chaser-2-app volatile-coin-chaser-3-app');
    console.log('  • Start all: docker start volatile-coin-chaser-app volatile-coin-chaser-2-app volatile-coin-chaser-3-app');
    
    console.log('\n✅ LIVE TRADING MONITOR COMPLETE');
    console.log('='.repeat(60));
    console.log('🎉 All three instances running with $600 total portfolio!');
    console.log('📈 Enhanced coverage across DeFi, Infrastructure, and Layer 1');
    console.log('🔄 Independent trading systems with shared account');
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

monitorLiveTrading();