const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const requireAuth = async (req, res, next) => {
  // Direct MD access - no passwords or account barriers
  req.user = { id: 1, name: 'MD', role: 'admin' };
  next();
};

module.exports = {
  requireAuth
};
