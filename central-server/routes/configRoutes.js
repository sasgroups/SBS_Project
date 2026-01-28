const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/system-config', configController.getSystemConfig);
router.put('/system-config', configController.saveSystemConfig);

module.exports = router;
