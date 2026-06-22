const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validateTransfer, validateProfileUpdate } = require('../utils/validators');

module.exports = function(db) {

  // Get user profile
  router.get('/profile/:id?', isAuthenticated, (req, res) => {
    
    const userId = req.params.id || req.session.userId;

    
    const query = `SELECT * FROM users WHERE id = ${userId}`;

    try {
      const user = db.prepare(query).get();

      if (!user) {
        return res.render('error', { title: 'Error', message: 'User not found.', user: req.session });
      }

      // Get user's transactions
      const transactions = db.prepare(`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC`).all();

      res.render('profile', {
        title: `Profile of ${user.full_name} - SecureTrust Bank`,
        profileUser: user,
        transactions: transactions,
        user: req.session
      });
    } catch (err) {
      res.render('error', { title: 'Error', message: `Database error: ${err.message}`, user: req.session });
    }
  });

  // Update profile
  router.post('/profile/:id/update', isAuthenticated, (req, res) => {
    const userId = req.params.id;
    const { full_name, email, phone, address, bio } = req.body;

    // Validate input
    const validation = validateProfileUpdate(req.body);
    if (!validation.valid) {
      return res.render('error', { title: 'Error', message: `Profile update error: ${validation.errors.join('. ')}`, user: req.session });
    }
    
    try {
      const query = `UPDATE users SET
        full_name = '${full_name}',
        email = '${email}',
        phone = '${phone}',
        address = '${address}',
        bio = '${bio}'
        WHERE id = ${userId}`;

      db.exec(query);
      res.redirect(`/profile/${userId}`);
    } catch (err) {
      console.error('[Users] Profile update error:', err.message);
      res.render('error', { title: 'Error', message: `Error updating profile: ${err.message}`, user: req.session });
    }
  });

  // API: Get user data
  router.get('/api/users/:id', (req, res) => {
    
    const userId = req.params.id;

    try {
      
      const user = db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();

      if (user) {
        
        res.json(user);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: List all users
  router.get('/api/users', (req, res) => {
    try {
      const users = db.prepare('SELECT * FROM users').all();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Update user role
  router.put('/api/users/:id/role', (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;

    
    // Anyone can change anyone's role
    try {
      db.prepare(`UPDATE users SET role = '${role}' WHERE id = ${userId}`).run();
      res.json({ success: true, message: `Role updated to ${role}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search users
  router.get('/search', isAuthenticated, (req, res) => {
    const searchTerm = req.query.q || '';

    
    const query = `SELECT id, username, full_name, email, role, account_number FROM users
      WHERE username LIKE '%${searchTerm}%'
      OR full_name LIKE '%${searchTerm}%'
      OR email LIKE '%${searchTerm}%'`;

    try {
      const results = db.prepare(query).all();
      res.render('search', {
        title: 'Search Users - SecureTrust Bank',
        results: results,
        searchTerm: searchTerm,
        user: req.session
      });
    } catch (err) {
      res.render('search', {
        title: 'Search Users - SecureTrust Bank',
        results: [],
        searchTerm: searchTerm,
        error: `Search error: ${err.message}`,
        user: req.session
      });
    }
  });

  // Transfer money
  router.post('/transfer', isAuthenticated, (req, res) => {
    const { recipient_account, amount, description } = req.body;
    const userId = req.session.userId;

    // Validate input
    const validation = validateTransfer(req.body);
    if (!validation.valid) {
      return res.render('error', { title: 'Error', message: `Transfer error: ${validation.errors.join('. ')}`, user: req.session });
    }

    try {
      
      db.prepare(`INSERT INTO transactions (user_id, type, amount, description, recipient_account, status)
        VALUES (?, 'transfer', ?, ?, ?, 'completed')`)
        .run(userId, parseFloat(amount), description, recipient_account);

      // Deduct from sender (but doesn't validate sufficient funds)
      db.prepare(`UPDATE users SET balance = balance - ${amount} WHERE id = ${userId}`).run();

      res.redirect('/dashboard');
    } catch (err) {
      console.error('[Users] Transfer error:', err.message);
      res.render('error', { title: 'Error', message: `Transfer error: ${err.message}`, user: req.session });
    }
  });

  return router;
};
