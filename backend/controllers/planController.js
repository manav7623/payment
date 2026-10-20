const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

exports.getPlans = async (req, res) => {
  try {
    const isClient = req.user.role === 'client';
    const clientId = isClient ? req.user.id : (req.query.clientId ? parseInt(req.query.clientId) : null);

    let whereClause = '';
    let params = [];

    if (clientId) {
      whereClause = 'WHERE pp.client_id = ?';
      params.push(clientId);
    }

    const sql = `
      SELECT 
        pp.id,
        pp.client_id,
        u.name AS client_name,
        u.email AS client_email,
        pp.title,
        pp.total_amount,
        pp.installments_count,
        pp.notes,
        pp.status,
        pp.created_at,
        COALESCE(SUM(i.paid_amount), 0) AS total_paid,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_installments_count,
        COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_installments_count
      FROM payment_plans pp
      JOIN users u ON pp.client_id = u.id
      LEFT JOIN installments i ON pp.id = i.plan_id
      ${whereClause}
      GROUP BY pp.id
      ORDER BY pp.created_at DESC
    `;

    const [plans] = await pool.query(sql, params);

    // Fetch installments for each plan
    for (const plan of plans) {
      const [insts] = await pool.query(`
        SELECT 
          id, plan_id, installment_number, amount, 
          DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, 
          paid_amount, status
        FROM installments
        WHERE plan_id = ?
        ORDER BY installment_number ASC
      `, [plan.id]);

      // Check overdue statuses
      const today = new Date().toISOString().split('T')[0];
      for (const inst of insts) {
        if (inst.status === 'unpaid' && inst.due_date < today) {
          inst.status = 'overdue';
        }
      }

      plan.installments = insts;
      plan.remaining_amount = Math.max(0, parseFloat(plan.total_amount) - parseFloat(plan.total_paid));
    }

    return res.json({ plans });
  } catch (err) {
    console.error('getPlans error:', err);
    return res.status(500).json({ message: 'Failed to fetch payment plans.' });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const [plans] = await pool.query(`
      SELECT pp.*, u.name AS client_name, u.email AS client_email
      FROM payment_plans pp
      JOIN users u ON pp.client_id = u.id
      WHERE pp.id = ?
    `, [planId]);

    if (plans.length === 0) {
      return res.status(404).json({ message: 'Payment plan not found.' });
    }

    const plan = plans[0];
    if (req.user.role === 'client' && plan.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const [installments] = await pool.query(`
      SELECT 
        id, plan_id, installment_number, amount, 
        DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, 
        paid_amount, status
      FROM installments
      WHERE plan_id = ?
      ORDER BY installment_number ASC
    `, [planId]);

    const [payments] = await pool.query(`
      SELECT id, amount, DATE_FORMAT(payment_date, '%Y-%m-%d') AS payment_date, 
             category, payment_method, reference_id, status, installment_id
      FROM payments
      WHERE plan_id = ?
      ORDER BY payment_date DESC
    `, [planId]);

    return res.json({
      plan,
      installments,
      payments
    });
  } catch (err) {
    console.error('getPlanById error:', err);
    return res.status(500).json({ message: 'Failed to fetch payment plan details.' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { client_id, title, total_amount, installments_count, notes, installments } = req.body;

    if (!client_id || !title || !total_amount) {
      return res.status(400).json({ message: 'Client ID, title, and total amount are required.' });
    }

    const numTotal = parseFloat(total_amount);
    const numInstallments = parseInt(installments_count) || 1;

    // Check client exists
    const [clients] = await pool.query('SELECT name FROM users WHERE id = ? AND role = "client"', [client_id]);
    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const [planRes] = await pool.query(`
      INSERT INTO payment_plans (client_id, title, total_amount, installments_count, notes, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [client_id, title, numTotal, numInstallments, notes || null]);

    const planId = planRes.insertId;

    // Insert installments
    if (installments && Array.isArray(installments) && installments.length > 0) {
      for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        await pool.query(`
          INSERT INTO installments (plan_id, installment_number, amount, due_date, status)
          VALUES (?, ?, ?, ?, 'unpaid')
        `, [planId, inst.installment_number || (i + 1), parseFloat(inst.amount), inst.due_date]);
      }
    } else {
      // Auto-generate installments (equal split, monthly due dates starting in 30 days)
      const eachAmount = Math.round((numTotal / numInstallments) * 100) / 100;
      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        const formattedDate = dueDate.toISOString().split('T')[0];

        await pool.query(`
          INSERT INTO installments (plan_id, installment_number, amount, due_date, status)
          VALUES (?, ?, ?, ?, 'unpaid')
        `, [planId, i, eachAmount, formattedDate]);
      }
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE_PLAN',
      `Created plan "${title}" of ₹${numTotal} for ${clients[0].name} (${numInstallments} installments)`,
      req.ip
    );

    return res.status(201).json({
      message: 'Payment plan created successfully.',
      planId
    });
  } catch (err) {
    console.error('createPlan error:', err);
    return res.status(500).json({ message: 'Failed to create payment plan.' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const [plans] = await pool.query('SELECT title, client_id FROM payment_plans WHERE id = ?', [planId]);
    if (plans.length === 0) {
      return res.status(404).json({ message: 'Plan not found.' });
    }

    await pool.query('DELETE FROM payment_plans WHERE id = ?', [planId]);
    await logAudit(req.user.id, req.user.name, 'DELETE_PLAN', `Deleted payment plan #${planId} (${plans[0].title})`, req.ip);

    return res.json({ message: 'Payment plan deleted successfully.' });
  } catch (err) {
    console.error('deletePlan error:', err);
    return res.status(500).json({ message: 'Failed to delete plan.' });
  }
};
