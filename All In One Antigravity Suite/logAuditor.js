const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { paths, ensureDirs } = require('./config');

class LogAuditor extends EventEmitter {
  constructor(maxEntries = 1000) {
    super();
    this.maxEntries = maxEntries;
    this.logs = [];
    this.subscribers = new Set();
    this.initFileStream();
  }

  initFileStream() {
    ensureDirs();
    try {
      if (fs.existsSync(paths.AUDIT_LOG_FILE)) {
        const stats = fs.statSync(paths.AUDIT_LOG_FILE);
        if (stats.size > 5 * 1024 * 1024) {
          // Rotate if > 5MB
          const oldFile = paths.AUDIT_LOG_FILE.replace('.log', `_${Date.now()}.log`);
          fs.renameSync(paths.AUDIT_LOG_FILE, oldFile);
        }
      }
    } catch (e) {}
  }

  log(level, subsystem, message, data = null) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      level: level.toUpperCase(), // INFO, STEP, MCP, FLOW, UPLOAD, WARN, SUCCESS, ERROR, AUDIT
      subsystem: subsystem || 'ANTIGRAVITY',
      message: typeof message === 'string' ? message : JSON.stringify(message),
      data: data || null
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxEntries) {
      this.logs.shift();
    }

    // Write to disk
    try {
      const line = `[${entry.timestamp}] [${entry.level}] [${entry.subsystem}] ${entry.message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
      fs.appendFileSync(paths.AUDIT_LOG_FILE, line, 'utf8');
    } catch (e) {}

    // Emit event and broadcast to SSE subscribers
    this.emit('entry', entry);
    for (const res of this.subscribers) {
      try {
        res.write(`data: ${JSON.stringify(entry)}\n\n`);
      } catch (e) {
        this.subscribers.delete(res);
      }
    }

    // Also output to console with color coding
    const colorCode = this.getColor(entry.level);
    console.log(`${colorCode}[${entry.timeFormatted}] [${entry.level}] [${entry.subsystem}] ${entry.message}\x1b[0m`);

    return entry;
  }

  getColor(level) {
    switch (level) {
      case 'STEP': return '\x1b[36m'; // Cyan
      case 'MCP': return '\x1b[35m';  // Magenta
      case 'FLOW': return '\x1b[34m'; // Blue
      case 'UPLOAD': return '\x1b[33m'; // Yellow
      case 'SUCCESS': return '\x1b[32m'; // Green
      case 'WARN': return '\x1b[33m'; // Yellow
      case 'ERROR': return '\x1b[31m'; // Red
      case 'AUDIT': return '\x1b[36m'; // Cyan
      default: return '\x1b[37m'; // White
    }
  }

  step(subsystem, message, data = null) {
    return this.log('STEP', subsystem, message, data);
  }

  mcp(subsystem, message, data = null) {
    return this.log('MCP', subsystem, message, data);
  }

  flow(message, data = null) {
    return this.log('FLOW', 'NEXUSFLOW_CORE', message, data);
  }

  upload(message, data = null) {
    return this.log('UPLOAD', 'YOUTUBE_UPLOADER', message, data);
  }

  info(subsystem, message, data = null) {
    return this.log('INFO', subsystem, message, data);
  }

  warn(subsystem, message, data = null) {
    return this.log('WARN', subsystem, message, data);
  }

  success(subsystem, message, data = null) {
    return this.log('SUCCESS', subsystem, message, data);
  }

  error(subsystem, message, data = null) {
    return this.log('ERROR', subsystem, message, data);
  }

  audit(subsystem, message, data = null) {
    return this.log('AUDIT', subsystem, message, data);
  }

  getRecentLogs(limit = 100, levelFilter = null) {
    let result = this.logs;
    if (levelFilter) {
      result = result.filter(l => l.level === levelFilter.toUpperCase());
    }
    return result.slice(-limit);
  }

  addSseClient(res) {
    this.subscribers.add(res);
    // Send initial snapshot of recent logs
    res.write(`data: ${JSON.stringify({ type: 'snapshot', logs: this.logs.slice(-50) })}\n\n`);
  }

  removeSseClient(res) {
    this.subscribers.delete(res);
  }
}

const auditor = new LogAuditor();
module.exports = auditor;
