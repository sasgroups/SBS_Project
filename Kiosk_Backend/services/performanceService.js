const si = require('systeminformation');
const os = require('os');
const logger = require('../utils/logger');
const config = require('../config');

const performanceService = {
  // Get comprehensive performance metrics
  getMetrics: async () => {
    try {
      logger.debug('Fetching performance metrics');
      
      const [
        cpuLoad,
        memory,
        processes,
        cpuTemperature,
        diskLayout,
        fsSize,
        currentLoad,
        networkStats
      ] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.processes(),
        si.cpuTemperature(),
        si.diskLayout(),
        si.fsSize(),
        si.currentLoad(),
        si.networkStats()
      ]);

      // Calculate health status
      const cpuHealth = cpuLoad.currentLoad > config.constants.cpuWarning ? 'warning' : 'healthy';
      const memoryHealth = ((memory.used / memory.total) * 100) > config.constants.memoryWarning ? 'warning' : 'healthy';
      const tempHealth = cpuTemperature.main > config.constants.temperatureWarning ? 'warning' : 'healthy';

      return {
        cpu: {
          usage: cpuLoad.currentLoad.toFixed(2),
          user: cpuLoad.currentLoadUser.toFixed(2),
          system: cpuLoad.currentLoadSystem.toFixed(2),
          idle: cpuLoad.currentLoadIdle.toFixed(2),
          cores: cpuLoad.cpus.length,
          temperature: cpuTemperature.main || null,
          speed: cpuLoad.cpus[0]?.speed || null,
          health: cpuHealth
        },
        memory: {
          total: Math.round(memory.total / 1024 / 1024),
          used: Math.round(memory.used / 1024 / 1024),
          free: Math.round(memory.free / 1024 / 1024),
          active: Math.round(memory.active / 1024 / 1024),
          available: Math.round(memory.available / 1024 / 1024),
          percentage: ((memory.used / memory.total) * 100).toFixed(2),
          health: memoryHealth,
          nodeProcess: {
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
          }
        },
        processes: {
          total: processes.all,
          running: processes.running,
          sleeping: processes.sleeping,
          top: processes.list.slice(0, 5).map(p => ({
            pid: p.pid,
            name: p.name,
            cpu: p.cpu.toFixed(2),
            mem: p.mem.toFixed(2)
          }))
        },
        disks: diskLayout.map(disk => ({
          name: disk.name,
          type: disk.type,
          vendor: disk.vendor,
          size: Math.round(disk.size / 1024 / 1024 / 1024) + ' GB'
        })),
        fileSystems: fsSize.map(fs => ({
          fs: fs.fs,
          type: fs.type,
          size: Math.round(fs.size / 1024 / 1024),
          used: Math.round(fs.used / 1024 / 1024),
          available: Math.round(fs.available / 1024 / 1024),
          use: fs.use.toFixed(2) + '%',
          mount: fs.mount
        })),
        system: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: Math.floor(os.uptime() / 60) + ' minutes',
          loadAverage: os.loadavg(),
          cpus: os.cpus().length,
          temperature: {
            main: cpuTemperature.main,
            cores: cpuTemperature.cores,
            max: cpuTemperature.max,
            health: tempHealth
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching performance metrics:', error);
      throw error;
    }
  },
  
  // Get quick performance snapshot
  getSnapshot: async () => {
    try {
      const [cpuLoad, memory] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);
      
      return {
        cpu: cpuLoad.currentLoad.toFixed(2),
        memory: ((memory.used / memory.total) * 100).toFixed(2),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting performance snapshot:', error);
      throw error;
    }
  }
};

module.exports = performanceService;