const PageTimeout = require('../models/PageTimeout');

// GET all timeouts
exports.getAllPageTimeouts = async (req, res) => {
  try {
    const rows = await PageTimeout.getAllPageTimeouts();
    res.json(rows);
  } catch (err) {
    console.error('Error getting timeouts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT update timeout
exports.updatePageTimeout = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    await PageTimeout.updatePageTimeout(id, data);
    res.json({ success: true, message: 'Page timeout updated' });
  } catch (err) {
    console.error('Error updating timeout:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
