const { check, validationResult } = require('express-validator');
const { userRoles } = require('../../utils/constants');

const validateSignupRequest = [
  check('name', 'Name is required').not().isEmpty(),
  check('name', 'Name must be a string').isString(),

  check('email', 'Valid email is required').isEmail(),
  check('email').normalizeEmail(),

  check('password', 'Password is required').not().isEmpty(),
  check('password', 'Password must be a string').isString(),

  check('role', 'Invalid role').isIn(userRoles),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateSignupRequest;
