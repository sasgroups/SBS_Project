const performanceService = require('./performanceService');
const networkService = require('./networkService');
const systemService = require('./systemService');
const logger = require('../utils/logger');

const diagnosticsService = {
  // Get performance data
  getPerformance: async () => {
    try {
      logger.debug('Getting performance data');
      return await performanceService.getMetrics();
    } catch (error) {
      logger.error('Error in getPerformance:', error);
      throw error;
    }
  },
  
  // Get network data
  getNetwork: async () => {
    try {
      logger.debug('Getting network data');
      return await networkService.getMetrics();
    } catch (error) {
      logger.error('Error in getNetwork:', error);
      throw error;
    }
  },
  
  // Get system data
  getSystem: async () => {
    try {
      logger.debug('Getting system data');
      return await systemService.getMetrics();
    } catch (error) {
      logger.error('Error in getSystem:', error);
      throw error;
    }
  },
  
  // Get application data
  getApplication: () => {
    try {
      logger.debug('Getting application data');
      return {
        nodejs: {
          version: process.version,
          pid: process.pid,
          uptime: process.uptime(),
          memory: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
          }
        },
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      logger.error('Error in getApplication:', error);
      throw error;
    }
  }
};

module.exports = diagnosticsService;