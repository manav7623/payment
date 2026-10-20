const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(requireAuth);

router.get('/', expenseController.getExpenses);
router.get('/dashboard-stats', expenseController.getDashboardStats);
router.post('/', upload.single('receipt'), expenseController.addExpense);
router.put('/:id', upload.single('receipt'), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
