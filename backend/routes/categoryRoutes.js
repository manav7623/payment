const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
