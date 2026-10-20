const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', planController.getPlans);
router.get('/:id', planController.getPlanById);

// Admin only actions
router.post('/', requireAdmin, planController.createPlan);
router.delete('/:id', requireAdmin, planController.deletePlan);

module.exports = router;
