const Database = require('better-sqlite3');
const db = new Database('./database/bank.db', { readonly: true });
const chars = ['á','é','í','ó','ú','ñ','Á','É','Í','Ó','Ú','Ñ','¿','¡'];
const where = chars.map(()=> `full_name LIKE ?`).join(' OR ');
const args = chars.map(c => `%${c}%`);
const stmt = db.prepare('SELECT id, username, full_name, email FROM users WHERE ' + where);
const rows = stmt.all(...args);
console.log(JSON.stringify(rows, null, 2));
