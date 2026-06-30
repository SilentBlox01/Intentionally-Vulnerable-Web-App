const Database = require('better-sqlite3');
const db = new Database('./database/bank.db');
const updates = [
  {id:1, name: 'Carlos Administrator'},
  {id:2, name: 'Carlos Garcia Updated'},
  {id:3, name: 'Maria Lopez Hernandez'},
  {id:4, name: 'Guest User'},
  {id:5, name: 'Roberto Diaz Morales'},
  {id:6, name: 'Ana Ruiz Fernandez'}
];

const stmt = db.prepare('UPDATE users SET full_name = ? WHERE id = ?');
for (const u of updates) {
  const info = stmt.run(u.name, u.id);
  console.log(`Updated id=${u.id}, changes=${info.changes}`);
}

// Show resulting rows
const rows = db.prepare('SELECT id, username, full_name FROM users WHERE id IN (1,2,3,4,5,6)').all();
console.log(JSON.stringify(rows, null, 2));
