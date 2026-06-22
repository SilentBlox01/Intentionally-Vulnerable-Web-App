const request = require('supertest');
const app = require('../server');

describe('User Routes', () => {
  let agent;
  let userId;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent
      .post('/login')
      .send({ username: 'carlos', password: 'carlos2024' });
    userId = 2;
  });

  describe('GET /profile', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app).get('/profile');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should render profile page when authenticated', async () => {
      const res = await agent.get('/profile');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Profile');
    });

    it('should render specific user profile', async () => {
      const res = await agent.get('/profile/1');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Profile');
    });
  });

  describe('POST /profile/:id/update', () => {
    it('should update profile', async () => {
      const res = await agent
        .post(`/profile/${userId}/update`)
        .send({
          full_name: 'Carlos García Updated',
          email: 'carlos_updated@example.com',
          phone: '555-9999',
          address: '456 Updated Ave',
          bio: 'Updated bio'
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(`/profile/${userId}`);
    });
  });

  describe('GET /api/users', () => {
    it('should return all users as JSON', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID', async () => {
      const res = await request(app).get('/api/users/1');
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('admin');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('should update user role', async () => {
      const res = await request(app)
        .put('/api/users/3/role')
        .send({ role: 'user' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /transfer', () => {
    it('should redirect to login if not authenticated', async () => {
      const res = await request(app)
        .post('/transfer')
        .send({
          recipient_account: 'ST-1234-5678-9012',
          amount: '100',
          description: 'Test transfer'
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('should process transfer when authenticated', async () => {
      const res = await agent
        .post('/transfer')
        .send({
          recipient_account: 'ST-1234-5678-9012',
          amount: '50',
          description: 'Test transfer'
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('GET /search', () => {
    it('should search users', async () => {
      const res = await agent.get('/search?q=carlos');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Search Users');
    });
  });
});
