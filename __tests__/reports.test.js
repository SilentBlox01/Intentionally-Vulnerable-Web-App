const request = require('supertest');
const app = require('../server');

describe('Report Routes', () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
  });

  describe('GET /reports', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app).get('/reports');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should render reports page', async () => {
      const res = await agent.get('/reports');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Reports');
    });
  });

  describe('GET /reports/export/pdf', () => {
    it('should generate PDF report', async () => {
      const res = await agent.get('/reports/generate/2');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('GET /reports/export/excel', () => {
    it('should generate Excel report', async () => {
      const res = await agent.get('/reports/export/excel');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheet');
    });
  });

  describe('GET /api/reports/analytics', () => {
    it('should return analytics data', async () => {
      const res = await agent.get('/api/reports/analytics');
      expect(res.status).toBe(200);
      expect(res.body.transactions).toBeDefined();
      expect(res.body.summary).toBeDefined();
    });
  });
});
