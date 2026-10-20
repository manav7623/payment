const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

function buildExpenseQuery(req) {
  let whereConditions = ['1=1'];
  let queryParams = [];

  // Quick period filters
  const period = req.query.period;
  if (period === 'today') {
    whereConditions.push('e.expense_date = CURDATE()');
  } else if (period === 'week') {
    // Current week: Monday to Sunday (mode 1 in MySQL)
    whereConditions.push('YEARWEEK(e.expense_date, 1) = YEARWEEK(CURDATE(), 1)');
  } else if (period === 'last_week') {
    // Previous week: Monday to Sunday
    whereConditions.push('YEARWEEK(e.expense_date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)');
  } else if (period === 'month') {
    // Current month
    whereConditions.push('YEAR(e.expense_date) = YEAR(CURDATE()) AND MONTH(e.expense_date) = MONTH(CURDATE())');
  } else if (period === 'last_month') {
    // Previous month
    whereConditions.push('YEAR(e.expense_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(e.expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
  } else if (period === 'year') {
    // Current year
    whereConditions.push('YEAR(e.expense_date) = YEAR(CURDATE())');
  } else if (period === 'custom' || (req.query.startDate && req.query.endDate)) {
    if (req.query.startDate) {
      whereConditions.push('e.expense_date >= ?');
      queryParams.push(req.query.startDate);
    }
    if (req.query.endDate) {
      whereConditions.push('e.expense_date <= ?');
      queryParams.push(req.query.endDate);
    }
  }

  // Category filter
  if (req.query.category && req.query.category !== 'all') {
    whereConditions.push('e.category = ?');
    queryParams.push(req.query.category);
  }

  // Payment method filter
  if (req.query.method && req.query.method !== 'all') {
    whereConditions.push('e.payment_method = ?');
    queryParams.push(req.query.method);
  }

  // Amount range filters
  if (req.query.minAmount) {
    whereConditions.push('e.amount >= ?');
    queryParams.push(parseFloat(req.query.minAmount));
  }
  if (req.query.maxAmount) {
    whereConditions.push('e.amount <= ?');
    queryParams.push(parseFloat(req.query.maxAmount));
  }

  // Search keyword (title, notes, or category)
  if (req.query.search && req.query.search.trim() !== '') {
    const term = `%${req.query.search.trim()}%`;
    whereConditions.push('(e.title LIKE ? OR e.notes LIKE ? OR e.category LIKE ?)');
    queryParams.push(term, term, term);
  }

  const whereClause = 'WHERE ' + whereConditions.join(' AND ');
  return { whereClause, queryParams };
}

exports.getExpenses = async (req, res) => {
  try {
    const { whereClause, queryParams } = buildExpenseQuery(req);

    const sql = `
      SELECT 
        e.id,
        e.user_id,
        u.name AS user_name,
        e.title,
        e.amount,
        e.category,
        DATE_FORMAT(e.expense_date, '%Y-%m-%d') AS expense_date,
        e.payment_method,
        e.notes,
        e.receipt_url,
        e.created_at,
        e.updated_at,
        r.id AS receipt_id,
        r.original_name AS receipt_name,
        r.file_size AS receipt_size
      FROM expenses e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN receipts r ON e.id = r.expense_id
      ${whereClause}
      ORDER BY e.expense_date DESC, e.id DESC
    `;

    const [expenses] = await pool.query(sql, queryParams);

    // Calculate filtered total and count
    const summarySql = `
      SELECT 
        COUNT(e.id) AS filtered_count,
        COALESCE(SUM(e.amount), 0) AS filtered_total
      FROM expenses e
      JOIN users u ON e.user_id = u.id
      ${whereClause}
    `;
    const [summaryRows] = await pool.query(summarySql, queryParams);
    const summary = summaryRows[0] || { filtered_count: 0, filtered_total: 0 };

    return res.json({
      expenses,
      summary: {
        filtered_count: parseInt(summary.filtered_count),
        filtered_total: parseFloat(summary.filtered_total)
      }
    });
  } catch (err) {
    console.error('getExpenses error:', err);
    return res.status(500).json({ message: 'Failed to fetch expenses.' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total Spent This Month
    const [monthRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS month_amount, COUNT(id) AS month_count
      FROM expenses e
      WHERE YEAR(e.expense_date) = YEAR(CURDATE())
        AND MONTH(e.expense_date) = MONTH(CURDATE())
    `);

    // 2. Total Spent This Week (Monday to Sunday)
    const [weekRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS week_amount, COUNT(id) AS week_count
      FROM expenses e
      WHERE YEARWEEK(e.expense_date, 1) = YEARWEEK(CURDATE(), 1)
    `);

    // 3. Total Spent Today
    const [todayRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS today_amount, COUNT(id) AS today_count
      FROM expenses e
      WHERE e.expense_date = CURDATE()
    `);

    // 4. Total Transactions & All-time Spending
    const [totalRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_amount, COUNT(id) AS total_count
      FROM expenses e
    `);

    // 5. Monthly Spending Trend (Last 6 Months)
    const [chartRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(expense_date, '%b %Y') AS month_label,
        DATE_FORMAT(expense_date, '%Y-%m') AS sort_month,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM expenses e
      WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY sort_month, month_label
      ORDER BY sort_month ASC
    `);

    // 6. Expense Category Summary
    const [catRows] = await pool.query(`
      SELECT 
        e.category,
        COALESCE(SUM(e.amount), 0) AS total_amount,
        COUNT(e.id) AS count
      FROM expenses e
      WHERE YEAR(e.expense_date) = YEAR(CURDATE()) AND MONTH(e.expense_date) = MONTH(CURDATE())
      GROUP BY e.category
      ORDER BY total_amount DESC
    `);

    const currentMonthTotal = parseFloat(monthRows[0].month_amount) || 1;
    const categorySummary = catRows.map(row => ({
      category: row.category,
      amount: parseFloat(row.total_amount),
      count: parseInt(row.count),
      percentage: Math.min(100, Math.round((parseFloat(row.total_amount) / currentMonthTotal) * 100))
    }));

    // 7. Recent expenses
    const [recentRows] = await pool.query(`
      SELECT 
        e.id,
        e.user_id,
        e.title,
        e.amount,
        e.category,
        DATE_FORMAT(e.expense_date, '%Y-%m-%d') AS expense_date,
        e.payment_method,
        e.notes,
        e.receipt_url,
        e.created_at
      FROM expenses e
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT 8
    `);

    return res.json({
      summary: {
        this_month: parseFloat(monthRows[0].month_amount),
        month_count: parseInt(monthRows[0].month_count),
        this_week: parseFloat(weekRows[0].week_amount),
        week_count: parseInt(weekRows[0].week_count),
        today: parseFloat(todayRows[0].today_amount),
        today_count: parseInt(todayRows[0].today_count),
        total_transactions: parseInt(totalRows[0].total_count),
        total_spent: parseFloat(totalRows[0].total_amount)
      },
      chartData: chartRows.map(row => ({
        month: row.month_label,
        amount: parseFloat(row.total_amount)
      })),
      categorySummary,
      recentExpenses: recentRows
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics.' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { title, amount, category, expense_date, payment_method, notes } = req.body;

    if (!title || !amount || !category || !expense_date) {
      return res.status(400).json({ message: 'Title, amount, category, and date are required.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    let receiptUrl = null;
    let receiptMeta = null;

    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
      receiptMeta = {
        file_path: receiptUrl,
        original_name: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      };
    }

    const [result] = await pool.query(`
      INSERT INTO expenses (user_id, title, amount, category, expense_date, payment_method, notes, receipt_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      title.trim(),
      numAmount,
      category,
      expense_date,
      payment_method || 'UPI',
      notes ? notes.trim() : null,
      receiptUrl
    ]);

    const newExpenseId = result.insertId;

    if (receiptMeta) {
      await pool.query(`
        INSERT INTO receipts (expense_id, file_path, original_name, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `, [newExpenseId, receiptMeta.file_path, receiptMeta.original_name, receiptMeta.file_size, receiptMeta.mime_type]);
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'ADD_EXPENSE',
      `Added expense: "${title.trim()}" for ₹${numAmount} (${category}, ${payment_method || 'UPI'})`,
      req.ip
    );

    return res.status(201).json({
      message: 'Expense added successfully.',
      expenseId: newExpenseId
    });
  } catch (err) {
    console.error('addExpense error:', err);
    return res.status(500).json({ message: 'Failed to record expense.' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);
    const { title, amount, category, expense_date, payment_method, notes } = req.body;

    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense record not found.' });
    }

    const exp = existing[0];
    let receiptUrl = exp.receipt_url;

    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
      if (exp.receipt_url) {
        const oldPath = path.join(__dirname, '..', exp.receipt_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await pool.query('DELETE FROM receipts WHERE expense_id = ?', [expenseId]);
      await pool.query(`
        INSERT INTO receipts (expense_id, file_path, original_name, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `, [expenseId, receiptUrl, req.file.originalname, req.file.size, req.file.mimetype]);
    }

    await pool.query(`
      UPDATE expenses 
      SET title = COALESCE(?, title),
          amount = COALESCE(?, amount),
          category = COALESCE(?, category),
          expense_date = COALESCE(?, expense_date),
          payment_method = COALESCE(?, payment_method),
          notes = COALESCE(?, notes),
          receipt_url = ?
      WHERE id = ?
    `, [title, amount, category, expense_date, payment_method, notes, receiptUrl, expenseId]);

    await logAudit(
      1,
      'MD',
      'EDIT_EXPENSE',
      `Updated expense #${expenseId} ("${title || exp.title}", ₹${amount || exp.amount})`,
      req.ip
    );

    return res.json({ message: 'Expense updated successfully.' });
  } catch (err) {
    console.error('updateExpense error:', err);
    return res.status(500).json({ message: 'Failed to update expense.' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = parseInt(req.params.id);

    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    const exp = existing[0];
    if (exp.receipt_url) {
      const filePath = path.join(__dirname, '..', exp.receipt_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('DELETE FROM expenses WHERE id = ?', [expenseId]);

    await logAudit(
      1,
      'MD',
      'DELETE_EXPENSE',
      `Deleted expense #${expenseId} ("${exp.title}", ₹${exp.amount})`,
      req.ip
    );

    return res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    return res.status(500).json({ message: 'Failed to delete expense.' });
  }
};
