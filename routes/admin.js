const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const config = require('../config');

module.exports = function(db) {

  // Admin panel
  router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users').all();
      const transactions = db.prepare('SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 50').all();
      const documents = db.prepare('SELECT d.*, u.username FROM documents d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC').all();
      const tickets = db.prepare('SELECT t.*, u.username FROM tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC').all();
      const uploads = db.prepare('SELECT up.*, u.username FROM uploads up JOIN users u ON up.user_id = u.id ORDER BY up.created_at DESC').all();
      const auditLog = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all();

      res.render('admin', {
        title: 'Administration Console - SecureTrust Bank',
        users: users,
        transactions: transactions,
        documents: documents,
        tickets: tickets,
        uploads: uploads,
        auditLog: auditLog,
        user: req.session
      });
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // Admin analytics API
  router.get('/api/admin/analytics', isAuthenticated, isAdmin, (req, res) => {
    try {
      const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
      const totalBalance = db.prepare('SELECT COALESCE(SUM(balance), 0) as s FROM users').get().s;
      const totalTransactions = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
      const openTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open'").get().c;
      const totalDocuments = db.prepare('SELECT COUNT(*) as c FROM documents').get().c;
      const totalUploads = db.prepare('SELECT COUNT(*) as c FROM uploads').get().c;

      const usersByRole = db.prepare(`
        SELECT role, COUNT(*) as count FROM users GROUP BY role
      `).all();

      const monthlyTransactions = db.prepare(`
        SELECT strftime('%Y-%m', created_at) as month,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as totalAmount
        FROM transactions
        WHERE created_at >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
      `).all();

      const ticketsByStatus = db.prepare(`
        SELECT status, COUNT(*) as count FROM tickets GROUP BY status
      `).all();

      const recentAudit = db.prepare(`
        SELECT al.*, u.username
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 15
      `).all();

      const topUsers = db.prepare(`
        SELECT username, full_name, balance, role, last_login
        FROM users ORDER BY balance DESC LIMIT 5
      `).all();

      res.json({
        totalUsers: totalUsers,
        totalBalance: totalBalance,
        totalTransactions: totalTransactions,
        openTickets: openTickets,
        totalDocuments: totalDocuments,
        totalUploads: totalUploads,
        usersByRole: usersByRole,
        monthlyTransactions: monthlyTransactions,
        ticketsByStatus: ticketsByStatus,
        recentAudit: recentAudit,
        topUsers: topUsers
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle user status
  router.post('/admin/users/:id/status', isAuthenticated, isAdmin, (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;
    try {
      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status || 'active', userId);
      res.redirect('/admin');
    } catch (err) {
      console.error('[Admin] Status toggle error:', err.message);
      res.redirect('/admin');
    }
  });

  // Export users as Excel
  router.get('/admin/export/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, full_name, email, role, account_number, balance, created_at, last_login FROM users').all();

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SecureTrust Bank';

      const sheet = workbook.addWorksheet('Users', {
        properties: { tabColor: { argb: '003087' } }
      });

      sheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Username', key: 'username', width: 16 },
        { header: 'Full Name', key: 'full_name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 14 },
        { header: 'Account #', key: 'account_number', width: 22 },
        { header: 'Balance', key: 'balance', width: 16 },
        { header: 'Created', key: 'created_at', width: 20 },
        { header: 'Last Login', key: 'last_login', width: 20 }
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003087' } };

      users.forEach(u => {
        const row = sheet.addRow(u);
        row.getCell('balance').numFmt = '$#,##0.00';
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=securetrust_users_${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.redirect('/admin');
    }
  });

  // Delete user
  router.post('/admin/users/:id/delete', isAuthenticated, isAdmin, (req, res) => {
    const userId = req.params.id;
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      res.redirect('/admin');
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // Update user role from admin
  router.post('/admin/users/:id/role', isAuthenticated, isAdmin, (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
    try {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
      res.redirect('/admin');
    } catch (err) {
      res.render('error', { title: 'Error', message: `Error: ${err.message}`, user: req.session });
    }
  });

  // OS Command Injection Endpoint (Vulnerable)
  router.get('/admin/system-status', isAuthenticated, isAdmin, (req, res) => {
    const ip = req.query.ip || '127.0.0.1';
    // Intentionally vulnerable: no sanitization of 'ip'
    const command = `ping -n 3 ${ip}`; // Use -n for Windows compatibility
    const { exec } = require('child_process');

    exec(command, (error, stdout, stderr) => {
      res.render('admin/system-status', {
        title: 'System Network Status',
        output: stdout || stderr || (error ? error.message : 'No output'),
        ip: ip,
        user: req.session
      });
    });
  });

  // Server-Side Request Forgery (SSRF) Endpoint (Vulnerable)
  router.post('/admin/fetch-receipt', isAuthenticated, isAdmin, async (req, res) => {
    const url = req.body.url;
    if (!url) {
      return res.status(400).send('URL is required');
    }

    // Intentionally vulnerable: no validation of the URL (allows internal IPs/hostnames)
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(err => {
        // Fallback to built-in fetch for Node 18+
        if (typeof global.fetch === 'function') {
           return global.fetch(...args);
        }
        throw err;
      });

      const response = await (typeof global.fetch === 'function' ? global.fetch(url) : (await fetch())(url));
      const text = await response.text();

      res.render('admin/fetch-receipt', {
        title: 'External Receipt Viewer',
        content: text,
        url: url,
        user: req.session
      });
    } catch (err) {
      res.render('admin/fetch-receipt', {
        title: 'External Receipt Viewer',
        content: `Error fetching URL: ${err.message}`,
        url: url,
        user: req.session
      });
    }
  });

  // Debug endpoint
  router.get('/api/debug', (req, res) => {
    res.json({
      config: config,
      environment: process.env,
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      cwd: process.cwd()
    });
  });

  // Database info endpoint
  router.get('/api/debug/db', (req, res) => {
    try {
      const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      res.json({
        tables: tables,
        userCount: userCount.count,
        dbPath: config.DB_PATH
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin stats API
  router.get('/api/admin/stats', (req, res) => {
    try {
      const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
        totalTransactions: db.prepare('SELECT COUNT(*) as c FROM transactions').get().c,
        totalBalance: db.prepare('SELECT SUM(balance) as s FROM users').get().s,
        totalDocuments: db.prepare('SELECT COUNT(*) as c FROM documents').get().c,
        totalUploads: db.prepare('SELECT COUNT(*) as c FROM uploads').get().c,
        recentLogins: db.prepare('SELECT username, last_login FROM users WHERE last_login IS NOT NULL ORDER BY last_login DESC LIMIT 5').all()
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
