const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.json({ categories });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ message: 'Failed to fetch categories.' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category with this name already exists.' });
    }

    const [result] = await pool.query(`
      INSERT INTO categories (name, icon, color, is_default, created_by)
      VALUES (?, ?, ?, FALSE, ?)
    `, [name.trim(), icon || 'Tag', color || '#2563eb', req.user.id]);

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE_CATEGORY',
      `Created category "${name.trim()}"`,
      req.ip
    );

    return res.status(201).json({
      message: 'Category created successfully.',
      category: {
        id: result.insertId,
        name: name.trim(),
        icon: icon || 'Tag',
        color: color || '#2563eb'
      }
    });
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({ message: 'Failed to create category.' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const [cat] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (cat.length === 0) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    await logAudit(req.user.id, req.user.name, 'DELETE_CATEGORY', `Deleted category "${cat[0].name}"`, req.ip);

    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
};
