const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {
  describe('GET /login', () => {
    it('should render login page', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Sign In');
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'carlos', password: 'carlos2024' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'carlos', password: 'wrong' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('incorrect');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'nonexistent', password: 'test' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('does not exist');
    });
  });

  describe('GET /register', () => {
    it('should render register page', async () => {
      const res = await request(app).get('/register');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Create Account');
    });
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const uniqueId = Date.now();
      const res = await request(app)
        .post('/register')
        .send({
          username: `testuser_${uniqueId}`,
          password: 'TestPass123!',
          email: `test_${uniqueId}@example.com`,
          full_name: 'Test User',
          phone: '555-0100',
          address: '123 Test St'
        });
      expect(res.status).toBe(200);
      expect(res.text).toContain('Account created successfully');
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({ username: 'test' });
      expect(res.status).toBe(200);
      expect(res.text).toContain('alert-danger');
    });
  });

  describe('GET /logout', () => {
    it('should redirect to login', async () => {
      const res = await request(app).get('/logout');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });
});
