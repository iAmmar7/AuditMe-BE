const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('../routes/user.js'); // Adjust the path according to your project structure

const app = express();
app.use(bodyParser.json());
app.use('/api/user', userRouter);

describe('User Management APIs', () => {
  let tempUserId;

  beforeAll(async () => {
    // Setup code if needed, e.g., create a user to be deleted later
    // Adjust this part to match your actual user creation logic
    const userData = {
      badgeNumber: '12345',
      name: 'Test User',
      password: 'password123',
      userType: 'Admin',
    };
    const response = await request(app).post('/api/user/add-user').send(userData);
    tempUserId = response.body.user?._id;
  }, 30000); // Increase timeout for beforeAll hook

  test('Add a user', async () => {
    const userData = {
      badgeNumber: 'TestBadgeNumber',
      name: 'Test User 2',
      password: 'TestPassword',
      userType: 'Admin',
    };
    const response = await request(app).post('/api/user/add-user').send(userData);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 10000); // Increase timeout for this test

  test('List all users', async () => {
    const response = await request(app).post('/api/user/all-users').send({});
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.users)).toBe(true);
  }, 10000); // Increase timeout for this test

  test('Delete a user', async () => {
    // Make sure this ID exists or is obtained from beforeAll
    const response = await request(app).delete(`/api/user/delete-user/${tempUserId}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  }, 10000); // Increase timeout for this test

  afterAll(async () => {
    // Teardown code if needed, e.g., remove any data created for testing
    // This is a placeholder; actual implementation depends on your project setup
  }, 30000); // Increase timeout for afterAll hook
});
