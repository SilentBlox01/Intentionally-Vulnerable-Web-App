const request = require('supertest');
const express = require('express');
const { initializeDatabase } = require('../database/init');
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const adminRoutes = require('../routes/admin');
const uploadRoutes = require('../routes/upload');
const session = require('express-session');
const config = require('../config');

let app;
let db;

beforeAll(() => {
  // Use in-memory DB for tests
  config.DB_PATH = ':memory:';
  db = initializeDatabase();

  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: config.SESSION_SECRET || 'testsecret',
    resave: false,
    saveUninitialized: true
  }));

  const path = require('path');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));

  app.use('/', authRoutes(db));
  app.use('/', userRoutes(db));
  app.use('/', adminRoutes(db));
  app.use('/', uploadRoutes(db));
});

afterAll(() => {
  if (db) db.close();
});

describe('Vulnerability Patch Verification', () => {

  let userSessionCookie;

  beforeAll(async () => {
    // Log in as a normal user (carlos is seeded as user in init.js)
    const res = await request(app)
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
    
    // Extract the session cookie and strip the attributes (Path, HttpOnly, etc.)
    const cookies = res.headers['set-cookie'];
    if (cookies) {
      const fullCookie = cookies.find(c => c.startsWith('connect.sid'));
      if (fullCookie) {
        userSessionCookie = fullCookie.split(';')[0];
      }
    }
  });

  test('SQL Injection (SQLi) should be mitigated on Login', async () => {
    // Attempt SQL injection to bypass login
    const response = await request(app)
      .post('/login')
      .send({ username: "admin' --", password: 'wrongpassword' });

    // If patched, it should NOT redirect to dashboard (which implies successful login)
    // Vulnerable code redirects to /dashboard with 302
    expect(response.status).not.toBe(302);
  });

  test('Broken Access Control should be mitigated for Admin Panel', async () => {
    // Attempt to access admin panel with a 'user' role session but spoofed cookies
    const response = await request(app)
      .get('/admin')
      .set('Cookie', `${userSessionCookie}; role=admin; isAdmin=true`);

    // The secure implementation should rely on session role, not cookies
    // Because the session belongs to a standard user, it should deny access (403)
    // A vulnerable implementation trusts the cookie and returns 200
    expect(response.status).toBe(403);
  });

  test('IDOR should be mitigated on Profile viewing', async () => {
    // Attempt to access admin's profile (ID 1) using carlos's session (ID 2)
    const response = await request(app)
      .get('/profile/1')
      .set('Cookie', userSessionCookie); 
    
    // It should block access and return 403 (or redirect)
    // A vulnerable app might return 200 and show the profile
    expect(response.status).not.toBe(200);
  });

});
