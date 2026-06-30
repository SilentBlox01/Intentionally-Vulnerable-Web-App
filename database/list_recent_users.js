const Database = require('better-sqlite3');
const db = new Database('./database/bank.db', { readonly: true });
const rows = db.prepare('SELECT id, username, full_name, email, created_at FROM users ORDER BY datetime(created_at) DESC LIMIT 20').all();
console.log(JSON.stringify(rows, null, 2));
