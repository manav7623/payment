const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

exports.getAllClients = async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.status,
        u.created_at,
        COALESCE(SUM(CASE WHEN p.status = 'verified' THEN p.amount ELSE 0 END), 0) AS total_paid,
        COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) AS pending_amount,
        COUNT(DISTINCT p.id) AS payments_count,
        COUNT(DISTINCT pp.id) AS plans_count
      FROM users u
      LEFT JOIN payments p ON u.id = p.client_id
      LEFT JOIN payment_plans pp ON u.id = pp.client_id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY u.name ASC
    `;

    const [clients] = await pool.query(sql);

    return res.json({ clients });
  } catch (err) {
    console.error('getAllClients error:', err);
    return res.status(500).json({ message: 'Failed to fetch clients.' });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const [clients] = await pool.query(
      'SELECT id, name, email, phone, address, status, created_at FROM users WHERE id = ? AND role = "client"',
      [clientId]
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const client = clients[0];

    // Client's payment plans
    const [plans] = await pool.query('SELECT * FROM payment_plans WHERE client_id = ? ORDER BY created_at DESC', [clientId]);

    // Client's payments
    const [payments] = await pool.query('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC', [clientId]);

    return res.json({ client, plans, payments });
  } catch (err) {
    console.error('getClientById error:', err);
    return res.status(500).json({ message: 'Failed to fetch client details.' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(`
      INSERT INTO users (name, email, password, role, phone, address, status)
      VALUES (?, ?, ?, 'client', ?, ?, 'active')
    `, [name.trim(), cleanEmail, hashed, phone || null, address || null]);

    const clientId = result.insertId;

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE_CLIENT',
      `Registered new client "${name}" (${cleanEmail}, ID: #${clientId})`,
      req.ip
    );

    return res.status(201).json({
      message: 'Client created successfully.',
      client: {
        id: clientId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone || null,
        address: address || null
      }
    });
  } catch (err) {
    console.error('createClient error:', err);
    return res.status(500).json({ message: 'Failed to create client account.' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, phone, address, status } = req.body;

    await pool.query(`
      UPDATE users 
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          status = COALESCE(?, status)
      WHERE id = ? AND role = 'client'
    `, [name, phone, address, status, clientId]);

    await logAudit(req.user.id, req.user.name, 'UPDATE_CLIENT', `Updated client details for ID #${clientId}`, req.ip);

    return res.json({ message: 'Client updated successfully.' });
  } catch (err) {
    console.error('updateClient error:', err);
    return res.status(500).json({ message: 'Failed to update client.' });
  }
};
