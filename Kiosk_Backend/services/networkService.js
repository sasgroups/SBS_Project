const si = require('systeminformation');
const ping = require('ping');
const logger = require('../utils/logger');
const config = require('../config');

const networkService = {
  // Get comprehensive network metrics
  getMetrics: async () => {
    try {
      logger.debug('Fetching network metrics');
      
      const [
        networkInterfaces,
        networkStats,
        networkConnections,
        defaultGateway
      ] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats(),
        si.networkConnections(),
        si.networkGatewayDefault()
      ]);

      // Ping test targets
      const pingTargets = [
        { host: '8.8.8.8', name: 'Google DNS' },
        { host: '1.1.1.1', name: 'Cloudflare DNS' },
        { host: 'google.com', name: 'Google' }
      ];

      const pingResults = await Promise.all(
        pingTargets.map(async (target) => {
          try {
            const result = await ping.promise.probe(target.host, {
              timeout: config.pingTimeout / 1000
            });
            return {
              ...target,
              alive: result.alive,
              time: result.time || null,
              packetLoss: result.packetLoss || 0
            };
          } catch (error) {
            logger.error(`Ping error for ${target.host}:`, error);
            return {
              ...target,
              alive: false,
              error: error.message
            };
          }
        })
      );

      // Calculate network strength
      const calculateStrength = (pingResult) => {
        if (!pingResult.alive) return 'disconnected';
        if (!pingResult.time) return 'unknown';
        if (pingResult.time < 50) return 'excellent';
        if (pingResult.time < 100) return 'good';
        if (pingResult.time < 200) return 'fair';
        return 'poor';
      };

      const primaryPing = pingResults.find(r => r.alive);
      const networkHealth = primaryPing ? 
        (primaryPing.time > config.constants.networkLatencyWarning ? 'warning' : 'healthy') : 
        'critical';

      return {
        interfaces: networkInterfaces.map(intf => ({
          iface: intf.iface,
          ip4: intf.ip4,
          ip6: intf.ip6,
          mac: intf.mac,
          internal: intf.internal,
          operstate: intf.operstate,
          type: intf.type,
          speed: intf.speed || 0
        })),
        statistics: networkStats.map(stat => ({
          iface: stat.iface,
          rx_bytes: Math.round(stat.rx_bytes / 1024 / 1024),
          tx_bytes: Math.round(stat.tx_bytes / 1024 / 1024),
          rx_sec: Math.round(stat.rx_sec / 1024),
          tx_sec: Math.round(stat.tx_sec / 1024)
        })),
        connections: networkConnections
          .filter(conn => conn.state === 'ESTABLISHED')
          .slice(0, 10)
          .map(conn => ({
            protocol: conn.protocol,
            localAddress: conn.localAddress,
            localPort: conn.localPort,
            peerAddress: conn.peerAddress,
            peerPort: conn.peerPort,
            state: conn.state
          })),
        gateway: defaultGateway,
        pingTests: pingResults,
        overall: {
          online: pingResults.some(r => r.alive),
          averageLatency: pingResults
            .filter(r => r.alive && r.time)
            .reduce((acc, r) => acc + r.time, 0) / 
            pingResults.filter(r => r.alive && r.time).length || 0,
          strength: calculateStrength(primaryPing || {}),
          health: networkHealth
        },
        bandwidth: {
          totalRx: networkStats.reduce((acc, stat) => acc + stat.rx_bytes, 0),
          totalTx: networkStats.reduce((acc, stat) => acc + stat.tx_bytes, 0),
          currentRx: networkStats.reduce((acc, stat) => acc + stat.rx_sec, 0),
          currentTx: networkStats.reduce((acc, stat) => acc + stat.tx_sec, 0)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching network metrics:', error);
      throw error;
    }
  },
  
  // Get quick network status
  getStatus: async () => {
    try {
      const [interfaces, defaultGateway] = await Promise.all([
        si.networkInterfaces(),
        si.networkGatewayDefault()
      ]);

      const activeInterface = interfaces.find(intf => 
        intf.ip4 && !intf.internal
      );

      return {
        online: !!activeInterface,
        interface: activeInterface?.iface || null,
        ip: activeInterface?.ip4 || null,
        gateway: defaultGateway || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting network status:', error);
      throw error;
    }
  }
};

module.exports = networkService;