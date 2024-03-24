const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load Models
const User = require('../db/models/User');
const {
  validateSignupRequest,
  validateLoginRequest,
} = require('../middlewares');

// @route   GET /api/auth/Test
// @desc    Test route
// @access  Public
router.get('/test', async (req, res) =>
  res.status(200).json({ message: 'Test route working' }),
);

// @route   POST /api/auth/signup
// @desc    user Signup
// @access  Public
router.post('/signup', validateSignupRequest, async (req, res) => {
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
  } else {
    const newUser = new User({ name, email, password, role });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then((user) => res.status(200).json({ success: true, user }))
          .catch((err) =>
            res
              .status(500)
              .json({ success: false, message: 'Unable to signup' }),
          );
      });
    });
  }
});

// @route   POST /api/auth/login
// @desc    User Login
// @access  Public
router.post('/login', validateLoginRequest, async (req, res) => {
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

  // Check for Password
  bcrypt.compare(password, user.password).then((isMatch) => {
    if (isMatch) {
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      };

      // Sign Token
      jwt.sign(
        payload,
        process.env.PASSPORT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          res.json({
            success: true,
            token: token,
            user: payload,
          });
        },
      );
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
  });
});

module.exports = router;
