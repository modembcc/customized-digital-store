const DEV_FALLBACK_SECRET = 'dev-insecure-jwt-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn(
    'JWT_SECRET is not set; falling back to an insecure development secret. Set JWT_SECRET in server/.env for any non-local use.'
  );
}

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || DEV_FALLBACK_SECRET,
  JWT_EXPIRES_IN: '7d',
  COOKIE_NAME: 'token',
  COOKIE_MAX_AGE_MS,
};
