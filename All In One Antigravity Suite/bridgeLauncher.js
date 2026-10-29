const path = require('path');
const auditor = require('./logAuditor');

function startAllBridges() {
  auditor.info('BRIDGES', 'Initializing NexusFlow Core and YouTube Uploader local bridges...');

  // 1. Start NexusFlow Core Bridge (Port 48291)
  try {
    const coreBridgePath = path.resolve(__dirname, '..', 'NexusFlow Core App', 'localBridge.js');
    const { startBridge: startCoreBridge } = require(coreBridgePath);
    startCoreBridge(48291);
    auditor.success('BRIDGES', 'NexusFlow Core Bridge started on http://127.0.0.1:48291');
  } catch (e) {
    auditor.warn('BRIDGES', `NexusFlow Core Bridge start warning: ${e.message}`);
  }

  // 2. Start YouTube Uploader Bridge (Port 48292)
  try {
    const uploaderBridgePath = path.resolve(__dirname, '..', 'NexusFlow YouTube Uploader', 'localBridge.js');
    const { startBridge: startUploaderBridge } = require(uploaderBridgePath);
    startUploaderBridge(48292);
    auditor.success('BRIDGES', 'YouTube Uploader Bridge started on http://127.0.0.1:48292');
  } catch (e) {
    auditor.warn('BRIDGES', `YouTube Uploader Bridge start warning: ${e.message}`);
  }
}

if (require.main === module) {
  startAllBridges();
  console.log('Both bridges running in background.');
}

module.exports = { startAllBridges };
