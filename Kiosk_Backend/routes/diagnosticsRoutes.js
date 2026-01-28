const express = require('express');
const router = express.Router();
const si = require('systeminformation');

// Performance diagnostics
router.get('/performance', async (req, res) => {
  try {
    const [cpu, memory, processes, cpuTemp, fsSize] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.processes(),
      si.cpuTemperature(),
      si.fsSize()
    ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpu.currentLoad.toFixed(2),
        cores: cpu.cpus.length,
        temperature: cpuTemp.main || null
      },
      memory: {
        total: Math.round(memory.total / 1024 / 1024),
        used: Math.round(memory.used / 1024 / 1024),
        percentage: ((memory.used / memory.total) * 100).toFixed(2)
      },
      processes: processes.all,
      disks: fsSize.map(fs => ({
        fs: fs.fs,
        size: Math.round(fs.size / 1024 / 1024),
        used: Math.round(fs.used / 1024 / 1024),
        use: fs.use.toFixed(2) + '%'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Network diagnostics
router.get('/network', async (req, res) => {
  try {
    const [interfaces, stats, connections] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats(),
      si.networkConnections()
    ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      interfaces: interfaces.map(intf => ({
        iface: intf.iface,
        ip4: intf.ip4,
        ip6: intf.ip6,
        mac: intf.mac,
        speed: intf.speed || 0
      })),
      stats: stats.map(stat => ({
        iface: stat.iface,
        rx: Math.round(stat.rx_sec / 1024),
        tx: Math.round(stat.tx_sec / 1024)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// System diagnostics
router.get('/system', async (req, res) => {
  try {
    const [battery, graphics, osInfo] = await Promise.all([
      si.battery().catch(() => ({})),
      si.graphics().catch(() => ({})),
      si.osInfo()
    ]);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      battery: battery.percent ? {
        percent: battery.percent,
        isCharging: battery.isCharging,
        timeRemaining: battery.timeRemaining
      } : null,
      graphics: graphics.controllers || [],
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;