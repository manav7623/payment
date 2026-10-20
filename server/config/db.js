const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

let pool;
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  pool = mysql.createPool(dbUrl);
} else {
  const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'paytrack_db',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    decimalNumbers: true
  };

  if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !process.env.DB_HOST.includes('127.0.0.1') && !process.env.DB_HOST.includes('localhost'))) {
    poolConfig.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = mysql.createPool(poolConfig);
}

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully.');

    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'client') NOT NULL DEFAULT 'client',
        relationship VARCHAR(50) DEFAULT 'Self',
        phone VARCHAR(20) DEFAULT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        icon VARCHAR(50) DEFAULT 'Tag',
        color VARCHAR(20) DEFAULT '#2563eb',
        is_default BOOLEAN DEFAULT FALSE,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cat_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        expense_date DATE NOT NULL,
        payment_method ENUM('UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Other') NOT NULL DEFAULT 'UPI',
        notes TEXT DEFAULT NULL,
        receipt_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_date (expense_date),
        INDEX idx_category (category),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Receipts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_id INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size INT DEFAULT NULL,
        mime_type VARCHAR(100) DEFAULT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_rcpt_exp FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Audit logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        user_name VARCHAR(100) DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_audit_user_exp FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_action (action),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Friend transactions table (Separate ledger for friends)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS friend_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        friend_name VARCHAR(100) NOT NULL,
        friend_phone VARCHAR(20) DEFAULT NULL,
        type ENUM('gave', 'took') NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        transaction_date DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        status ENUM('pending', 'settled') NOT NULL DEFAULT 'pending',
        settled_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_friend_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_friend_user (user_id),
        INDEX idx_friend_name (friend_name),
        INDEX idx_friend_status (status),
        INDEX idx_friend_date (transaction_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Default Categories list
    const defaultCategories = [
      { name: 'Food & Dining', icon: 'Utensils', color: '#ea580c' },
      { name: 'Groceries', icon: 'ShoppingCart', color: '#16a34a' },
      { name: 'Transport & Fuel', icon: 'Car', color: '#0284c7' },
      { name: 'Bills & Utilities', icon: 'Zap', color: '#ca8a04' },
      { name: 'Shopping', icon: 'ShoppingBag', color: '#9333ea' },
      { name: 'Entertainment', icon: 'Film', color: '#db2777' },
      { name: 'Health & Medical', icon: 'HeartPulse', color: '#dc2626' },
      { name: 'Education', icon: 'GraduationCap', color: '#2563eb' },
      { name: 'Personal Care', icon: 'Smile', color: '#0d9488' },
      { name: 'Others', icon: 'MoreHorizontal', color: '#4b5563' }
    ];

    for (const cat of defaultCategories) {
      await connection.query(`
        INSERT IGNORE INTO categories (name, icon, color, is_default)
        VALUES (?, ?, ?, TRUE)
      `, [cat.name, cat.icon, cat.color]);
    }

    // Seed users if brother or client not present
    const [existingBrother] = await connection.query(`SELECT id FROM users WHERE email = 'brother@paytrack.com' OR email = 'admin@paytrack.com'`);
    if (existingBrother.length === 0) {
      console.log('🌱 Seeding Brother (Admin) and Me (Client) accounts...');
      const brotherPass = await bcrypt.hash('brother123', 10);
      const myPass = await bcrypt.hash('me123', 10);

      // 1. Brother (Admin)
      const [bRes] = await connection.query(`
        INSERT INTO users (name, email, password, role, relationship, phone)
        VALUES ('Brother (Admin)', 'brother@paytrack.com', ?, 'admin', 'Brother', '+91 98000 11111')
      `, [brotherPass]);
      const brotherId = bRes.insertId;

      // Also support admin@paytrack.com for convenience
      const adminPass = await bcrypt.hash('admin123', 10);
      await connection.query(`
        INSERT IGNORE INTO users (name, email, password, role, relationship, phone)
        VALUES ('Brother (Admin)', 'admin@paytrack.com', ?, 'admin', 'Brother', '+91 98000 11111')
      `, [adminPass]);

      // 2. Me (Client)
      const [mRes] = await connection.query(`
        INSERT INTO users (name, email, password, role, relationship, phone)
        VALUES ('Manav (Me)', 'me@paytrack.com', ?, 'client', 'Self', '+91 98765 43210')
      `, [myPass]);
      const myId = mRes.insertId;

      // Also support client@paytrack.com for convenience
      const clientPass = await bcrypt.hash('client123', 10);
      await connection.query(`
        INSERT IGNORE INTO users (name, email, password, role, relationship, phone)
        VALUES ('Manav (Me)', 'client@paytrack.com', ?, 'client', 'Self', '+91 98765 43210')
      `, [clientPass]);

      // Seed initial realistic expenses for Me (Client)
      // Current date is 2026-10-19 (Monday)
      const sampleExpenses = [
        // Today (2026-10-19)
        { title: 'Lunch at Cafe & Juices', amount: 350.00, category: 'Food & Dining', date: '2026-10-19', method: 'UPI', notes: 'GPay payment with office colleagues' },
        { title: 'Metro Smart Card Recharge', amount: 500.00, category: 'Transport & Fuel', date: '2026-10-19', method: 'UPI', notes: 'Monthly metro pass top-up' },
        
        // This Week
        { title: 'Weekly Vegetables & Fruits', amount: 840.00, category: 'Groceries', date: '2026-10-19', method: 'Cash', notes: 'Local market purchase' },
        
        // Earlier this Month (October 2026)
        { title: 'Electricity Bill Payment', amount: 2450.00, category: 'Bills & Utilities', date: '2026-10-12', method: 'Net Banking', notes: 'Torrent Power October bill' },
        { title: 'Mobile & Broadband Plan', amount: 1199.00, category: 'Bills & Utilities', date: '2026-10-10', method: 'UPI', notes: 'JioFiber quarterly recharge' },
        { title: 'Dinner with Friends', amount: 1250.00, category: 'Food & Dining', date: '2026-10-08', method: 'Credit Card', notes: 'Barbeque Nation' },
        { title: 'Pharmacy Medicines & Vitamins', amount: 620.00, category: 'Health & Medical', date: '2026-10-05', method: 'UPI', notes: 'Apollo Pharmacy' },
        { title: 'New Running Shoes', amount: 2899.00, category: 'Shopping', date: '2026-10-03', method: 'Debit Card', notes: 'Amazon festive sale' },

        // Last Month (September 2026)
        { title: 'Supermarket Monthly Ration', amount: 5400.00, category: 'Groceries', date: '2026-09-25', method: 'Credit Card', notes: 'D-Mart bulk purchase' },
        { title: 'Fuel for Bike (Full Tank)', amount: 1100.00, category: 'Transport & Fuel', date: '2026-09-20', method: 'UPI', notes: 'Indian Oil petrol' },
        { title: 'Movie Tickets & Snacks', amount: 950.00, category: 'Entertainment', date: '2026-09-14', method: 'UPI', notes: 'PVR Inox weekend show' },
        { title: 'Online Course Subscription', amount: 1999.00, category: 'Education', date: '2026-09-02', method: 'Debit Card', notes: 'Full stack development bootcamp' },

        // Earlier Months
        { title: 'Annual Health Checkup', amount: 3500.00, category: 'Health & Medical', date: '2026-08-18', method: 'Credit Card', notes: 'Thyrocare comprehensive package' },
        { title: 'Apartment Maintenance Charge', amount: 2000.00, category: 'Bills & Utilities', date: '2026-07-10', method: 'Net Banking', notes: 'Society maintenance Q3' }
      ];

      for (const exp of sampleExpenses) {
        await connection.query(`
          INSERT INTO expenses (user_id, title, amount, category, expense_date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [myId, exp.title, exp.amount, exp.category, exp.date, exp.method, exp.notes]);
      }

      await connection.query(`
        INSERT INTO audit_logs (user_id, user_name, action, details, ip_address)
        VALUES 
        (?, 'System', 'SYSTEM_INITIALIZATION', 'Personal expense tracker initialized for Brother & Manav', '127.0.0.1'),
        (?, 'Manav (Me)', 'ADD_EXPENSE', 'Added expense: Lunch at Cafe & Juices (₹350)', '127.0.0.1')
      `, [brotherId, myId]);

      // Seed sample friend transactions on first setup
      console.log('🌱 Seeding initial Friends Ledger transactions...');
      const sampleFriendTx = [
        {
          friend_name: 'Rahul Sharma',
          friend_phone: '+91 98765 11223',
          type: 'gave', // Lent to friend (To receive)
          amount: 650.00,
          date: '2026-10-18',
          notes: 'Dinner bill split at BBQ Nation',
          status: 'pending'
        },
        {
          friend_name: 'Aman Verma',
          friend_phone: '+91 98220 33445',
          type: 'took', // Borrowed from friend (To pay)
          amount: 300.00,
          date: '2026-10-17',
          notes: 'Auto & metro travel share',
          status: 'pending'
        },
        {
          friend_name: 'Rohit Mehta',
          friend_phone: '+91 97110 55667',
          type: 'gave', // Lent to friend (To receive)
          amount: 1200.00,
          date: '2026-10-15',
          notes: 'Concert pass booking advance',
          status: 'pending'
        },
        {
          friend_name: 'Priya Patel',
          friend_phone: '+91 98980 77889',
          type: 'gave', // Lent to friend (settled)
          amount: 400.00,
          date: '2026-10-10',
          notes: 'Stationery & photocopy split',
          status: 'settled',
          settled_date: '2026-10-14'
        }
      ];

      for (const f of sampleFriendTx) {
        await connection.query(`
          INSERT INTO friend_transactions (
            user_id, friend_name, friend_phone, type, amount, transaction_date, notes, status, settled_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          myId,
          f.friend_name,
          f.friend_phone,
          f.type,
          f.amount,
          f.date,
          f.notes,
          f.status,
          f.settled_date || null
        ]);
      }
      console.log('✅ Brother & Client accounts, sample expenses, and friend records seeded successfully!');
    }

    connection.release();
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}

module.exports = {
  pool,
  initDatabase
};
