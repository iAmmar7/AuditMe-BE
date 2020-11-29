const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');

const app = express();

// Configure Environment variables
dotenv.config();

// Load Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

// Load Middlewares
const { userAuth, userRole } = require('./middlewares');

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(passport.initialize());

// Serve images
app.use(express.static(path.join(__dirname, '/public')));

// Serve Frontend
app.use(express.static(path.join(__dirname, '/dist')));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '/dist/', 'index.html'));
});

// Connect to MongoDB
require('./db/mongoose');

// Passport Config
require('./config/passport')(passport);

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', userAuth, userRole(['admin']), adminRoutes);
app.use('/api/user', userAuth, userRole(['user']), userRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
