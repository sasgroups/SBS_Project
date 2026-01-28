// controllers/adController.js - COMPLETE WORKING VERSION WITH WEBSOCKET (NO TITLE/DESCRIPTION)
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');

// ✅ Get all ads for admin panel
exports.getAllAds = async (req, res) => {
  try {
    const { kiosk_id, type } = req.query;
    
    let query = `
      SELECT 
        a.*,
        k.name as kiosk_name,
        k.location,
        CASE 
          WHEN a.kiosk_id IS NULL THEN 'Global'
          ELSE 'Kiosk-specific'
        END as scope
      FROM ads a
      LEFT JOIN kiosks k ON a.kiosk_id = k.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (kiosk_id) {
      query += ' AND (a.kiosk_id = ? OR a.kiosk_id IS NULL)';
      params.push(kiosk_id);
    }
    
    if (type) {
      query += ' AND a.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY a.kiosk_id, a.created_at DESC';
    
    const [ads] = await db.execute(query, params);
    
    // Add URLs
    const adsWithUrls = ads.map(ad => ({
      ...ad,
      url: `${req.protocol}://${req.get('host')}/uploads/${ad.filename}`,
      thumbnail_url: ad.type === 'video' 
        ? `${req.protocol}://${req.get('host')}/api/ads/thumbnail/${ad.id}`
        : `${req.protocol}://${req.get('host')}/uploads/${ad.filename}`
    }));
    
    res.json({
      success: true,
      ads: adsWithUrls,
      count: adsWithUrls.length
    });
  } catch (err) {
    console.error('Error fetching ads:', err);
    res.status(500).json({ error: 'Error fetching ads' });
  }
};

// ✅ Get ads for specific kiosk
exports.getAdsForKiosk = async (req, res) => {
  try {
    const { kioskId } = req.params;
    const { include_metadata = 'false' } = req.query;
    
    if (!kioskId) {
      return res.status(400).json({ error: 'Kiosk ID is required' });
    }

    const [ads] = await db.execute(`
      SELECT 
        a.*,
        CASE 
          WHEN a.kiosk_id IS NULL THEN 'global'
          ELSE 'kiosk-specific'
        END as ad_type
      FROM ads a
      WHERE (a.kiosk_id IS NULL OR a.kiosk_id = ?)
      ORDER BY 
        a.kiosk_id DESC,
        a.created_at DESC
    `, [kioskId]);

    if (include_metadata === 'true') {
      const adsWithMetadata = await Promise.all(
        ads.map(async (ad) => {
          const filePath = path.join(__dirname, '../uploads/', ad.filename);
          try {
            const stats = fs.statSync(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
            
            return {
              ...ad,
              file_hash: hash,
              file_size: stats.size,
              last_modified: stats.mtime.toISOString(),
              url: `${req.protocol}://${req.get('host')}/uploads/${ad.filename}`,
              download_url: `${req.protocol}://${req.get('host')}/api/ads/download/${ad.id}?kioskId=${kioskId}`
            };
          } catch (err) {
            console.error(`Error reading file ${ad.filename}:`, err);
            return { ...ad, file_hash: null };
          }
        })
      );
      
      const validAds = adsWithMetadata.filter(ad => ad.file_hash !== null);
      
      res.json({
        success: true,
        kiosk_id: kioskId,
        ads: validAds,
        count: validAds.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        kiosk_id: kioskId,
        ads: ads,
        count: ads.length
      });
    }
  } catch (err) {
    console.error('Error fetching kiosk ads:', err);
    res.status(500).json({ error: 'Error fetching advertisements' });
  }
};

// ✅ Get sync delta
exports.getSyncDelta = async (req, res) => {
  try {
    const { kioskId } = req.params;
    const { last_sync } = req.query;
    
    if (!kioskId) {
      return res.status(400).json({ error: 'Kiosk ID is required' });
    }

    const [ads] = await db.execute(`
      SELECT a.* FROM ads a
      WHERE (a.kiosk_id IS NULL OR a.kiosk_id = ?)
    `, [kioskId]);

    const syncData = {
      kiosk_id: parseInt(kioskId),
      timestamp: new Date().toISOString(),
      ads: []
    };

    for (const ad of ads) {
      const filePath = path.join(__dirname, '../uploads/', ad.filename);
      try {
        const stats = fs.statSync(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        
        const shouldInclude = !last_sync || 
          new Date(stats.mtime) > new Date(last_sync) ||
          !ad.file_hash || 
          ad.file_hash !== hash;

        if (shouldInclude) {
          syncData.ads.push({
            id: ad.id,
            filename: ad.filename,
            type: ad.type,
            kiosk_id: ad.kiosk_id,
            file_hash: hash,
            file_size: stats.size,
            last_modified: stats.mtime.toISOString(),
            is_global: ad.kiosk_id === null
          });
        }
      } catch (err) {
        console.error(`Error processing ad ${ad.id}:`, err);
      }
    }

    res.json(syncData);
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
};

// ✅ Bulk download
exports.bulkDownload = async (req, res) => {
  try {
    const { kioskId } = req.params;
    
    if (!kioskId) {
      return res.status(400).json({ error: 'Kiosk ID is required' });
    }

    const [ads] = await db.execute(`
      SELECT a.* FROM ads a
      WHERE (a.kiosk_id IS NULL OR a.kiosk_id = ?)
    `, [kioskId]);

    const adsWithUrls = ads.map(ad => ({
      ...ad,
      download_url: `${req.protocol}://${req.get('host')}/api/ads/download/${ad.id}?kioskId=${kioskId}`,
      direct_url: `${req.protocol}://${req.get('host')}/uploads/${ad.filename}`
    }));
    
    res.json({
      success: true,
      kiosk_id: parseInt(kioskId),
      ads: adsWithUrls,
      count: ads.length,
      sync_timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Bulk download error:', err);
    res.status(500).json({ error: 'Bulk download failed' });
  }
};

// ✅ Check for updates
exports.checkForUpdates = async (req, res) => {
  try {
    const { kioskId } = req.params;
    const { last_sync } = req.query;
    
    if (!kioskId || !last_sync) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const [[{ modified_count }]] = await db.execute(`
      SELECT COUNT(*) as modified_count FROM ads 
      WHERE (kiosk_id IS NULL OR kiosk_id = ?)
        AND updated_at > ?
    `, [kioskId, last_sync]);

    res.json({
      success: true,
      kiosk_id: parseInt(kioskId),
      has_updates: modified_count > 0,
      modified_count: modified_count,
      last_checked: new Date().toISOString()
    });
  } catch (err) {
    console.error('Check updates error:', err);
    res.status(500).json({ error: 'Check failed' });
  }
};

// ✅ Upload ad (global or kiosk-specific) WITH WEBSOCKET
exports.uploadAd = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const { kiosk_id } = req.body;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Set file type
    const type = file.mimetype.startsWith('video') ? 'video' : 'image';
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${type}_${timestamp}_${randomString}${fileExtension}`;
    
    const uploadPath = path.join(__dirname, '../uploads/', uniqueFilename);

    // Move the file
    await file.mv(uploadPath);

    // Generate file hash
    const fileBuffer = fs.readFileSync(uploadPath);
    const file_hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const file_size = file.size;

    // Parse kiosk_id (null for global ads)
    const parsedKioskId = kiosk_id && kiosk_id !== '' ? parseInt(kiosk_id) : null;

    // Check if kiosk exists (if kiosk-specific ad)
    if (parsedKioskId) {
      const [kiosk] = await db.execute('SELECT id FROM kiosks WHERE id = ?', [parsedKioskId]);
      if (kiosk.length === 0) {
        fs.unlinkSync(uploadPath); // Clean up
        return res.status(404).json({ error: 'Kiosk not found' });
      }
    }

    // Insert into database (without title and description)
    const [result] = await db.execute(
      `INSERT INTO ads (filename, type, kiosk_id, file_hash, file_size) VALUES (?, ?, ?, ?, ?)`,
      [uniqueFilename, type, parsedKioskId, file_hash, file_size]
    );

    // Get the socket.io instance
    const io = req.app.get('socketio');
    
    const newAd = {
      id: result.insertId,
      filename: uniqueFilename,
      type: type,
      kiosk_id: parsedKioskId,
      is_global: parsedKioskId === null,
      file_hash: file_hash,
      file_size: file_size,
      url: `${req.protocol}://${req.get('host')}/uploads/${uniqueFilename}`,
      download_url: `${req.protocol}://${req.get('host')}/api/ads/download/${result.insertId}?kioskId=${parsedKioskId || ''}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Emit WebSocket event
    if (io) {
      if (parsedKioskId === null) {
        // Global ad - send to all connected kiosks
        io.emit('global_ad_updated', {
          type: 'ADDED',
          ad: newAd,
          timestamp: new Date().toISOString()
        });
        console.log(`📢 Global ad uploaded: ${uniqueFilename}, emitted to all kiosks`);
      } else {
        // Targeted ad - send to specific kiosk room
        io.to(`kiosk_${parsedKioskId}`).emit('ad_updated', {
          type: 'ADDED',
          ad: newAd,
          timestamp: new Date().toISOString()
        });
        console.log(`📢 Kiosk-specific ad uploaded: ${uniqueFilename}, emitted to kiosk ${parsedKioskId}`);
      }
    }

    res.json({
      success: true,
      message: parsedKioskId ? 'Kiosk-specific ad uploaded' : 'Global ad uploaded',
      ad: newAd
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: 'Error uploading file',
      details: err.message 
    });
  }
};

// ✅ Download ad for caching
exports.downloadAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { kioskId } = req.query;

    const [rows] = await db.execute(
      `SELECT filename, kiosk_id FROM ads WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const ad = rows[0];
    
    // Check if ad is accessible to this kiosk
    if (ad.kiosk_id && ad.kiosk_id !== parseInt(kioskId)) {
      return res.status(403).json({ error: 'Ad not accessible to this kiosk' });
    }

    const filePath = path.join(__dirname, '../uploads/', ad.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers for caching
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('Content-Type', getContentType(ad.filename));
    
    res.download(filePath, ad.filename);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Error downloading ad' });
  }
};

// Helper function to get content type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    default: return 'application/octet-stream';
  }
}

// ✅ Delete ad WITH WEBSOCKET
exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get ad details before deletion
    const [ad] = await db.execute(
      'SELECT id, filename, kiosk_id, type FROM ads WHERE id = ?',
      [id]
    );
    
    if (ad.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    const adData = ad[0];
    
    // Delete from database
    await db.execute('DELETE FROM ads WHERE id = ?', [id]);
    
    // Delete file from uploads folder
    const filePath = path.join(__dirname, '../uploads/', adData.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Get the socket.io instance
    const io = req.app.get('socketio');
    
    // Emit WebSocket event
    if (io) {
      if (adData.kiosk_id === null) {
        // Global ad - notify all kiosks
        io.emit('global_ad_updated', {
          type: 'DELETED',
          ad_id: parseInt(id),
          timestamp: new Date().toISOString()
        });
        console.log(`🗑️ Global ad deleted: ${adData.filename}, notified all kiosks`);
      } else {
        // Targeted ad - notify specific kiosk
        io.to(`kiosk_${adData.kiosk_id}`).emit('ad_updated', {
          type: 'DELETED',
          ad_id: parseInt(id),
          timestamp: new Date().toISOString()
        });
        console.log(`🗑️ Kiosk-specific ad deleted: ${adData.filename}, notified kiosk ${adData.kiosk_id}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Ad deleted successfully',
      deleted_id: id,
      deleted_ad: adData
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error deleting ad' });
  }
};

// ✅ Update ad assignments (assign to different kiosks)
exports.updateAdKiosks = async (req, res) => {
  try {
    const { id } = req.params;
    const { kiosk_ids } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }
    
    // First get current ad details
    const [currentAd] = await db.execute(
      'SELECT id, filename, kiosk_id FROM ads WHERE id = ?',
      [id]
    );
    
    if (currentAd.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    const oldKioskId = currentAd[0].kiosk_id;
    let newKioskId = null;
    
    // Handle single kiosk_id or array of kiosk_ids
    if (Array.isArray(kiosk_ids)) {
      // For now, we'll use the first kiosk_id or null if array is empty
      newKioskId = kiosk_ids.length > 0 ? parseInt(kiosk_ids[0]) : null;
    } else {
      newKioskId = kiosk_ids !== undefined ? parseInt(kiosk_ids) : null;
    }
    
    // Check if new kiosk exists (if not null)
    if (newKioskId) {
      const [kiosk] = await db.execute('SELECT id FROM kiosks WHERE id = ?', [newKioskId]);
      if (kiosk.length === 0) {
        return res.status(404).json({ error: 'Kiosk not found' });
      }
    }
    
    // Update ad in database
    await db.execute(
      'UPDATE ads SET kiosk_id = ?, updated_at = NOW() WHERE id = ?',
      [newKioskId, id]
    );
    
    // Get updated ad
    const [updatedAdRows] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
    const updatedAd = updatedAdRows[0];
    
    // Get the socket.io instance
    const io = req.app.get('socketio');
    
    // Emit WebSocket events
    if (io) {
      if (oldKioskId === null && newKioskId !== null) {
        // Ad changed from global to kiosk-specific
        // Remove from all kiosks (global deletion)
        io.emit('global_ad_updated', {
          type: 'DELETED',
          ad_id: parseInt(id),
          timestamp: new Date().toISOString()
        });
        
        // Add to specific kiosk
        io.to(`kiosk_${newKioskId}`).emit('ad_updated', {
          type: 'ADDED',
          ad: updatedAd,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Ad ${id} changed from global to kiosk ${newKioskId}`);
        
      } else if (oldKioskId !== null && newKioskId === null) {
        // Ad changed from kiosk-specific to global
        // Remove from old kiosk
        io.to(`kiosk_${oldKioskId}`).emit('ad_updated', {
          type: 'DELETED',
          ad_id: parseInt(id),
          timestamp: new Date().toISOString()
        });
        
        // Add to all kiosks (global)
        io.emit('global_ad_updated', {
          type: 'ADDED',
          ad: updatedAd,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Ad ${id} changed from kiosk ${oldKioskId} to global`);
        
      } else if (oldKioskId !== null && newKioskId !== null && oldKioskId !== newKioskId) {
        // Ad moved from one kiosk to another
        // Remove from old kiosk
        io.to(`kiosk_${oldKioskId}`).emit('ad_updated', {
          type: 'DELETED',
          ad_id: parseInt(id),
          timestamp: new Date().toISOString()
        });
        
        // Add to new kiosk
        io.to(`kiosk_${newKioskId}`).emit('ad_updated', {
          type: 'ADDED',
          ad: updatedAd,
          timestamp: new Date().toISOString()
        });
        
        console.log(`🔄 Ad ${id} moved from kiosk ${oldKioskId} to kiosk ${newKioskId}`);
        
      } else if (oldKioskId === null && newKioskId === null) {
        // Still global, no change needed
        console.log(`ℹ️ Ad ${id} remains global`);
        
      } else if (oldKioskId === newKioskId) {
        // Same kiosk, no change needed
        console.log(`ℹ️ Ad ${id} remains assigned to same kiosk ${oldKioskId}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Ad assignment updated successfully',
      ad: updatedAd
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Force refresh all kiosks
exports.forceRefreshAllKiosks = async (req, res) => {
  try {
    const io = req.app.get('socketio');
    
    if (!io) {
      return res.status(500).json({ success: false, error: 'WebSocket not available' });
    }
    
    // Emit global refresh event
    io.emit('admin_trigger_refresh', {
      timestamp: new Date().toISOString(),
      message: 'Admin triggered manual refresh'
    });
    
    console.log(`🔄 Admin triggered refresh on all kiosks`);
    
    res.json({
      success: true,
      message: 'Refresh command sent to all connected kiosks',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Force refresh error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get ad by ID
exports.getAdById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ads] = await db.execute('SELECT * FROM ads WHERE id = ?', [id]);
    
    if (ads.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    const ad = ads[0];
    
    // Add URL
    ad.url = `${req.protocol}://${req.get('host')}/uploads/${ad.filename}`;
    ad.download_url = `${req.protocol}://${req.get('host')}/api/ads/download/${ad.id}`;
    
    res.json({
      success: true,
      ad: ad
    });
    
  } catch (error) {
    console.error('Get ad by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};