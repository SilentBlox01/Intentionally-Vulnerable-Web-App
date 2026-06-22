const request = require('supertest');
const app = require('../server');

describe('Dashboard Routes', () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
  });

  describe('GET /', () => {
    it('should redirect to login when not authenticated', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should redirect to dashboard when authenticated', async () => {
      const res = await agent.get('/');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('GET /dashboard', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app).get('/dashboard');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should render dashboard when authenticated', async () => {
      const res = await agent.get('/dashboard');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Dashboard');
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(401);
    });

    it('should return dashboard stats when authenticated', async () => {
      const res = await agent.get('/api/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.currentMonth).toBeDefined();
      expect(res.body.monthlyTrend).toBeDefined();
    });
  });

  describe('GET /error', () => {
    it('should render error page', async () => {
      const res = await request(app).get('/error?message=Test+error');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Test error');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/this-page-does-not-exist');
      expect(res.status).toBe(404);
      expect(res.text).toContain('Page Not Found');
    });
  });
});
