const express = require('express');
const router = express.Router();
const { createKiosk, updateKiosk, listKiosks, loginKiosk, deleteKiosk, getAllKiosks } = require('../controllers/kioskController');
const { verifyToken ,requireAdmin} = require('../middleware/auth'); // ✅ use existing auth.js

// Admin-protected routes
router.post('/', requireAdmin, createKiosk);
router.put('/:id', requireAdmin, updateKiosk);
router.delete('/:id', requireAdmin, deleteKiosk);;
router.get('/', requireAdmin, listKiosks);

// Kiosk login route (no admin auth required)
router.post('/login', loginKiosk);
router.get('/getAllKiosks', getAllKiosks);

// Example protected kiosk route
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: "Kiosk authenticated", kiosk: req.kiosk });
});

module.exports = router;
