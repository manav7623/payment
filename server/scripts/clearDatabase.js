require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function clearDatabase() {
  console.log('🚀 Starting database cleanup...');
  let connection;
  try {
    connection = await pool.getConnection();

    // Disable foreign key checks for clean truncation
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Clear Expenses
    await connection.query('TRUNCATE TABLE expenses');
    console.log('✔ Truncated expenses table (0 records)');

    // 2. Clear Receipts
    await connection.query('TRUNCATE TABLE receipts');
    console.log('✔ Truncated receipts table (0 records)');

    // 3. Clear Friend Transactions
    await connection.query('TRUNCATE TABLE friend_transactions');
    console.log('✔ Truncated friend_transactions table (0 records)');

    // 4. Clear Audit Logs and add fresh clear event
    await connection.query('TRUNCATE TABLE audit_logs');
    await connection.query(`
      INSERT INTO audit_logs (user_id, user_name, action, details, ip_address)
      VALUES (1, 'Admin', 'DATABASE_CLEARED', 'Database cleared to zero expenses & zero friend transactions.', '127.0.0.1')
    `);
    console.log('✔ Reset audit_logs table');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 5. Clean up uploaded receipt files in backend/uploads
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let removedCount = 0;
      for (const file of files) {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
            removedCount++;
          } catch (e) {
            console.warn(`Could not delete file ${file}:`, e.message);
          }
        }
      }
      console.log(`✔ Removed ${removedCount} physical receipt file(s) from uploads folder`);
    }

    // 6. Verify table counts
    const [uCount] = await connection.query('SELECT COUNT(*) AS count FROM users');
    const [cCount] = await connection.query('SELECT COUNT(*) AS count FROM categories');
    const [eCount] = await connection.query('SELECT COUNT(*) AS count FROM expenses');
    const [fCount] = await connection.query('SELECT COUNT(*) AS count FROM friend_transactions');
    const [rCount] = await connection.query('SELECT COUNT(*) AS count FROM receipts');

    console.log('\n📊 Database Status After Cleanup:');
    console.log(`- Users: ${uCount[0].count} (Active login accounts preserved)`);
    console.log(`- Categories: ${cCount[0].count} (Preserved)`);
    console.log(`- Expenses: ${eCount[0].count} (Clean slate)`);
    console.log(`- Friends Records: ${fCount[0].count} (Clean slate)`);
    console.log(`- Receipts: ${rCount[0].count} (Clean slate)`);

    console.log('\n✨ Database successfully cleared! You can now start fresh.');
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

clearDatabase();
