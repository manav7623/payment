const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. Get Summary Stats for Friends Ledger
exports.getFriendSummary = async (req, res) => {
  try {
    const userId = req.user.id || 1;

    // Total To Receive: Money given/lent to friend (pending)
    const [gaveRes] = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_gave,
        COUNT(id) AS count_gave
      FROM friend_transactions
      WHERE user_id = ? AND type = 'gave' AND status = 'pending'
    `, [userId]);

    // Total To Pay: Money taken/borrowed from friend (pending)
    const [tookRes] = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_took,
        COUNT(id) AS count_took
      FROM friend_transactions
      WHERE user_id = ? AND type = 'took' AND status = 'pending'
    `, [userId]);

    // Total Settled
    const [settledRes] = await pool.query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS total_settled,
        COUNT(id) AS count_settled
      FROM friend_transactions
      WHERE user_id = ? AND status = 'settled'
    `, [userId]);

    // Unique Friends count
    const [friendsCountRes] = await pool.query(`
      SELECT COUNT(DISTINCT friend_name) AS unique_friends
      FROM friend_transactions
      WHERE user_id = ?
    `, [userId]);

    // Top recent 5 transactions
    const [recentTx] = await pool.query(`
      SELECT 
        id,
        friend_name,
        friend_phone,
        type,
        amount,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
        notes,
        status,
        DATE_FORMAT(settled_date, '%Y-%m-%d') AS settled_date,
        created_at
      FROM friend_transactions
      WHERE user_id = ?
      ORDER BY transaction_date DESC, id DESC
      LIMIT 5
    `, [userId]);

    const totalLeneHai = parseFloat(gaveRes[0].total_gave || 0);
    const totalDeneHai = parseFloat(tookRes[0].total_took || 0);
    const netBalance = totalLeneHai - totalDeneHai; // Positive = You get overall, Negative = You owe overall

    return res.json({
      summary: {
        totalLeneHai,
        totalDeneHai,
        netBalance,
        countLeneHai: gaveRes[0].count_gave || 0,
        countDeneHai: tookRes[0].count_took || 0,
        totalPending: (gaveRes[0].count_gave || 0) + (tookRes[0].count_took || 0),
        totalSettledCount: settledRes[0].count_settled || 0,
        totalSettledAmount: parseFloat(settledRes[0].total_settled || 0),
        uniqueFriends: friendsCountRes[0].unique_friends || 0
      },
      recentTransactions: recentTx
    });
  } catch (err) {
    console.error('getFriendSummary error:', err);
    return res.status(500).json({ message: 'Failed to load friend summary.' });
  }
};

// 2. Get All Friend Transactions with filters
exports.getFriendTransactions = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    let whereConditions = ['user_id = ?'];
    let queryParams = [userId];

    const { status, type, friend_name, search } = req.query;

    if (status && status !== 'all') {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (type && type !== 'all') {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    if (friend_name && friend_name.trim() !== '') {
      whereConditions.push('friend_name = ?');
      queryParams.push(friend_name.trim());
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push('(friend_name LIKE ? OR notes LIKE ?)');
      queryParams.push(term, term);
    }

    const sql = `
      SELECT 
        id,
        user_id,
        friend_name,
        friend_phone,
        type,
        amount,
        DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
        notes,
        status,
        DATE_FORMAT(settled_date, '%Y-%m-%d') AS settled_date,
        created_at,
        updated_at
      FROM friend_transactions
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY transaction_date DESC, id DESC
    `;

    const [transactions] = await pool.query(sql, queryParams);

    // Also get unique friend names for quick filter/autocomplete
    const [friendsList] = await pool.query(`
      SELECT DISTINCT friend_name, friend_phone
      FROM friend_transactions
      WHERE user_id = ?
      ORDER BY friend_name ASC
    `, [userId]);

    return res.json({
      transactions,
      friends: friendsList
    });
  } catch (err) {
    console.error('getFriendTransactions error:', err);
    return res.status(500).json({ message: 'Failed to fetch friend transactions.' });
  }
};

// 3. Get Friends Ledger (Friend-by-Friend net calculation)
exports.getFriendsLedger = async (req, res) => {
  try {
    const userId = req.user.id || 1;

    const [rows] = await pool.query(`
      SELECT 
        friend_name,
        MAX(friend_phone) AS friend_phone,
        COALESCE(SUM(CASE WHEN type = 'gave' AND status = 'pending' THEN amount ELSE 0 END), 0) AS total_gave,
        COALESCE(SUM(CASE WHEN type = 'took' AND status = 'pending' THEN amount ELSE 0 END), 0) AS total_took,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN status = 'settled' THEN 1 END) AS settled_count,
        COUNT(id) AS total_count,
        MAX(transaction_date) AS last_date
      FROM friend_transactions
      WHERE user_id = ?
      GROUP BY friend_name
      ORDER BY (
        COALESCE(SUM(CASE WHEN type = 'gave' AND status = 'pending' THEN amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN type = 'took' AND status = 'pending' THEN amount ELSE 0 END), 0)
      ) DESC, friend_name ASC
    `, [userId]);

    const ledger = rows.map(item => {
      const gave = parseFloat(item.total_gave || 0);
      const took = parseFloat(item.total_took || 0);
      const net = gave - took; // > 0: You get, < 0: You give, 0: Even
      return {
        friend_name: item.friend_name,
        friend_phone: item.friend_phone,
        totalGave: gave,
        totalTook: took,
        netBalance: net,
        status: net > 0 ? 'to_receive' : (net < 0 ? 'to_pay' : 'settled'),
        pendingCount: item.pending_count,
        settledCount: item.settled_count,
        totalCount: item.total_count,
        lastDate: item.last_date ? item.last_date.toISOString().split('T')[0] : null
      };
    });

    return res.json({ ledger });
  } catch (err) {
    console.error('getFriendsLedger error:', err);
    return res.status(500).json({ message: 'Failed to fetch friends ledger.' });
  }
};

// 4. Add a Friend Transaction
exports.addFriendTransaction = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    const { friend_name, friend_phone, type, amount, transaction_date, notes } = req.body;

    if (!friend_name || !friend_name.trim()) {
      return res.status(400).json({ message: 'Friend name is required.' });
    }

    if (!type || (type !== 'gave' && type !== 'took')) {
      return res.status(400).json({ message: "Type must be 'gave' (Lent) or 'took' (Borrowed)." });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount greater than 0.' });
    }

    const date = transaction_date || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO friend_transactions (
        user_id,
        friend_name,
        friend_phone,
        type,
        amount,
        transaction_date,
        notes,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      userId,
      friend_name.trim(),
      friend_phone ? friend_phone.trim() : null,
      type,
      parsedAmount,
      date,
      notes ? notes.trim() : null
    ]);

    const typeDesc = type === 'gave' ? 'Lent (To Receive)' : 'Borrowed (To Pay)';
    await logAudit(
      userId,
      req.user.name || 'MD',
      'ADD_FRIEND_TX',
      `Added friend transaction: ${friend_name.trim()} - ₹${parsedAmount} (${typeDesc})`,
      req.ip
    );

    return res.status(201).json({
      message: 'Friend transaction recorded successfully.',
      id: result.insertId
    });
  } catch (err) {
    console.error('addFriendTransaction error:', err);
    return res.status(500).json({ message: 'Failed to record friend transaction.' });
  }
};

// 5. Update a Friend Transaction
exports.updateFriendTransaction = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    const id = parseInt(req.params.id);
    const { friend_name, friend_phone, type, amount, transaction_date, notes, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM friend_transactions WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount.' });
    }

    const settledDate = status === 'settled' ? (existing[0].settled_date || new Date().toISOString().split('T')[0]) : null;

    await pool.query(`
      UPDATE friend_transactions
      SET 
        friend_name = ?,
        friend_phone = ?,
        type = ?,
        amount = ?,
        transaction_date = ?,
        notes = ?,
        status = ?,
        settled_date = ?
      WHERE id = ? AND user_id = ?
    `, [
      friend_name ? friend_name.trim() : existing[0].friend_name,
      friend_phone !== undefined ? (friend_phone ? friend_phone.trim() : null) : existing[0].friend_phone,
      type || existing[0].type,
      parsedAmount,
      transaction_date || existing[0].transaction_date,
      notes !== undefined ? (notes ? notes.trim() : null) : existing[0].notes,
      status || existing[0].status,
      settledDate,
      id,
      userId
    ]);

    await logAudit(
      userId,
      req.user.name || 'MD',
      'UPDATE_FRIEND_TX',
      `Updated friend transaction #${id}`,
      req.ip
    );

    return res.json({ message: 'Friend transaction updated successfully.' });
  } catch (err) {
    console.error('updateFriendTransaction error:', err);
    return res.status(500).json({ message: 'Failed to update friend transaction.' });
  }
};

// 6. Toggle Settle Status (Mark as Paid/Received or Reopen)
exports.toggleSettleFriendTransaction = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    const id = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT * FROM friend_transactions WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'pending' ? 'settled' : 'pending';
    const settledDate = newStatus === 'settled' ? new Date().toISOString().split('T')[0] : null;

    await pool.query(`
      UPDATE friend_transactions
      SET status = ?, settled_date = ?
      WHERE id = ? AND user_id = ?
    `, [newStatus, settledDate, id, userId]);

    const actionText = newStatus === 'settled' ? 'Settled' : 'Reopened to Pending';
    await logAudit(
      userId,
      req.user.name || 'MD',
      'SETTLE_FRIEND_TX',
      `Friend transaction #${id} marked as ${actionText}`,
      req.ip
    );

    return res.json({
      message: `Transaction successfully marked as ${newStatus}.`,
      status: newStatus,
      settled_date: settledDate
    });
  } catch (err) {
    console.error('toggleSettleFriendTransaction error:', err);
    return res.status(500).json({ message: 'Failed to toggle transaction settle state.' });
  }
};

// 7. Settle All Transactions for a specific Friend (1-click settle)
exports.settleAllForFriend = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    const { friend_name } = req.body;

    if (!friend_name || !friend_name.trim()) {
      return res.status(400).json({ message: 'Friend name is required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const [result] = await pool.query(`
      UPDATE friend_transactions
      SET status = 'settled', settled_date = ?
      WHERE user_id = ? AND friend_name = ? AND status = 'pending'
    `, [today, userId, friend_name.trim()]);

    await logAudit(
      userId,
      req.user.name || 'MD',
      'SETTLE_ALL_FRIEND',
      `Settled all pending transactions for friend: ${friend_name.trim()} (${result.affectedRows} items)`,
      req.ip
    );

    return res.json({
      message: `All pending balances for ${friend_name.trim()} marked as settled!`,
      settledCount: result.affectedRows
    });
  } catch (err) {
    console.error('settleAllForFriend error:', err);
    return res.status(500).json({ message: 'Failed to settle transactions.' });
  }
};

// 8. Delete a Friend Transaction
exports.deleteFriendTransaction = async (req, res) => {
  try {
    const userId = req.user.id || 1;
    const id = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT * FROM friend_transactions WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    await pool.query('DELETE FROM friend_transactions WHERE id = ? AND user_id = ?', [id, userId]);

    await logAudit(
      userId,
      req.user.name || 'MD',
      'DELETE_FRIEND_TX',
      `Deleted friend transaction #${id} (${rows[0].friend_name} - ₹${rows[0].amount})`,
      req.ip
    );

    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('deleteFriendTransaction error:', err);
    return res.status(500).json({ message: 'Failed to delete transaction.' });
  }
};
