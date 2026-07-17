// Placeholder gate for admin-only routes. No auth system exists yet, so this
// always allows the request through; swap in real session/token checks later.
function requireAdmin(req, res, next) {
  next();
}

module.exports = requireAdmin;
