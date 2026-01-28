const diagnosticsService = require('../services/diagnosticsService');
const logger = require('../utils/logger');

const diagnosticsController = {
  // Get performance diagnostics
  getPerformance: async (req, res) => {
    try {
      logger.info('Fetching performance diagnostics');
      const data = await diagnosticsService.getPerformance();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      logger.error('Error in getPerformance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance data'
      });
    }
  },
  
  // Get network diagnostics
  getNetwork: async (req, res) => {
    try {
      logger.info('Fetching network diagnostics');
      const data = await diagnosticsService.getNetwork();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      logger.error('Error in getNetwork:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch network data'
      });
    }
  },
  
  // Get system health
  getSystem: async (req, res) => {
    try {
      logger.info('Fetching system diagnostics');
      const data = await diagnosticsService.getSystem();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      logger.error('Error in getSystem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system data'
      });
    }
  },
  
  // Get application diagnostics
  getApplication: async (req, res) => {
    try {
      logger.info('Fetching application diagnostics');
      const data = await diagnosticsService.getApplication();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      logger.error('Error in getApplication:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch application data'
      });
    }
  },
  
  // Get all diagnostics at once
  getAll: async (req, res) => {
    try {
      logger.info('Fetching all diagnostics');
      const [performance, network, system, application] = await Promise.all([
        diagnosticsService.getPerformance(),
        diagnosticsService.getNetwork(),
        diagnosticsService.getSystem(),
        diagnosticsService.getApplication()
      ]);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          performance,
          network,
          system,
          application
        }
      });
    } catch (error) {
      logger.error('Error in getAll:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch diagnostics data'
      });
    }
  }
};

module.exports = diagnosticsController;