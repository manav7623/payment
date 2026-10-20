const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/export-csv', reportController.exportExpensesCSV || reportController.exportPaymentsCSV);

module.exports = router;
