// server/diagnostics-api.js
const express = require('express');
const os = require('os');
const si = require('systeminformation');
const router = express.Router();

// Performance metrics endpoint
router.get('/api/diagnostics/performance', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const processes = await si.processes();
    
    res.json({
      cpu: {
        usage: cpu.currentLoad.toFixed(2),
        cores: cpu.cpus.length,
        user: cpu.currentLoadUser,
        system: cpu.currentLoadSystem
      },
      memory: {
        used: Math.round(mem.used / 1024 / 1024),
        total: Math.round(mem.total / 1024 / 1024),
        percentage: ((mem.used / mem.total) * 100).toFixed(2)
      },
      processes: processes.list.length,
      uptime: os.uptime(),
      platform: os.platform()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Network diagnostics endpoint
router.get('/api/diagnostics/network', async (req, res) => {
  try {
    const network = await si.networkStats();
    const interfaces = await si.networkInterfaces();
    
    res.json({
      stats: network[0],
      interfaces: interfaces.map(intf => ({
        iface: intf.iface,
        ip4: intf.ip4,
        ip6: intf.ip6,
        mac: intf.mac,
        speed: intf.speed
      })),
      connections: (await si.networkConnections()).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health endpoint
router.get('/api/diagnostics/system', async (req, res) => {
  try {
    const [cpuTemp, disk, battery] = await Promise.all([
      si.cpuTemperature(),
      si.fsSize(),
      si.battery().catch(() => null)
    ]);
    
    res.json({
      temperature: cpuTemp.main,
      disks: disk.map(d => ({
        fs: d.fs,
        size: Math.round(d.size / 1024 / 1024 / 1024),
        used: Math.round(d.used / 1024 / 1024 / 1024),
        use: d.use
      })),
      battery: battery ? {
        hasBattery: battery.hasBattery,
        cycleCount: battery.cycleCount,
        isCharging: battery.isCharging,
        percent: battery.percent,
        timeRemaining: battery.timeRemaining
      } : null,
      osInfo: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;