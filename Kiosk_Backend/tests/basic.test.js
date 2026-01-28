const request = require('supertest');
const { app } = require('../server');

describe('Diagnostics API', () => {
  // Test health endpoint
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('OK');
  });

  // Test performance endpoint
  test('GET /api/diagnostics/performance should return 200', async () => {
    const response = await request(app).get('/api/diagnostics/performance');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  // Test network endpoint
  test('GET /api/diagnostics/network should return 200', async () => {
    const response = await request(app).get('/api/diagnostics/network');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  // Test system endpoint
  test('GET /api/diagnostics/system should return 200', async () => {
    const response = await request(app).get('/api/diagnostics/system');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
  });

  // Test 404 handler
  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});