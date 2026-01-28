const db = require('../db'); // Your mysql2/promise connection

// Get all page timeouts
const getAllPageTimeouts = async () => {
  const [rows] = await db.query('SELECT * FROM page_timeout');
  return rows;
};

// Update by ID
const updatePageTimeout = async (id, data) => {
  const { page_time, cofrom_time } = data;
  const [result] = await db.query(
    'UPDATE page_timeout SET page_time = ?, cofrom_time = ?, updated_at = NOW() WHERE id = ?',
    [page_time, cofrom_time, id]
  );
  return result;
};

module.exports = {
  getAllPageTimeouts,
  updatePageTimeout
};
