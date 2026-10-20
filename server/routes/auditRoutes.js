const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', auditController.getAuditLogs);

module.exports = router;
