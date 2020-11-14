const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');

const app = express();

// Configure Environment variables
dotenv.config();

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

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
