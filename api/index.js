const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();

// Configure Environment variables
dotenv.config();

// Start cron jobs
if (process.env.RUN_CRON_JOBS === 'true') {
  require('../utils/cronJobs');
}

// Load Routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const adminRoutes = require('../routes/admin');
const auditorRoutes = require('../routes/auditor');
const smRoutes = require('../routes/sm');

// Load Middlewares
const { userAuth, userRole } = require('../middlewares');

const logger = require('../utils/logger');

// Connect to MongoDB
require('../db/mongoose');

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Logger
app.use((req, res, next) => {
  const parts = [`Received ${req.method} request on ${req.url}`];

  if (Object.keys(req.body).length) {
    parts.push(`Body: ${JSON.stringify(req.body)}`);
  }

  if (Object.keys(req.query).length) {
    parts.push(`Query: ${JSON.stringify(req.query)}`);
  }

  if (Object.keys(req.params).length) {
    parts.push(`Params: ${JSON.stringify(req.params)}`);
  }

  logger.info(parts.join(' | '));
  next();
});

// Serve images
app.use(express.static(path.join(__dirname, '/public')));

// Health check route
app.get('/', (req, res) => res.send('Express working!!'));

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userAuth, userRoutes);
app.use('/api/auditor', userAuth, auditorRoutes);
app.use('/api/admin', userAuth, userRole(['admin']), adminRoutes);
app.use('/api/sm', userAuth, userRole(['sm', 'admin']), smRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
