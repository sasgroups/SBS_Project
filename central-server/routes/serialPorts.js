// routes/serialPorts.js
const express = require('express');
const router = express.Router();
const { SerialPort } = require('serialport');

router.get('/', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    const names = ports.map(port => port.path); // e.g. COM3, /dev/ttyUSB0
    res.json(names);
  } catch (err) {
    console.error('Failed to list serial ports:', err);
    res.status(500).json({ error: 'Could not list serial ports' });
  }
});

module.exports = router;
