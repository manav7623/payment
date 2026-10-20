const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/summary', friendController.getFriendSummary);
router.get('/ledger', friendController.getFriendsLedger);
router.get('/', friendController.getFriendTransactions);
router.post('/', friendController.addFriendTransaction);
router.post('/settle-all', friendController.settleAllForFriend);
router.put('/:id', friendController.updateFriendTransaction);
router.patch('/:id/settle', friendController.toggleSettleFriendTransaction);
router.delete('/:id', friendController.deleteFriendTransaction);

module.exports = router;
