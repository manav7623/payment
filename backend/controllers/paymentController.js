const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

// Helper to build WHERE conditions for payments
function buildPaymentQuery(req) {
  let whereConditions = [];
  let queryParams = [];

  // Client restriction
  if (req.user.role === 'client') {
    whereConditions.push('p.client_id = ?');
    queryParams.push(req.user.id);
  } else if (req.query.clientId) {
    whereConditions.push('p.client_id = ?');
    queryParams.push(parseInt(req.query.clientId));
  }

  // Period / Date filters
  const period = req.query.period;
  if (period === 'today') {
    whereConditions.push('p.payment_date = CURDATE()');
  } else if (period === 'week') {
    // Mode 1: Monday is first day of week
    whereConditions.push('YEARWEEK(p.payment_date, 1) = YEARWEEK(CURDATE(), 1)');
  } else if (period === 'month') {
    whereConditions.push('YEAR(p.payment_date) = YEAR(CURDATE()) AND MONTH(p.payment_date) = MONTH(CURDATE())');
  } else if (period === 'year') {
    whereConditions.push('YEAR(p.payment_date) = YEAR(CURDATE())');
  } else if (period === 'custom' || (req.query.startDate && req.query.endDate)) {
    if (req.query.startDate) {
      whereConditions.push('p.payment_date >= ?');
      queryParams.push(req.query.startDate);
    }
    if (req.query.endDate) {
      whereConditions.push('p.payment_date <= ?');
      queryParams.push(req.query.endDate);
    }
  }

  // Status filter
  if (req.query.status && req.query.status !== 'all') {
    whereConditions.push('p.status = ?');
    queryParams.push(req.query.status);
  }

  // Category filter
  if (req.query.category && req.query.category !== 'all') {
    whereConditions.push('p.category = ?');
    queryParams.push(req.query.category);
  }

  // Payment Method filter
  if (req.query.method && req.query.method !== 'all') {
    whereConditions.push('p.payment_method = ?');
    queryParams.push(req.query.method);
  }

  // Amount range filters
  if (req.query.minAmount) {
    whereConditions.push('p.amount >= ?');
    queryParams.push(parseFloat(req.query.minAmount));
  }
  if (req.query.maxAmount) {
    whereConditions.push('p.amount <= ?');
    queryParams.push(parseFloat(req.query.maxAmount));
  }

  // Search keyword (reference_id, notes, or client name)
  if (req.query.search && req.query.search.trim() !== '') {
    const term = `%${req.query.search.trim()}%`;
    whereConditions.push('(p.reference_id LIKE ? OR p.notes LIKE ? OR u.name LIKE ?)');
    queryParams.push(term, term, term);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  return { whereClause, queryParams };
}

exports.getPayments = async (req, res) => {
  try {
    const { whereClause, queryParams } = buildPaymentQuery(req);

    // Get list of payments with client and plan details
    const sql = `
      SELECT 
        p.id,
        p.client_id,
        u.name AS client_name,
        u.email AS client_email,
        u.phone AS client_phone,
        p.plan_id,
        pp.title AS plan_title,
        p.installment_id,
        inst.installment_number,
        p.amount,
        DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date,
        p.category,
        p.payment_method,
        p.reference_id,
        p.notes,
        p.receipt_url,
        p.status,
        p.rejection_reason,
        p.verified_by,
        v.name AS verifier_name,
        p.verified_at,
        p.created_at
      FROM payments p
      JOIN users u ON p.client_id = u.id
      LEFT JOIN payment_plans pp ON p.plan_id = pp.id
      LEFT JOIN installments inst ON p.installment_id = inst.id
      LEFT JOIN users v ON p.verified_by = v.id
      ${whereClause}
      ORDER BY p.payment_date DESC, p.id DESC
    `;

    const [payments] = await pool.query(sql, queryParams);

    // Calculate filtered total and count
    const summarySql = `
      SELECT 
        COUNT(p.id) AS filtered_count,
        COALESCE(SUM(CASE WHEN p.status != 'rejected' THEN p.amount ELSE 0 END), 0) AS filtered_total,
        COALESCE(SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END), 0) AS verified_total,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) AS pending_total
      FROM payments p
      JOIN users u ON p.client_id = u.id
      ${whereClause}
    `;
    const [summaryRows] = await pool.query(summarySql, queryParams);
    const summary = summaryRows[0] || { filtered_count: 0, filtered_total: 0, verified_total: 0, pending_total: 0 };

    return res.json({
      payments,
      summary: {
        filtered_count: parseInt(summary.filtered_count),
        filtered_total: parseFloat(summary.filtered_total),
        verified_total: parseFloat(summary.verified_total),
        pending_total: parseFloat(summary.pending_total)
      }
    });
  } catch (err) {
    console.error('getPayments error:', err);
    return res.status(500).json({ message: 'Failed to fetch payments.' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const isClient = req.user.role === 'client';
    const clientId = isClient ? req.user.id : (req.query.clientId ? parseInt(req.query.clientId) : null);

    const clientFilter = clientId ? 'AND p.client_id = ' + pool.escape(clientId) : '';

    // 1. Total Payments (Verified / Completed payments)
    const [totalRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_amount, COUNT(id) AS total_count
      FROM payments p
      WHERE status IN ('verified', 'completed', 'partially_paid') ${clientFilter}
    `);

    // 2. This Month (verified / partially_paid)
    const [monthRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS month_amount, COUNT(id) AS month_count
      FROM payments p
      WHERE status IN ('verified', 'completed', 'partially_paid')
        AND YEAR(p.payment_date) = YEAR(CURDATE())
        AND MONTH(p.payment_date) = MONTH(CURDATE())
        ${clientFilter}
    `);

    // 3. This Week (Monday to Sunday)
    const [weekRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS week_amount, COUNT(id) AS week_count
      FROM payments p
      WHERE status IN ('verified', 'completed', 'partially_paid')
        AND YEARWEEK(p.payment_date, 1) = YEARWEEK(CURDATE(), 1)
        ${clientFilter}
    `);

    // 4. Pending Payments (unverified)
    const [pendingRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS pending_amount, COUNT(id) AS pending_count
      FROM payments p
      WHERE status = 'pending' ${clientFilter}
    `);

    // 5. Monthly payment chart (Last 6 months)
    const [chartRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(payment_date, '%b %Y') AS month_label,
        DATE_FORMAT(payment_date, '%Y-%m') AS sort_month,
        COALESCE(SUM(CASE WHEN status != 'rejected' THEN amount ELSE 0 END), 0) AS total_amount,
        COALESCE(SUM(CASE WHEN status = 'verified' THEN amount ELSE 0 END), 0) AS verified_amount
      FROM payments p
      WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        ${clientFilter}
      GROUP BY sort_month, month_label
      ORDER BY sort_month ASC
    `);

    // 6. Recent transactions (5 most recent)
    const [recentRows] = await pool.query(`
      SELECT 
        p.id,
        p.client_id,
        u.name AS client_name,
        p.amount,
        DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS payment_date,
        p.category,
        p.payment_method,
        p.reference_id,
        p.status,
        p.receipt_url
      FROM payments p
      JOIN users u ON p.client_id = u.id
      WHERE 1=1 ${clientFilter}
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT 6
    `);

    // 7. Active plans summary for client/admin
    const [planStats] = await pool.query(`
      SELECT 
        COUNT(pp.id) as total_plans,
        COALESCE(SUM(pp.total_amount), 0) as total_plan_amount
      FROM payment_plans pp
      WHERE pp.status = 'active' ${clientId ? 'AND pp.client_id = ' + pool.escape(clientId) : ''}
    `);

    return res.json({
      summary: {
        total_payments: parseFloat(totalRows[0].total_amount),
        total_count: parseInt(totalRows[0].total_count),
        this_month: parseFloat(monthRows[0].month_amount),
        month_count: parseInt(monthRows[0].month_count),
        this_week: parseFloat(weekRows[0].week_amount),
        week_count: parseInt(weekRows[0].week_count),
        pending_payments: parseFloat(pendingRows[0].pending_amount),
        pending_count: parseInt(pendingRows[0].pending_count),
        total_plans: parseInt(planStats[0].total_plans || 0),
        total_plan_amount: parseFloat(planStats[0].total_plan_amount || 0)
      },
      chartData: chartRows.map(row => ({
        month: row.month_label,
        amount: parseFloat(row.total_amount),
        verified: parseFloat(row.verified_amount)
      })),
      recentTransactions: recentRows
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics.' });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const {
      amount,
      payment_date,
      category,
      payment_method,
      reference_id,
      notes,
      plan_id,
      installment_id
    } = req.body;

    if (!amount || !payment_date || !category || !payment_method) {
      return res.status(400).json({ message: 'Amount, payment date, category, and payment method are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    let clientId;
    let initialStatus = 'pending';

    if (req.user.role === 'admin') {
      if (!req.body.client_id) {
        return res.status(400).json({ message: 'Please select a client for this payment.' });
      }
      clientId = parseInt(req.body.client_id);
      // Admin can mark directly as verified or custom status
      initialStatus = req.body.status || 'verified';
    } else {
      // Client role: strictly own ID and pending status
      clientId = req.user.id;
      initialStatus = 'pending';
    }

    let receiptUrl = null;
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(`
      INSERT INTO payments (
        client_id, plan_id, installment_id, amount, payment_date, 
        category, payment_method, reference_id, notes, receipt_url, 
        status, verified_by, verified_at, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      clientId,
      plan_id ? parseInt(plan_id) : null,
      installment_id ? parseInt(installment_id) : null,
      numAmount,
      payment_date,
      category,
      payment_method,
      reference_id || null,
      notes || null,
      receiptUrl,
      initialStatus,
      initialStatus === 'verified' ? req.user.id : null,
      initialStatus === 'verified' ? new Date() : null,
      req.user.id
    ]);

    const newPaymentId = result.insertId;

    // If linked to an installment and verified immediately by admin, update installment paid_amount
    if (installment_id && initialStatus === 'verified') {
      await updateInstallmentProgress(installment_id);
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE_PAYMENT',
      `Payment of ₹${numAmount} created for client #${clientId} (Payment ID: #${newPaymentId}, Status: ${initialStatus})`,
      req.ip
    );

    return res.status(201).json({
      message: 'Payment recorded successfully.',
      paymentId: newPaymentId,
      status: initialStatus
    });
  } catch (err) {
    console.error('addPayment error:', err);
    return res.status(500).json({ message: 'Failed to record payment.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);

    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const payment = payments[0];
    await pool.query(`
      UPDATE payments 
      SET status = 'verified', rejection_reason = NULL, verified_by = ?, verified_at = NOW() 
      WHERE id = ?
    `, [req.user.id, paymentId]);

    if (payment.installment_id) {
      await updateInstallmentProgress(payment.installment_id);
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'VERIFY_PAYMENT',
      `Verified payment #${paymentId} of ₹${payment.amount} for client #${payment.client_id}`,
      req.ip
    );

    return res.json({ message: 'Payment verified successfully.' });
  } catch (err) {
    console.error('verifyPayment error:', err);
    return res.status(500).json({ message: 'Failed to verify payment.' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { reason } = req.body;

    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const payment = payments[0];
    await pool.query(`
      UPDATE payments 
      SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = NOW() 
      WHERE id = ?
    `, [reason || 'Payment rejected by administrator', req.user.id, paymentId]);

    if (payment.installment_id) {
      await updateInstallmentProgress(payment.installment_id);
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'REJECT_PAYMENT',
      `Rejected payment #${paymentId} (Reason: ${reason || 'Not specified'})`,
      req.ip
    );

    return res.json({ message: 'Payment rejected successfully.' });
  } catch (err) {
    console.error('rejectPayment error:', err);
    return res.status(500).json({ message: 'Failed to reject payment.' });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { amount, payment_date, category, payment_method, reference_id, notes, status } = req.body;

    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    await pool.query(`
      UPDATE payments 
      SET amount = COALESCE(?, amount),
          payment_date = COALESCE(?, payment_date),
          category = COALESCE(?, category),
          payment_method = COALESCE(?, payment_method),
          reference_id = COALESCE(?, reference_id),
          notes = COALESCE(?, notes),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [amount, payment_date, category, payment_method, reference_id, notes, status, paymentId]);

    await logAudit(req.user.id, req.user.name, 'UPDATE_PAYMENT', `Updated payment #${paymentId}`, req.ip);

    return res.json({ message: 'Payment updated successfully.' });
  } catch (err) {
    console.error('updatePayment error:', err);
    return res.status(500).json({ message: 'Failed to update payment.' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const [payments] = await pool.query('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    const payment = payments[0];
    // Delete receipt file if exists
    if (payment.receipt_url) {
      const filePath = path.join(__dirname, '..', payment.receipt_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('DELETE FROM payments WHERE id = ?', [paymentId]);

    if (payment.installment_id) {
      await updateInstallmentProgress(payment.installment_id);
    }

    await logAudit(req.user.id, req.user.name, 'DELETE_PAYMENT', `Deleted payment #${paymentId}`, req.ip);

    return res.json({ message: 'Payment deleted successfully.' });
  } catch (err) {
    console.error('deletePayment error:', err);
    return res.status(500).json({ message: 'Failed to delete payment.' });
  }
};

// Helper function to recalculate installment paid_amount and status
async function updateInstallmentProgress(installmentId) {
  try {
    const [sumRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_paid
      FROM payments
      WHERE installment_id = ? AND status IN ('verified', 'completed', 'partially_paid')
    `, [installmentId]);

    const totalPaid = parseFloat(sumRows[0].total_paid);

    const [instRows] = await pool.query('SELECT amount, due_date FROM installments WHERE id = ?', [installmentId]);
    if (instRows.length === 0) return;

    const targetAmount = parseFloat(instRows[0].amount);
    let newStatus = 'unpaid';

    if (totalPaid >= targetAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    } else {
      const isOverdue = new Date(instRows[0].due_date) < new Date();
      newStatus = isOverdue ? 'overdue' : 'unpaid';
    }

    await pool.query(
      'UPDATE installments SET paid_amount = ?, status = ? WHERE id = ?',
      [totalPaid, newStatus, installmentId]
    );
  } catch (err) {
    console.error('updateInstallmentProgress error:', err);
  }
}
