const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Load Models
const Admin = require('../db/models/Admin');
const User = require('../db/models/User');

// @route   GET /api/auth/Test
// @desc    Test route
// @access  Public
router.get('/test', async (req, res) => res.status(200).json({ message: 'Test route working' }));

// @route   GET /api/auth/admin/signup
// @desc    Admin Signup
// @access  Public
router.post('/admin/signup', async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      success: false,
      message: 'A user cannot make an admin account',
    });
  }

  const admin = await Admin.findOne({ email });

  if (admin) {
    return res.status(400).json({ success: false, message: 'Email already exist' });
  } else {
    const newAdmin = new Admin({ name, email, password });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newAdmin.password, salt, (err, hash) => {
        if (err) throw err;
        newAdmin.password = hash;
        newAdmin
          .save()
          .then((admin) => res.json({ success: true, admin }))
          .catch((err) => console.log(err));
      });
    });
  }
});

// @route   GET /api/auth/admin/login
// @desc    Admin Login
// @access  Public
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check for Password
  bcrypt.compare(password, admin.password).then((isMatch) => {
    if (isMatch) {
      const payload = {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      };

      // Sign Token
      jwt.sign(payload, process.env.PASSPORT_SECRET, { expiresIn: '7d' }, (err, token) => {
        res.json({
          success: true,
          token: 'Bearer ' + token,
          user: payload,
        });
      });
    } else {
      return res.status(400).json({ success: false, message: 'Password Incorrect' });
    }
  });
});

// @route   GET /api/auth/user/signup
// @desc    user Signup
// @access  Public
router.post('/user/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  const admin = await Admin.findOne({ email });

  if (admin) {
    return res.status(400).json({
      success: false,
      message: 'You cannot make account with this email',
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({ success: false, message: 'Email already exist' });
  } else {
    const newUser = new User({ name, email, password, role });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        newUser
          .save()
          .then((user) => res.status(200).json({ success: true, user }))
          .catch((err) => res.status(200).json({ success: false, message: 'Unable to signup' }));
      });
    });
  }
});

// @route   GET /api/auth/user/login
// @desc    User Login
// @access  Public
router.post('/user/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check for Password
  bcrypt.compare(password, user.password).then((isMatch) => {
    if (isMatch) {
      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      // Sign Token
      jwt.sign(payload, process.env.PASSPORT_SECRET, { expiresIn: '7d' }, (err, token) => {
        res.json({
          success: true,
          token: 'Bearer ' + token,
          user: payload,
        });
      });
    } else {
      return res.status(400).json({ success: false, message: 'Password Incorrect' });
    }
  });
});

module.exports = router;
