const { pool } = require('../config/db');

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await pool.query(`
      SELECT id, user_id, user_name, action, details, ip_address, created_at
      FROM audit_logs
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');

    return res.json({
      logs,
      total: parseInt(countRows[0].total)
    });
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
};
