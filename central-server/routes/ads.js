// routes/ads.js - UPDATED WITH NEW ROUTES
const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');

// Get all ads (for admin panel with filtering)
router.get('/', adController.getAllAds);

// Get ad by ID
router.get('/:id', adController.getAdById);

// Get ads for specific kiosk (global + kiosk-specific)
router.get('/kiosk/:kioskId', adController.getAdsForKiosk);

// Get sync delta (only changes)
router.get('/sync-delta/:kioskId', adController.getSyncDelta);

// Bulk download for cache initialization
router.get('/bulk/:kioskId', adController.bulkDownload);

// Check for updates (lightweight)
router.get('/check-updates/:kioskId', adController.checkForUpdates);

// Upload ad (global or kiosk-specific)
router.post('/upload', adController.uploadAd);

// Download ad for caching
router.get('/download/:id', adController.downloadAd);

// Update ad kiosk assignments
router.put('/:id/kiosks', adController.updateAdKiosks);

// Update ad metadata
// router.put('/:id/metadata', adController.updateAdMetadata);

// Force refresh all kiosks
router.post('/force-refresh', adController.forceRefreshAllKiosks);

// Delete ad
router.delete('/:id', adController.deleteAd);

module.exports = router;