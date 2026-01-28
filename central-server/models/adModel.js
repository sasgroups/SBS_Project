const db = require('../db');

// ✅ Get all ads with optional kiosk filtering
exports.getAllAds = async (kioskId = null) => {
  try {
    let query = 'SELECT * FROM ads WHERE 1=1';
    const params = [];
    
    if (kioskId !== null) {
      query += ' AND (kiosk_id = ? OR kiosk_id IS NULL)';
      params.push(kioskId);
    }
    
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    throw err;
  }
};

// ✅ Get ads for a specific kiosk (both global and kiosk-specific)
exports.getAdsByKiosk = async (kioskId) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ads WHERE kiosk_id = ? OR kiosk_id IS NULL ORDER BY created_at DESC',
      [kioskId]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

// ✅ Get only global ads (for all kiosks)
exports.getGlobalAds = async () => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ads WHERE kiosk_id IS NULL ORDER BY created_at DESC'
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

// ✅ Get only kiosk-specific ads
exports.getKioskSpecificAds = async (kioskId) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ads WHERE kiosk_id = ? ORDER BY created_at DESC',
      [kioskId]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

// ✅ Create a new ad (can be global or kiosk-specific)
exports.createAd = async (ad) => {
  const { filename, type, kiosk_id } = ad;
  try {
    const [result] = await db.execute(
      'INSERT INTO ads (filename, type, kiosk_id) VALUES (?, ?, ?)',
      [filename, type, kiosk_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// ✅ Delete ad by ID
exports.deleteAd = async (id) => {
  try {
    const [result] = await db.execute('DELETE FROM ads WHERE id = ?', [id]);
    return result;
  } catch (err) {
    throw err;
  }
};

// ✅ Delete all ads for a specific kiosk
exports.deleteAdsByKiosk = async (kioskId) => {
  try {
    const [result] = await db.execute('DELETE FROM ads WHERE kiosk_id = ?', [kioskId]);
    return result;
  } catch (err) {
    throw err;
  }
};