const express = require('express');
const router = express.Router();
const controller = require('../controllers/pageTimeoutController');

router.get('/', controller.getAllPageTimeouts);
router.put('/:id', controller.updatePageTimeout);

module.exports = router;
