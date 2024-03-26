module.exports = (roles) => (req, res, next) => {
  console.log('req.user.role', req.user.role);
  return !roles.includes(req.user.role)
    ? res.status(401).json('Unauthorized')
    : next();
};
