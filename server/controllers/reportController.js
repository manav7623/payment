const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

exports.exportExpensesCSV = async (req, res) => {
  try {
    let whereConditions = ['1=1'];
    let queryParams = [];

    const period = req.query.period;
    if (period === 'today') {
      whereConditions.push('e.expense_date = CURDATE()');
    } else if (period === 'week') {
      whereConditions.push('YEARWEEK(e.expense_date, 1) = YEARWEEK(CURDATE(), 1)');
    } else if (period === 'last_week') {
      whereConditions.push('YEARWEEK(e.expense_date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)');
    } else if (period === 'month') {
      whereConditions.push('YEAR(e.expense_date) = YEAR(CURDATE()) AND MONTH(e.expense_date) = MONTH(CURDATE())');
    } else if (period === 'last_month') {
      whereConditions.push('YEAR(e.expense_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(e.expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))');
    } else if (period === 'year') {
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

    if (req.query.category && req.query.category !== 'all') {
      whereConditions.push('e.category = ?');
      queryParams.push(req.query.category);
    }

    if (req.query.method && req.query.method !== 'all') {
      whereConditions.push('e.payment_method = ?');
      queryParams.push(req.query.method);
    }

    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    const sql = `
      SELECT 
        e.id,
        e.title,
        e.amount,
        DATE_FORMAT(e.expense_date, '%d-%m-%Y') AS formatted_date,
        e.category,
        e.payment_method,
        COALESCE(e.notes, '-') AS notes,
        CASE WHEN e.receipt_url IS NOT NULL THEN 'Yes' ELSE 'No' END AS has_receipt
      FROM expenses e
      ${whereClause}
      ORDER BY e.expense_date DESC, e.id DESC
    `;

    const [rows] = await pool.query(sql, queryParams);

    // Build CSV with UTF-8 BOM
    const bom = '\uFEFF';
    const headers = [
      'Expense ID',
      'Expense Title',
      'Amount (INR)',
      'Date (DD-MM-YYYY)',
      'Category',
      'Payment Method',
      'Notes',
      'Receipt Attached'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvLines = [headers.map(escapeCsv).join(',')];

    for (const r of rows) {
      csvLines.push([
        r.id,
        escapeCsv(r.title),
        r.amount,
        escapeCsv(r.formatted_date),
        escapeCsv(r.category),
        escapeCsv(r.payment_method),
        escapeCsv(r.notes),
        escapeCsv(r.has_receipt)
      ].join(','));
    }

    const csvContent = bom + csvLines.join('\r\n');

    await logAudit(
      1,
      'MD',
      'EXPORT_REPORT',
      `Exported expenses CSV report (${rows.length} records)`,
      req.ip
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="MD_expenses_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('exportExpensesCSV error:', err);
    return res.status(500).json({ message: 'Failed to generate export report.' });
  }
};
