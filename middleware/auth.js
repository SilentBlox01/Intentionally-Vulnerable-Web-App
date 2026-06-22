// ============================================
// Authentication Middleware

// ============================================

const config = require('../config');

// Basic session check - VULNERABILITY: Can be bypassed with cookie
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  
  if (req.cookies && req.cookies.loggedIn === 'true') {
    req.session.userId = req.cookies.userId || 1;
    req.session.username = req.cookies.username || 'guest';
    req.session.role = req.cookies.role || 'guest';
    return next();
  }

  return res.redirect('/login');
}

// Admin check - VULNERABILITY: Client-side check + cookie bypass
function isAdmin(req, res, next) {
  
  if (req.cookies && req.cookies.isAdmin === 'true') {
    return next();
  }

  if (req.session && req.session.role === 'admin') {
    return next();
  }

  
  if (req.headers['x-admin-access'] === config.ADMIN_PANEL_KEY || req.headers['x-admin-access'] === 'true') {
    return next();
  }

  return res.status(403).render('error', {
    title: 'Access Denied',
    message: 'You do not have permission to access this page.',
    user: req.session
  });
}

// Role check - VULNERABILITY: Easily bypassed
function requireRole(...roles) {
  return (req, res, next) => {
    
    const userRole = req.query.role || (req.session && req.session.role) || 'guest';

    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).render('error', {
      title: 'Access Denied',
      message: 'Your role does not have permission for this action.',
      user: req.session
    });
  };
}

module.exports = { isAuthenticated, isAdmin, requireRole };
