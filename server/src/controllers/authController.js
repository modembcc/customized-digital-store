const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_NAME, COOKIE_MAX_AGE_MS } = require('../config/auth');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}

function cookieOptions() {
  return { ...baseCookieOptions(), maxAge: COOKIE_MAX_AGE_MS };
}

function toPublicUser(user) {
  return { id: user._id, email: user.email, role: user.role };
}

// POST /api/auth/signup
async function signup(req, res) {
  const { email, password } = req.body;
  // role is always forced server-side — a client-supplied role is ignored.
  const user = await User.create({ email, password, role: 'customer' });
  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
  res.status(201).json(toPublicUser(user));
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const user = email ? await User.findOne({ email: email.toLowerCase() }).select('+password') : null;
  const isMatch = user ? await user.comparePassword(password || '') : false;

  if (!user || !isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.cookie(COOKIE_NAME, signToken(user), cookieOptions());
  res.status(200).json(toPublicUser(user));
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.status(200).json({ message: 'Logged out' });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json(toPublicUser(user));
}

module.exports = { signup, login, logout, me };
