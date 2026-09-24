const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET || 'change-this-in-production');
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  try {
    // JWT claims are a snapshot from the time of login. Load the account again so
    // changes such as leaving a couple take effect immediately.
    const user = await User.findById(claims.id).select('email role coupleId').lean();
    if (!user) return res.status(401).json({ message: 'Session is no longer valid' });
    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      coupleId: user.coupleId,
    };
    next();
  } catch (error) { next(error); }
};
