const dotenv = require('dotenv');
dotenv.config();

const config = {
  // Server
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Client
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Security
  apiKey: process.env.API_KEY,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // Monitoring
  updateInterval: parseInt(process.env.UPDATE_INTERVAL_MS) || 2000,
  pingTimeout: parseInt(process.env.PING_TIMEOUT_MS) || 5000,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logToFile: process.env.LOG_TO_FILE === 'true',
  
  // Kiosk
  enableRealsense: process.env.ENABLE_REALSENSE === 'true',
  statusInterval: parseInt(process.env.STATUS_INTERVAL) || 10000,
  
  // Constants
  constants: {
    cpuWarning: 80,
    memoryWarning: 85,
    temperatureWarning: 80,
    networkLatencyWarning: 200,
    batteryWarning: 20,
  },
};

module.exports = config;