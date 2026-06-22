const request = require('supertest');
const app = require('../server');

describe('Admin Routes', () => {
  let adminAgent;
  let userAgent;

  beforeAll(async () => {
    adminAgent = request.agent(app);
    await adminAgent
      .post('/login')
      .send({ username: 'admin', password: 'admin123' });

    userAgent = request.agent(app);
    await userAgent
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
  });

  describe('GET /admin', () => {
    it('should redirect unauthenticated users to login', async () => {
      const res = await request(app).get('/admin');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should render admin panel for admin user', async () => {
      const res = await adminAgent.get('/admin');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Administration');
      expect(res.text).toContain('Users (');
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin stats (no auth required)', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.totalTransactions).toBeDefined();
      expect(res.body.totalUsers).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return analytics for admin user', async () => {
      const res = await adminAgent.get('/api/admin/analytics');
      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.usersByRole).toBeDefined();
      expect(Array.isArray(res.body.usersByRole)).toBe(true);
      expect(res.body.totalBalance).toBeDefined();
    });
  });

  describe('GET /api/debug', () => {
    it('should return debug info (no auth required)', async () => {
      const res = await request(app).get('/api/debug');
      expect(res.status).toBe(200);
      expect(res.body.nodeVersion).toBeDefined();
      expect(res.body.platform).toBeDefined();
    });
  });

  describe('GET /api/debug/db', () => {
    it('should return database info', async () => {
      const res = await request(app).get('/api/debug/db');
      expect(res.status).toBe(200);
      expect(res.body.tables).toBeDefined();
      expect(Array.isArray(res.body.tables)).toBe(true);
      expect(res.body.userCount).toBeGreaterThan(0);
    });
  });
});
