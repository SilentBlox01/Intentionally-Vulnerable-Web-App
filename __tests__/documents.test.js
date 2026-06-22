const request = require('supertest');
const app = require('../server');

describe('Document Routes', () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
  });

  describe('GET /documents', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app).get('/documents');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should render documents page', async () => {
      const res = await agent.get('/documents');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Documents');
    });

    it('should filter by category', async () => {
      const res = await agent.get('/documents?category=invoice');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /documents/create', () => {
    it('should create a document', async () => {
      const res = await agent
        .post('/documents/create')
        .send({
          title: 'Test Document',
          content: 'This is a test document content.',
          category: 'test'
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/documents');
    });
  });

  describe('GET /api/documents', () => {
    it('should return all documents as JSON', async () => {
      const res = await request(app).get('/api/documents');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return document by ID', async () => {
      const res = await request(app).get('/api/documents/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBeDefined();
    });

    it('should return 404 for non-existent document', async () => {
      const res = await request(app).get('/api/documents/99999');
      expect(res.status).toBe(404);
    });
  });
});
