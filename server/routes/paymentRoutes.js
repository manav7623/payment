const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(requireAuth);

router.get('/', paymentController.getPayments);
router.get('/dashboard-stats', paymentController.getDashboardStats);
router.post('/', upload.single('receipt'), paymentController.addPayment);

// Admin only actions
router.patch('/:id/verify', requireAdmin, paymentController.verifyPayment);
router.patch('/:id/reject', requireAdmin, paymentController.rejectPayment);
router.put('/:id', requireAdmin, paymentController.updatePayment);
router.delete('/:id', requireAdmin, paymentController.deletePayment);

module.exports = router;
