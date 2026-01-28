const si = require('systeminformation');
const os = require('os');
const logger = require('../utils/logger');
const config = require('../config');

const systemService = {
  // Get comprehensive system metrics
  getMetrics: async () => {
    try {
      logger.debug('Fetching system metrics');
      
      const [
        battery,
        graphics,
        usb,
        bluetooth,
        time,
        cpuTemperature,
        blockDevices
      ] = await Promise.all([
        si.battery().catch(() => ({})),
        si.graphics().catch(() => ({})),
        si.usb().catch(() => []),
        si.bluetoothDevices().catch(() => []),
        si.time(),
        si.cpuTemperature(),
        si.blockDevices()
      ]);

      // Detect controllers
      const controllers = blockDevices.filter(device => 
        device.name?.toLowerCase().includes('gamepad') ||
        device.name?.toLowerCase().includes('controller') ||
        device.name?.toLowerCase().includes('xbox') ||
        device.name?.toLowerCase().includes('playstation')
      ).map(device => ({
        name: device.name,
        type: 'gamepad',
        connected: true,
        size: Math.round(device.size / 1024 / 1024 / 1024) + ' GB'
      }));

      // Get connected gamepads via getGamepads (for browsers, but we can simulate)
      const mockGamepads = [
        { id: 'Xbox Controller', connected: true, buttons: 14, axes: 6 },
        { id: 'PlayStation Controller', connected: true, buttons: 16, axes: 4 }
      ];

      // Calculate battery health
      const batteryHealth = battery.percent ? 
        (battery.percent < config.constants.batteryWarning ? 'warning' : 'healthy') : 
        'unknown';

      return {
        battery: battery.percent ? {
          hasBattery: battery.hasBattery,
          isCharging: battery.isCharging,
          percent: battery.percent,
          voltage: battery.voltage,
          timeRemaining: battery.timeRemaining,
          acConnected: battery.acConnected,
          health: batteryHealth
        } : null,
        graphics: graphics.controllers?.map(gpu => ({
          vendor: gpu.vendor,
          model: gpu.model,
          bus: gpu.bus,
          vram: Math.round(gpu.vram / 1024),
          temperature: gpu.temperatureGpu
        })) || [],
        controllers: [
          ...controllers,
          ...mockGamepads.map((pad, idx) => ({
            ...pad,
            index: idx,
            timestamp: new Date().toISOString()
          }))
        ],
        usbDevices: usb.slice(0, 10).map(device => ({
          name: device.name,
          type: device.type,
          vendorId: device.vendorId
        })),
        bluetoothDevices: bluetooth.map(device => ({
          name: device.name,
          mac: device.mac,
          connected: device.connected
        })),
        time: {
          current: time.current,
          uptime: time.uptime,
          timezone: time.timezone
        },
        sensors: {
          cpu: cpuTemperature.main,
          cores: cpuTemperature.cores,
          max: cpuTemperature.max,
          health: cpuTemperature.main > config.constants.temperatureWarning ? 'warning' : 'healthy'
        },
        os: {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          type: os.type(),
          version: os.version(),
          totalmem: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
          freemem: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching system metrics:', error);
      throw error;
    }
  },
  
  // Get system health summary
  getHealth: async () => {
    try {
      const [cpuTemp, memory, battery] = await Promise.all([
        si.cpuTemperature(),
        si.mem(),
        si.battery().catch(() => ({}))
      ]);

      const issues = [];
      
      if (cpuTemp.main > config.constants.temperatureWarning) {
        issues.push(`High CPU temperature: ${cpuTemp.main}°C`);
      }
      
      if ((memory.used / memory.total) * 100 > config.constants.memoryWarning) {
        issues.push(`High memory usage: ${((memory.used / memory.total) * 100).toFixed(2)}%`);
      }
      
      if (battery.percent && battery.percent < config.constants.batteryWarning) {
        issues.push(`Low battery: ${battery.percent}%`);
      }

      return {
        health: issues.length === 0 ? 'healthy' : 'warning',
        issues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      throw error;
    }
  }
};

module.exports = systemService;