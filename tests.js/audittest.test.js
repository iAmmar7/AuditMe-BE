const request = require('supertest');
const express = require('express');
const app = express();

const auditRouter = require('../routes/auditor');

app.use('/api/auditor', auditRouter);

describe('Audit APIs', () => {
  test('GET /test should respond with status code 200 and message', async () => {
    const response = await request(app).get('/api/auditor/test');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Auditor route works');
  });

  // test('GET /cancel-issue/:id should respond with status code 200', async () => {
  //   // Replace 'dummy-id' with a valid ID
  //   const response = await request(app).get('/api/auditor/cancel-issue/dummy-id');
  //   expect(response.status).toBe(200);
  //   expect(response.body).toHaveProperty('success');
  //   expect(response.body.success).toBe(true);
  // });
});
