const logger = require('../utils/logger');

const healthController = {
  check: (req, res) => {
    try {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      };
      
      logger.debug('Health check requested');
      res.json(health);
    } catch (error) {
      logger.error('Health check error:', error);
      res.status(503).json({
        status: 'ERROR',
        error: error.message
      });
    }
  }
};

module.exports = healthController;