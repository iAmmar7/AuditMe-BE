const jwt = require('jsonwebtoken');

const secretKey = process.env.PASSPORT_SECRET;

module.exports = (req, res, next) => {
  // Get token from the Authorization header
  const token = req.headers.authorization?.split(' ')[1]; // Authorization: Bearer TOKEN

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
  return next();
};
