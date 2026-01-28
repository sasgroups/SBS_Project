const express = require('express');
const router = express.Router();
const si = require('systeminformation');

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const sendUpdate = async () => {
    try {
      const [cpu, memory] = await Promise.all([
        si.currentLoad(),
        si.mem()
      ]);
      
      res.write(`data: ${JSON.stringify({
        cpu: cpu.currentLoad.toFixed(2),
        memory: ((memory.used / memory.total) * 100).toFixed(2),
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      console.error('SSE error:', error);
    }
  };
  
  // Initial update
  sendUpdate();
  
  // Periodic updates
  const interval = setInterval(sendUpdate, 2000);
  
  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = router;