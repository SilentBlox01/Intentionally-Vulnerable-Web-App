const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

function initializeDatabase(existingDb) {
  // Use in-memory DB for tests to avoid polluting the on-disk database
  const dbPath = (process.env.NODE_ENV === 'test') ? ':memory:' : config.DB_PATH;

  if (dbPath !== ':memory:') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const db = existingDb || new Database(dbPath);

  // Enable WAL mode for performance (not applicable to :memory: but safe)
  try { db.pragma('journal_mode = WAL'); } catch (e) { /* ignore for in-memory */ }

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      full_name TEXT,
      phone TEXT,
      address TEXT,
      bio TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      account_number TEXT,
      balance REAL DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Migration: add status column if missing
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all();
    const hasStatus = cols.some(c => c.name === 'status');
    if (!hasStatus) {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
      console.log('[DB] Migration: added status column to users table');
    }
  } catch (e) {
    console.error('[DB] Migration error (status column):', e.message);
  }

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount REAL,
      description TEXT,
      recipient_account TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      category TEXT,
      is_internal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Comments / Notes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      document_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (document_id) REFERENCES documents(id)
    )
  `);

  // Support tickets
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // File uploads tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      original_name TEXT,
      file_path TEXT,
      mime_type TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Audit log
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed Data
  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (existingUsers.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, email, full_name, phone, address, bio, role, account_number, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin user
    insertUser.run(
      'admin', 'admin123',
      'admin@securetrust-bank.com', 'Carlos Administrator',
      '+1-555-0100', '123 Admin Street, Suite 100',
      'SecureTrust banking system administrator.',
      'admin', 'ST-1000-0001-0001', 1000000.00
    );

    // Regular user
    insertUser.run(
      'carlos', 'carlos2024',
      'carlos.mendez@email.com', 'Carlos Mendez Garcia',
      '+1-555-0201', '456 Oak Avenue, Apt 3B',
      'Premium client since 2020.',
      'user', 'ST-2000-0045-0078', 45750.00
    );

    // Restricted user
    insertUser.run(
      'maria', 'mariaSecure!',
      'maria.lopez@email.com', 'Maria Lopez Hernandez',
      '+1-555-0302', '789 Pine Road',
      'Standard savings account.',
      'restricted', 'ST-3000-0089-0123', 12300.50
    );

    // Guest user
    insertUser.run(
      'guest', 'guest',
      'guest@securetrust-bank.com', 'Guest User',
      '+1-555-0000', 'N/A',
      'Demonstration account.',
      'guest', 'ST-0000-0000-0000', 100.00
    );

    // Extra user
    insertUser.run(
      'roberto', 'roberto99',
      'roberto.diaz@email.com', 'Roberto Diaz Morales',
      '+1-555-0503', '321 Elm Street, Floor 2',
      'Corporate account. Confidential company information.',
      'user', 'ST-4000-0156-0234', 89500.00
    );

    // Another user
    insertUser.run(
      'ana', 'ana2024!',
      'ana.ruiz@email.com', 'Ana Ruiz Fernandez',
      '+1-555-0604', '654 Maple Drive',
      'Payroll account with direct deposit.',
      'user', 'ST-5000-0234-0567', 33200.75
    );

    // Seed transactions
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, recipient_account, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Carlos's transactions
    insertTransaction.run(2, 'deposit', 5000.00, 'Payroll deposit', null, 'completed', '2024-01-15 09:00:00');
    insertTransaction.run(2, 'withdrawal', 1200.00, 'Rent payment', 'EXT-9876-5432', 'completed', '2024-01-20 14:30:00');
    insertTransaction.run(2, 'transfer', 500.00, 'Transfer to Maria', 'ST-3000-0089-0123', 'completed', '2024-02-01 10:15:00');
    insertTransaction.run(2, 'deposit', 3500.00, 'Payroll deposit', null, 'completed', '2024-02-15 09:00:00');
    insertTransaction.run(2, 'withdrawal', 89.99, 'Online purchase - Amazon', 'EXT-1111-2222', 'completed', '2024-02-18 16:45:00');
    insertTransaction.run(2, 'deposit', 15000.00, 'Annual bonus', null, 'completed', '2024-03-01 09:00:00');

    // Maria's transactions
    insertTransaction.run(3, 'deposit', 2800.00, 'Payroll deposit', null, 'completed', '2024-01-15 09:00:00');
    insertTransaction.run(3, 'withdrawal', 450.00, 'Utility payment', 'EXT-3333-4444', 'completed', '2024-01-22 11:00:00');
    insertTransaction.run(3, 'deposit', 500.00, 'Transfer from Carlos', null, 'completed', '2024-02-01 10:15:00');

    // Roberto's transactions
    insertTransaction.run(5, 'deposit', 25000.00, 'Corporate deposit', null, 'completed', '2024-01-10 08:30:00');
    insertTransaction.run(5, 'transfer', 10000.00, 'Vendor payment', 'EXT-5555-6666', 'completed', '2024-01-25 13:00:00');
    insertTransaction.run(5, 'deposit', 45000.00, 'Sales revenue', null, 'completed', '2024-02-05 09:00:00');

    // Ana's transactions
    insertTransaction.run(6, 'deposit', 3200.75, 'Payroll deposit', null, 'completed', '2024-01-15 09:00:00');
    insertTransaction.run(6, 'withdrawal', 150.00, 'ATM withdrawal', null, 'completed', '2024-01-18 20:30:00');

    // Seed documents
    const insertDoc = db.prepare(`
      INSERT INTO documents (user_id, title, content, category, is_internal)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertDoc.run(1, 'Banking Security Policy', 'All employees must follow established security protocols. Passwords must be changed every 90 days. Do not share credentials under any circumstances.', 'policy', 0);
    insertDoc.run(1, 'Q1 2024 Financial Report', 'Total revenue: $2.5M. Operating expenses: $1.8M. Net profit: $700K. 15% growth compared to the previous quarter.', 'financial', 1);
    insertDoc.run(1, 'Infrastructure Credentials - CONFIDENTIAL', 'Main server: 192.168.1.100\nUser: root\nPassword: S3rv3rR00t2024!\n\nProduction database: db-prod.internal\nUser: db_admin\nPassword: DbPr0d@2024\n\nFLAG{SQLI_M4ST3R_C0MPR0M1S3D}', 'internal', 1);
    insertDoc.run(2, 'Loan Contract #4578', 'Personal loan for $25,000 at 8.5% annual rate. Term: 36 months. Monthly payment: $789.50.', 'contract', 0);
    insertDoc.run(3, 'Account Statement - January 2024', 'Initial balance: $10,000.50. Deposits: $3,300.00. Withdrawals: $1,000.00. Final balance: $12,300.50.', 'statement', 0);
    insertDoc.run(1, 'Team Password List', 'Juan (Support): juan.support / Support2024!\nPedro (IT): pedro.it / P3dr0IT!\nLuisa (HR): luisa.hr / Hr@2024\n\nNOTE: Update before March 1st.', 'internal', 1);
    insertDoc.run(5, 'Corporate Secrets', 'Project X Launch Date: Q4 2024.\nBudget: $500k.\nFLAG{IDOR_3XPL0R3R_S3CR3T5}', 'internal', 1);

    // Seed comments
    const insertComment = db.prepare(`
      INSERT INTO comments (user_id, document_id, content) VALUES (?, ?, ?)
    `);

    insertComment.run(2, 1, 'Excellent policy, we should update it to include two-factor authentication.');
    insertComment.run(3, 1, 'I agree with Carlos. I also suggest implementing end-to-end encryption.');
    insertComment.run(2, 4, 'I need a signed copy of this contract.');

    // Seed support tickets
    const insertTicket = db.prepare(`
      INSERT INTO tickets (user_id, subject, message, status, priority) VALUES (?, ?, ?, ?, ?)
    `);

    insertTicket.run(2, 'Limit increase request', 'I need to increase my daily transfer limit to $10,000.', 'open', 'medium');
    insertTicket.run(3, 'Error in account statement', 'The balance shown does not match my records.', 'open', 'high');
    insertTicket.run(5, 'New corporate card', 'I am requesting an additional card for my company.', 'closed', 'low');
  }

  return db;
}

function resetDatabase(db) {
  db.exec(`
    DROP TABLE IF EXISTS audit_log;
    DROP TABLE IF EXISTS uploads;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS documents;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS users;
  `);
  return initializeDatabase(db);
}

module.exports = {
  initializeDatabase,
  resetDatabase
};
