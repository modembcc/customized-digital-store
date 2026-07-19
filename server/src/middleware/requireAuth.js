const jwt = require('jsonwebtoken');
const { JWT_SECRET, COOKIE_NAME } = require('../config/auth');

// Trusts the JWT payload for req.user (no DB lookup) so protected requests
// stay stateless. Tradeoff: a role change made directly in the database
// won't take effect for that user until they log out and back in, since
// their existing cookie still encodes the old role.
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

module.exports = requireAuth;
