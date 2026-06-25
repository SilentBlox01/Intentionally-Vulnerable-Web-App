const request = require('supertest');
const express = require('express');
const initializeDatabase = require('../database/init');
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

  app.use('/', authRoutes(db));
  app.use('/', userRoutes(db));
  app.use('/', adminRoutes(db));
  app.use('/', uploadRoutes(db));
});

afterAll(() => {
  if (db) db.close();
});

describe('Vulnerability Patch Verification', () => {

  test('SQL Injection (SQLi) should be mitigated on Login', async () => {
    // Attempt SQL injection to bypass login
    const response = await request(app)
      .post('/login')
      .send({ username: "admin' --", password: 'wrongpassword' });

    // If patched, it should NOT redirect to dashboard (which implies successful login)
    // Vulnerable code redirects to /dashboard with 302
    expect(response.status).not.toBe(302);
    expect(response.text).toContain('does not exist'); // Or some error message indicating failure
  });

  test('Broken Access Control should be mitigated for Admin Panel', async () => {
    // Attempt to access admin panel with a 'user' role cookie
    const response = await request(app)
      .get('/admin')
      .set('Cookie', ['role=admin; isAdmin=true; loggedIn=true; userId=2']);

    // The secure implementation should rely on session, not cookies
    // Because session has no role set in this request, it should deny access
    expect(response.status).toBe(403);
  });

  test('IDOR should be mitigated on Profile viewing', async () => {
    // The test framework creates a session, but let's simulate a raw request to someone else's profile
    // Without proper session setup matching the ID, it should fail
    const response = await request(app).get('/profile/1'); 
    
    // It should either redirect to login (if no session) or return 403 (if wrong session)
    // A vulnerable app might return 200 and show the profile
    expect(response.status).not.toBe(200);
  });

});
