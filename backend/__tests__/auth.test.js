import request from 'supertest';
import app from '../server.js';

describe('Health Check API', () => {
  test('GET /api/health should return status ok', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });
});

describe('Authentication API', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const userData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).toHaveProperty('name', userData.name);
  });

  test('POST /api/auth/login should authenticate user', async () => {
    // First register a user
    const userData = {
      name: 'Login Test',
      email: `logintest${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Then try to login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', userData.email);
  });

  test('POST /api/auth/login should fail with wrong credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });
});

describe('Protected Routes', () => {
  test('GET /api/reports/pending should require authentication', async () => {
    const response = await request(app)
      .get('/api/reports/pending')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });
});
