// scripts/createInboundTable.js
const db = require('../config/db');

(async () => {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS inbound_calls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caller_name VARCHAR(255) NULL,
        phone_number VARCHAR(50) NULL,
        call_time DATETIME NULL,
        duration_seconds INT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await db.query(createTableSQL);
    console.log('✅ inbound_calls table ensured');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating inbound_calls table:', err);
    process.exit(1);
  }
})();
