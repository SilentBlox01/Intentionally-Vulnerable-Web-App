const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { initializeDatabase, resetDatabase } = require('./database/init');

const app = express();

// Initialize database
const db = initializeDatabase();

// ============================================



// ============================================

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: false,   
    secure: false,     
    maxAge: config.SESSION_MAX_AGE_MS
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/protected', express.static(path.join(__dirname, 'protected')));


app.use('/backup', express.static(path.join(__dirname, 'backup')));


app.get('/.env', (req, res) => {
  res.sendFile(path.join(__dirname, '.env'), { dotfiles: 'allow' });
});


app.get('/uploads', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const files = fs.readdirSync(uploadDir);
  res.json({ directory: '/uploads', files: files });
});


app.get('/protected', (req, res) => {
  const protectedDir = path.join(__dirname, 'protected');
  if (fs.existsSync(protectedDir)) {
    const files = fs.readdirSync(protectedDir);
    res.json({ directory: '/protected', files: files });
  } else {
    res.json({ directory: '/protected', files: [] });
  }
});

// Make session user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session;
  next();
});

// Routes
const authRoutes = require('./routes/auth')(db);
const userRoutes = require('./routes/users')(db);
const documentRoutes = require('./routes/documents')(db);
const adminRoutes = require('./routes/admin')(db);
const uploadRoutes = require('./routes/upload')(db);
const reportRoutes = require('./routes/reports')(db);

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', documentRoutes);
app.use('/', adminRoutes);
app.use('/', uploadRoutes);
app.use('/', reportRoutes);

// Reset Database Endpoint
app.post('/api/reset-db', (req, res) => {
  try {
    resetDatabase(db);
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Home redirect
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const user = db.prepare(`SELECT * FROM users WHERE id = ${req.session.userId}`).get();
    const recentTransactions = db.prepare(`SELECT * FROM transactions WHERE user_id = ${req.session.userId} ORDER BY created_at DESC LIMIT 10`).all();
    const tickets = db.prepare(`SELECT * FROM tickets WHERE user_id = ${req.session.userId} ORDER BY created_at DESC LIMIT 5`).all();

    res.render('dashboard', {
      title: 'My Account - SecureTrust Bank',
      currentUser: user,
      recentTransactions: recentTransactions,
      tickets: tickets,
      user: req.session
    });
  } catch (err) {
    res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
  }
});

// Support tickets
app.post('/tickets/create', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  const { subject, message, priority } = req.body;

  
  try {
    db.prepare('INSERT INTO tickets (user_id, subject, message, priority) VALUES (?, ?, ?, ?)')
      .run(req.session.userId, subject, message, priority || 'medium');
    res.redirect('/dashboard');
  } catch (err) {
    res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
  }
});

// Dashboard stats API
app.get('/api/dashboard/stats', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.userId;

  try {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const currentMonthStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'transfer') THEN amount ELSE 0 END), 0) as expenses,
        COUNT(*) as total
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).get(userId, currentMonth);

    const prevMonthStats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'transfer') THEN amount ELSE 0 END), 0) as expenses,
        COUNT(*) as total
      FROM transactions
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).get(userId, prevMonth);

    const monthlyTrend = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type IN ('withdrawal', 'transfer') THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ? AND created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all(userId);

    const categoryBreakdown = db.prepare(`
      SELECT description,
        SUM(amount) as total,
        type
      FROM transactions
      WHERE user_id = ?
      GROUP BY description
      ORDER BY total DESC
      LIMIT 8
    `).all(userId);

    res.json({
      currentMonth: currentMonthStats,
      previousMonth: prevMonthStats,
      monthlyTrend: monthlyTrend,
      categoryBreakdown: categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error page
app.get('/error', (req, res) => {
  res.render('error', {
    title: 'Error',
    message: req.query.message || 'An error occurred.',
    user: req.session
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: `Internal server error:\n\n${err.stack}`,
    user: req.session
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: `The path "${req.originalUrl}" was not found on this server.`,
    user: req.session
  });
});

// Create required directories
['uploads', 'protected', 'backup', 'database'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Backup database to backup folder
function backupDatabase() {
  try {
    const srcPath = path.resolve(config.DB_PATH);
    const destPath = path.join(__dirname, 'backup', 'bank.db');
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  } catch (e) {
    console.error('[Backup] Error:', e.message);
  }
}

// Periodic backup
const backupInterval = setInterval(backupDatabase, config.BACKUP_INTERVAL_MS);

// Initial backup
setTimeout(backupDatabase, config.BACKUP_INITIAL_DELAY_MS);

// Start server (only when run directly, not when imported for tests)
if (require.main === module) {
  app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║          SecureTrust Bank - Online Banking           ║`);
    console.log(`║──────────────────────────────────────────────────────║`);
    console.log(`║  Server running at http://${config.HOST}:${config.PORT}             ║`);
    console.log(`║  Test accounts:                                       ║`);
    console.log(`║    admin    / admin123       (Administrator)           ║`);
    console.log(`║    carlos   / carlos2024     (Regular user)            ║`);
    console.log(`║    maria    / mariaSecure!   (Restricted user)         ║`);
    console.log(`║    guest    / guest          (Guest)                   ║`);
    console.log(`║    roberto  / roberto99      (Regular user)            ║`);
    console.log(`║    ana      / ana2024!       (Regular user)            ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);
  });
}

module.exports = app;
