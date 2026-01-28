const db = require('../db');

// GET /api/system-config
const getSystemConfig = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM system_config');
    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });

    res.json(config);
  } catch (err) {
    console.error('Error fetching system config:', err);
    res.status(500).json({ message: 'Failed to fetch system configuration' });
  }
};

// PUT /api/system-config
const saveSystemConfig = async (req, res) => {
  const config = req.body;

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ message: 'Invalid configuration data' });
  }

  try {
    const promises = Object.entries(config).map(([key, value]) => {
      return db.query(
        'INSERT INTO system_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, value, value]
      );
    });

    await Promise.all(promises);

    console.log('System configuration saved:', config);

    res.status(200).json({ message: 'Configuration saved successfully', saved: config });
  } catch (err) {
    console.error('Error saving system config:', err);
    res.status(500).json({ message: 'Failed to save configuration' });
  }
};

module.exports = { getSystemConfig, saveSystemConfig };
