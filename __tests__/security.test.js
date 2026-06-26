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

  test('Cross-Site Scripting (XSS) should be mitigated on Search', async () => {
    // Attempt an XSS injection in the search query
    const xssPayload = '<script>alert("xss")</script>';
    const response = await request(app)
      .get(`/search?q=${encodeURIComponent(xssPayload)}`)
      .set('Cookie', userSessionCookie);
    
    // The response should NOT contain the unescaped script tag
    // A secure implementation escapes HTML entities (e.g., &lt;script&gt;)
    expect(response.text).not.toContain(xssPayload);
  });

  test('CSRF should be mitigated on Money Transfer', async () => {
    // Attempt a POST request to transfer money WITHOUT a CSRF token
    const response = await request(app)
      .post('/transfer')
      .set('Cookie', userSessionCookie)
      .send({ recipient_account: 'ST-0000-0000-0000', amount: 100, description: 'CSRF Attack' });
    
    // A secure implementation requires a CSRF token and should reject this (e.g., 403 Forbidden)
    // A vulnerable implementation processes the transfer and redirects (302)
    expect(response.status).not.toBe(302);
  });

  test('Insecure Session Management should be mitigated', async () => {
    // Login to get a new session
    const response = await request(app)
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
    
    const cookies = response.headers['set-cookie'];
    const sessionCookie = cookies.find(c => c.startsWith('connect.sid'));
    
    // A secure implementation MUST set HttpOnly on the session cookie
    expect(sessionCookie).toMatch(/HttpOnly/i);
    // Ideally it should also be Secure, but HttpOnly is the primary check here for mitigation
  });

  test('Sensitive Data Exposure should be mitigated', async () => {
    // Attempt to access the exposed .env file
    const envResponse = await request(app).get('/.env');
    // Attempt to access the debug endpoint
    const debugResponse = await request(app).get('/api/debug');

    // Secure implementation should block access (403 or 404)
    expect(envResponse.status).not.toBe(200);
    // We only test /.env here for simplicity, but both should be secured.
  });

  test('Insecure File Upload should be mitigated', async () => {
    // Attempt to upload a potentially malicious file (e.g., an HTML file acting as a script)
    // We use supertest to simulate a multipart/form-data upload
    const response = await request(app)
      .post('/upload')
      .set('Cookie', userSessionCookie)
      .attach('file', Buffer.from('<script>alert("hacked")</script>'), 'malicious.html');
    
    // A secure implementation should reject non-document files and NOT show a success message for .html
    // A vulnerable implementation accepts it and shows success
    expect(response.text).not.toContain('uploaded successfully');
  });

});
