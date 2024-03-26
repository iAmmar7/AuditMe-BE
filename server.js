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
  require('./utils/cronJobs');
}

// Load Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const auditorRoutes = require('./routes/auditor');
const smRoutes = require('./routes/sm');

// Load Middlewares
const { userAuth, userRole } = require('./middlewares');

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Serve images
app.use(express.static(path.join(__dirname, '/public')));

// Connect to MongoDB
require('./db/mongoose');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userAuth, userRoutes);
app.use('/api/auditor', userAuth, auditorRoutes);
app.use('/api/admin', userAuth, userRole(['admin']), adminRoutes);
app.use('/api/sm', userAuth, userRole(['sm', 'admin']), smRoutes);

// // Serve Frontend in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '/dist')));

//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '/dist/', 'index.html'));
//   });
// }

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
