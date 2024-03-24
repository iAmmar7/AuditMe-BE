const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
require('../config/passport')(passport); // Assuming you have a passport configuration

const authRouter = require('../routes/auth.js'); // Adjust this path as needed

const app = express();
app.use(bodyParser.json());
app.use(passport.initialize());
app.use('/api/auth', authRouter);

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect('your_test_database_connection_string', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Disconnect from the test database
  await mongoose.connection.close();
});

describe('Authentication Routes', () => {
  test('GET /api/auth/test - Test Route', async () => {
    const response = await request(app).get('/api/auth/test');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toEqual('Test route working');
  });

  test('POST /api/auth/admin/signup - Admin Signup', async () => {
    const adminData = {
      name: 'Admin Tester',
      email: `testadmin${Date.now()}@example.com`, // Ensure unique email
      password: 'password123',
    };
    const response = await request(app).post('/api/auth/admin/signup').send(adminData);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/auth/user/signup - User Signup', async () => {
    const userData = {
      name: 'User Tester',
      email: `testuser${Date.now()}@example.com`, // Ensure unique email
      password: 'password123',
      role: 'User',
    };
    const response = await request(app).post('/api/auth/user/signup').send(userData);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

