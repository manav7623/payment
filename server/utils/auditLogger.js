const { pool } = require('../config/db');

async function logAudit(userId, userName, action, details, ipAddress = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
      [userId || null, userName || 'System', action, typeof details === 'object' ? JSON.stringify(details) : details, ipAddress]
    );
  } catch (err) {
    console.error('Audit log write error:', err.message);
  }
}

module.exports = { logAudit };
