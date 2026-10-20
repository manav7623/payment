const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  try {
    const password = await bcrypt.hash('password123', 10);

    // Single unified personal account
    await pool.query(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ('Manav Sharma', 'manav@paytrack.com', ?, 'client', '+91 98765 43210')
      ON DUPLICATE KEY UPDATE name='Manav Sharma', password=?, phone='+91 98765 43210'
    `, [password, password]);

    // Also support me@paytrack.com for testing continuity
    await pool.query(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ('Manav Sharma', 'me@paytrack.com', ?, 'client', '+91 98765 43210')
      ON DUPLICATE KEY UPDATE name='Manav Sharma', password=?, phone='+91 98765 43210'
    `, [password, password]);

    const [user] = await pool.query(`SELECT id FROM users WHERE email = 'manav@paytrack.com'`);
    const userId = user[0].id;

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
      await pool.query(`
        INSERT IGNORE INTO categories (name, icon, color, is_default)
        VALUES (?, ?, ?, TRUE)
      `, [cat.name, cat.icon, cat.color]);
    }

    // Check if expenses exist for userId
    const [existingExp] = await pool.query('SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', [userId]);
    if (existingExp[0].count === 0) {
      console.log('Seeding personal expenses for Manav...');
      const sampleExpenses = [
        // Today (2026-10-19)
        { title: 'Lunch at Cafe & Juices', amount: 350.00, category: 'Food & Dining', date: '2026-10-19', method: 'UPI', notes: 'GPay payment with office colleagues' },
        { title: 'Metro Smart Card Recharge', amount: 500.00, category: 'Transport & Fuel', date: '2026-10-19', method: 'UPI', notes: 'Monthly metro pass top-up' },
        { title: 'South Indian Dosa & Coffee', amount: 250.00, category: 'Food & Dining', date: '2026-10-19', method: 'UPI', notes: 'Evening snacks' },

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
        await pool.query(`
          INSERT INTO expenses (user_id, title, amount, category, expense_date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, exp.title, exp.amount, exp.category, exp.date, exp.method, exp.notes]);
      }
    }

    console.log('✅ Single-user personal account and expenses seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
