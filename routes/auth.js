const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Load Models
const User = require('../db/models/User');
const {
  validateSignupRequest,
  validateLoginRequest,
} = require('../middlewares');

const generateToken = (data) => {
  return jwt.sign(data, process.env.PASSPORT_SECRET, { expiresIn: '7d' });
};

// @route   GET /api/auth/Test
// @desc    Test route
// @access  Public
router.get('/test', async (req, res) =>
  res.status(200).json({ message: 'Test route working' }),
);

// @route   POST /api/auth/signup
// @desc    User Signup
// @access  Public
router.post('/signup', validateSignupRequest, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        errors: [
          {
            location: 'body',
            msg: 'Account already exist with this email',
            path: 'email',
            type: 'field',
            value: email,
          },
        ],
      });
    }

    const newUser = new User({ name, email, password, role });

    await newUser.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to signup' });
  }
});

// @route   POST /api/auth/login
// @desc    User Login
// @access  Public
router.post('/login', validateLoginRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        errors: [
          {
            location: 'body',
            msg: 'Email not found',
            path: 'email',
            type: 'field',
            value: email,
          },
        ],
      });
    }

    if (await user.comparePassword(password)) {
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = generateToken(payload);
      return res.json({
        success: true,
        token: token,
        user: payload,
      });
    } else {
      return res.status(401).json({
        success: false,
        errors: [
          {
            location: 'body',
            msg: 'Incorrect password',
            path: 'password',
            type: 'field',
            value: password,
          },
        ],
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to login' });
  }
});

module.exports = router;
