const express = require('express');
const router = express.Router();
const { loginAdmin, registerAdmin } = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth'); // ✅ import correctly

// Login route
router.post('/login', loginAdmin);

// Register route
router.post('/register', registerAdmin);

// Protected route example (requires valid admin token)
router.get('/profile', verifyToken, requireAdmin, (req, res) => {
  res.json({ message: 'You are authenticated', admin: req.admin });
});

module.exports = router;
