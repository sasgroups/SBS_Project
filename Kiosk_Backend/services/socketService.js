const si = require('systeminformation');
const logger = require('../utils/logger');

let io;

const socketService = {
  // Initialize Socket.io
  initialize: (socketIo) => {
    io = socketIo;
    
    io.on('connection', (socket) => {
      logger.info(`Diagnostics client connected: ${socket.id}`);
      
      // Send initial diagnostics
      socketService.sendInitialDiagnostics(socket);
      
      // Set up periodic updates
      const updateInterval = setInterval(() => {
        socketService.sendRealtimeDiagnostics(socket);
      }, parseInt(process.env.UPDATE_INTERVAL_MS) || 2000);
      
      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Diagnostics client disconnected: ${socket.id}`);
        clearInterval(updateInterval);
      });
    });
    
    logger.info('Diagnostics socket service initialized');
  },
  
  // Send initial data to client
  sendInitialDiagnostics: async (socket) => {
    try {
      const [cpu, memory, network] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkStats()
      ]);
      
      const initialData = {
        type: 'initial',
        data: {
          cpu: cpu.currentLoad.toFixed(2),
          memory: ((memory.used / memory.total) * 100).toFixed(2),
          memoryUsed: Math.round(memory.used / 1024 / 1024),
          memoryTotal: Math.round(memory.total / 1024 / 1024),
          network: network[0] ? {
            rx: Math.round(network[0].rx_sec / 1024),
            tx: Math.round(network[0].tx_sec / 1024)
          } : null
        },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('diagnostics-data', initialData);
    } catch (error) {
      logger.error('Error sending initial diagnostics:', error);
      socket.emit('error', { message: 'Failed to get initial data' });
    }
  },
  
  // Send real-time updates
  sendRealtimeDiagnostics: async (socket) => {
    try {
      const [cpu, memory, network] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkStats()
      ]);
      
      const updateData = {
        type: 'update',
        data: {
          cpu: cpu.currentLoad.toFixed(2),
          memory: ((memory.used / memory.total) * 100).toFixed(2),
          network: network[0] ? {
            rx: Math.round(network[0].rx_sec / 1024),
            tx: Math.round(network[0].tx_sec / 1024)
          } : null
        },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('diagnostics-data', updateData);
    } catch (error) {
      logger.error('Error sending real-time update:', error);
    }
  },
  
  // Broadcast to all connected clients
  broadcast: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  }
};

module.exports = socketService;