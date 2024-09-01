const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const authRouter = require('../routes/auth.js');
app.use('/api/auth', authRouter);

describe('Authentication Routes', () => {
  test('GET /api/auth/test - Test Route', async () => {
    const response = await request(app).get('/api/auth/test');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual('Test route working');
  });

  test('GET /api/auth/admin/signup - Admin Signup', async () => {
    const response = await request(app).get('/api/auth/admin/signup');
    expect(response.statusCode).toBe(404);
  });

  test('GET /api/auth/user/signup - User Signup', async () => {
    const response = await request(app).get('/api/auth/user/signup');
    expect(response.statusCode).toBe(404);
  });
});
