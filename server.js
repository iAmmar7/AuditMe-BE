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
const auth = require('./routes/auth');

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
app.use('/api/auth', auth);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
