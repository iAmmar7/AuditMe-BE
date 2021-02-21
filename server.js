const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');

const app = express();

// Configure Environment variables
dotenv.config();

// Start cron jobs
if (process.env.NODE_ENV === 'production') {
  require('./utils/cronJobs');
}

// Load Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const auditorRoutes = require('./routes/auditor');
const rmRoutes = require('./routes/rm');
const amRoutes = require('./routes/am');

// Load Middlewares
const { userAuth, userRole } = require('./middlewares');

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

// Serve images
app.use(express.static(path.join(__dirname, '/public')));

// Connect to MongoDB
require('./db/mongoose');

// Passport Config
require('./config/passport')(passport);

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userAuth, userRole(['auditor', 'rm', 'am', 'sm', 'viewer']), userRoutes);
app.use('/api/auditor', userAuth, userRole(['auditor', 'sm']), auditorRoutes);
app.use('/api/rm', userAuth, userRole(['rm']), rmRoutes);
app.use('/api/am', userAuth, userRole(['am']), amRoutes);
// app.use('/api/admin', userAuth, userRole(['admin']), adminRoutes);

// Serve Frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/dist/', 'index.html'));
  });
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
