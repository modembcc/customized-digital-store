let stripe = null;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    'STRIPE_SECRET_KEY is not set; /api/checkout endpoints will return 503 until it is configured.'
  );
} else {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // No explicit apiVersion pinned — the installed `stripe` package version already
  // targets a matching default API version. Revisit once real keys/dashboard access
  // exist and there's a concrete reason to pin one.
}

module.exports = { stripe };
