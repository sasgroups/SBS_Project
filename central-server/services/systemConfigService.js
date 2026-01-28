// services/systemConfigService.js
const db = require('../db'); // or whatever your DB connection file is

const getSystemConfig = async () => {
  const [rows] = await db.query('SELECT `key`, `value` FROM system_config');
  const config = {};
  rows.forEach(({ key, value }) => {
    config[key] = value;
  });
  return config;
};

module.exports = { getSystemConfig };
