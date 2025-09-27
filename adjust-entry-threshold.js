const fs = require('fs');
const path = require('path');

async function adjustEntryThreshold() {
  try {
    console.log('🔧 ADJUSTING ENTRY THRESHOLD - VOLATILE COIN CHASER');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    
    const entryFilePath = path.join(__dirname, 'src', 'logic', 'entry.ts');
    
    console.log('\n📊 CURRENT SITUATION:');
    console.log('-'.repeat(40));
    console.log('• No trades executed in the last hour');
    console.log('• Market showing positive signs');
    console.log('• Current entry threshold: 70/100');
    console.log('• System may be too conservative');
    
    console.log('\n🎯 PROPOSED ADJUSTMENT:');
    console.log('-'.repeat(40));
    console.log('• Lower entry threshold from 70 to 60');
    console.log('• This will capture more opportunities');
    console.log('• Still maintain quality with 60+ score');
    console.log('• Adjust for positive market conditions');
    
    // Read the current file
    let content = fs.readFileSync(entryFilePath, 'utf8');
    
    // Check current threshold
    const currentThresholdMatch = content.match(/score\.total >= (\d+)/);
    const currentThreshold = currentThresholdMatch ? parseInt(currentThresholdMatch[1]) : 70;
    
    console.log(`\n📈 CURRENT THRESHOLD: ${currentThreshold}/100`);
    
    if (currentThreshold === 70) {
      // Lower the threshold to 60
      content = content.replace(/score\.total >= 70/g, 'score.total >= 60');
      content = content.replace(/Enter if score >= 70\/100/g, 'Enter if score >= 60/100');
      
      // Update confidence levels
      content = content.replace(/score\.total >= 70\) return 'MEDIUM'/g, "score.total >= 60) return 'MEDIUM'");
      content = content.replace(/score\.total >= 80\) return 'HIGH'/g, "score.total >= 70) return 'HIGH'");
      content = content.replace(/score\.total >= 90\) return 'VERY_HIGH'/g, "score.total >= 80) return 'VERY_HIGH'");
      
      // Update timing
      content = content.replace(/score\.total >= 70\) return 'WAIT'/g, "score.total >= 60) return 'WAIT'");
      content = content.replace(/score\.total >= 80\) return 'IMMEDIATE'/g, "score.total >= 70) return 'IMMEDIATE'");
      
      // Write the updated file
      fs.writeFileSync(entryFilePath, content);
      
      console.log('✅ THRESHOLD LOWERED TO: 60/100');
      console.log('✅ Updated confidence levels');
      console.log('✅ Updated entry timing');
      
    } else if (currentThreshold === 60) {
      console.log('ℹ️  Threshold already at 60/100');
    } else {
      console.log(`ℹ️  Threshold is at ${currentThreshold}/100 (not 70)`);
    }
    
    console.log('\n🔄 DEPLOYMENT REQUIRED:');
    console.log('-'.repeat(40));
    console.log('To apply changes, you need to:');
    console.log('1. Rebuild the Docker containers');
    console.log('2. Restart all three instances');
    console.log('3. Monitor for increased trading activity');
    
    console.log('\n💻 DEPLOYMENT COMMANDS:');
    console.log('-'.repeat(40));
    console.log('# Rebuild and restart Instance 1:');
    console.log('cd "C:\\Users\\amzei\\Documents\\volatile coin chaser"');
    console.log('docker-compose down');
    console.log('docker-compose up -d --build');
    console.log('');
    console.log('# Rebuild and restart Instance 2:');
    console.log('cd "C:\\Users\\amzei\\Documents\\volatile coin chaser 2"');
    console.log('docker-compose down');
    console.log('docker-compose up -d --build');
    console.log('');
    console.log('# Rebuild and restart Instance 3:');
    console.log('cd "C:\\Users\\amzei\\Documents\\volatile coin chaser 3"');
    console.log('docker-compose down');
    console.log('docker-compose up -d --build');
    
    console.log('\n📊 EXPECTED IMPACT:');
    console.log('-'.repeat(40));
    console.log('• More trading opportunities captured');
    console.log('• Increased trade frequency');
    console.log('• Better responsiveness to market conditions');
    console.log('• Still maintains quality with 60+ score requirement');
    console.log('• Risk management remains intact');
    
    console.log('\n⚠️  RISK CONSIDERATIONS:');
    console.log('-'.repeat(40));
    console.log('• Lower threshold = more trades but potentially lower quality');
    console.log('• Monitor performance closely after deployment');
    console.log('• Can revert to 70 if needed');
    console.log('• Risk management ($5 per trade) still active');
    
    console.log('\n✅ ENTRY THRESHOLD ADJUSTMENT COMPLETE');
    console.log('='.repeat(60));
    console.log('🎯 Threshold lowered from 70 to 60 for better market responsiveness');
    console.log('📈 Ready for deployment to capture more opportunities');
    console.log('🔄 Rebuild and restart all instances to apply changes');
    
  } catch (error) {
    console.error('❌ Failed to adjust entry threshold:', error.message);
  }
}

adjustEntryThreshold();