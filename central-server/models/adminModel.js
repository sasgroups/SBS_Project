const db = require('../db');

const findAdminByEmail = (email, callback) => {
  db.execute('SELECT * FROM admins WHERE email = ?', [email], callback);
};

module.exports = { findAdminByEmail };
