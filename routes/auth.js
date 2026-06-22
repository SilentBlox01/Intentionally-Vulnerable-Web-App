const express = require('express');
const router = express.Router();
const { validateRegistration } = require('../utils/validators');
const config = require('../config');

module.exports = function(db) {

  // Login page
  router.get('/login', (req, res) => {
    res.render('login', { title: 'Sign In - SecureTrust Bank', error: null, user: null });
  });

  // Login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    
    // Exploit: username: ' OR '1'='1' --   password: anything
    // Exploit: admin' --                    password: anything
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    try {
      const user = db.prepare(query).get();

      if (user) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.fullName = user.full_name;
        req.session.accountNumber = user.account_number;

        
        res.cookie('loggedIn', 'true', { httpOnly: false });
        res.cookie('userId', String(user.id), { httpOnly: false });
        res.cookie('username', user.username, { httpOnly: false });
        res.cookie('role', user.role, { httpOnly: false });
        if (user.role === 'admin') {
          res.cookie('isAdmin', 'true', { httpOnly: false });
        }

        // Update last login
        db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ${user.id}`).run();

        // Log the login
        db.prepare(`INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`)
          .run(user.id, 'login', `Successful login for ${user.username}`, req.ip);

        return res.redirect('/dashboard');
      } else {
        
        const userExists = db.prepare(`SELECT id FROM users WHERE username = '${username}'`).get();
        let errorMsg = 'Invalid credentials.';
        if (userExists) {
          errorMsg = `The password for user "${username}" is incorrect.`;
        } else {
          errorMsg = `User "${username}" does not exist in the system.`;
        }
        return res.render('login', { title: 'Sign In - SecureTrust Bank', error: errorMsg, user: null });
      }
    } catch (err) {
      
      return res.render('login', {
        title: 'Sign In - SecureTrust Bank',
        error: `Query error: ${err.message}`,
        user: null
      });
    }
  });

  // Register page
  router.get('/register', (req, res) => {
    res.render('register', { title: 'Create Account - SecureTrust Bank', error: null, success: null, user: null });
  });

  // Register
  router.post('/register', (req, res) => {
    const { username, password, email, full_name, phone, address, role } = req.body;

    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.valid) {
      return res.render('register', {
        title: 'Create Account - SecureTrust Bank',
        error: validation.errors.join('. '),
        success: null,
        user: null
      });
    }

    const userRole = role || 'user';
    const accountNumber = `ST-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      
      const query = `INSERT INTO users (username, password, email, full_name, phone, address, role, account_number, balance)
        VALUES ('${username}', '${password}', '${email}', '${full_name}', '${phone}', '${address}', '${userRole}', '${accountNumber}', ${config.DEFAULT_BALANCE})`;

      db.exec(query);

      return res.render('register', {
        title: 'Create Account - SecureTrust Bank',
        error: null,
        success: `Account created successfully. Your account number is: ${accountNumber}`,
        user: null
      });
    } catch (err) {
      console.error('[Auth] Registration error:', err.message);
      return res.render('register', {
        title: 'Create Account - SecureTrust Bank',
        error: `Error creating account: ${err.message}`,
        success: null,
        user: null
      });
    }
  });

  // Logout
  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('loggedIn');
    res.clearCookie('userId');
    res.clearCookie('username');
    res.clearCookie('role');
    res.clearCookie('isAdmin');
    res.redirect('/login');
  });

  return router;
};
