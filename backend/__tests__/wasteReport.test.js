import request from 'supertest';
import app from '../server.js';

describe('Waste Report API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Register and login a test user
    const userData = {
      name: 'Report Test User',
      email: `reporttest${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  test('POST /api/reports should create a waste report', async () => {
    const reportData = {
      wasteType: 'Plastic',
      description: 'Test waste description',
      latitude: 10.8505,
      longitude: 76.2711,
      location: 'Test Location',
      zone: 'Zone A'
    };

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reportData)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('wasteType', reportData.wasteType);
    expect(response.body).toHaveProperty('latitude', reportData.latitude);
    expect(response.body).toHaveProperty('longitude', reportData.longitude);
    expect(response.body).toHaveProperty('status', 'pending');
  });

  test('POST /api/reports should fail without coordinates', async () => {
    const reportData = {
      wasteType: 'Plastic',
      description: 'Test waste description',
      location: 'Test Location'
    };

    const response = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reportData)
      .expect(400);

    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/reports/user/:userId should return user reports', async () => {
    const response = await request(app)
      .get(`/api/reports/user/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('Admin Waste Report Operations', () => {
  let adminToken;
  let reportId;

  beforeAll(async () => {
    // Register and login an admin
    const adminData = {
      name: 'Admin Test',
      email: `admintest${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
      accessCode: 'ADMIN123'
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = registerRes.body.token;

    // Create a test report
    const reportData = {
      wasteType: 'Metal',
      description: 'Test report for verification',
      latitude: 10.8505,
      longitude: 76.2711,
      location: 'Test Location',
      zone: 'Zone B'
    };

    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(reportData);

    reportId = reportRes.body._id;
  });

  test('GET /api/reports/pending should return pending reports (admin)', async () => {
    const response = await request(app)
      .get('/api/reports/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/reports/zones should return zone statistics (admin)', async () => {
    const response = await request(app)
      .get('/api/reports/zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('PATCH /api/reports/:id/verify should approve a report', async () => {
    const response = await request(app)
      .patch(`/api/reports/${reportId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'verified');
  });
});

describe('Analytics API', () => {
  let adminToken;

  beforeAll(async () => {
    const adminData = {
      name: 'Analytics Admin',
      email: `analytics${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
      accessCode: 'ADMIN123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminToken = res.body.token;
  });

  test('GET /api/reports/analytics/efficiency should return metrics', async () => {
    const response = await request(app)
      .get('/api/reports/analytics/efficiency')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('verified');
    expect(response.body).toHaveProperty('efficiency');
  });

  test('GET /api/reports/analytics/waste-type should return waste type stats', async () => {
    const response = await request(app)
      .get('/api/reports/analytics/waste-type')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/reports/analytics/daily should return daily reports', async () => {
    const response = await request(app)
      .get('/api/reports/analytics/daily')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('reports');
    expect(Array.isArray(response.body.reports)).toBe(true);
  });
});
