const Cart = require('../models/Cart');
const Order = require('../models/Order');
// Not destructured — `stripeConfig.stripe` is read fresh on every call (rather than
// captured once at require-time) so it stays in sync with whatever the config module
// currently exports, which matters both for testability and for a config value that
// starts null but could be legitimately re-checked.
const stripeConfig = require('../config/stripe');

const STRIPE_NOT_CONFIGURED_MESSAGE = 'Checkout is not available: Stripe is not configured on this server.';

// POST /api/checkout
async function createCheckoutSession(req, res) {
  if (!stripeConfig.stripe) {
    return res.status(503).json({ message: STRIPE_NOT_CONFIGURED_MESSAGE });
  }

  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  const items = cart ? cart.items.filter((item) => item.product) : [];
  if (items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  const orderItems = items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));
  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    totalAmount,
    status: 'pending',
  });

  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const session = await stripeConfig.stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: orderItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    // Our own orderId is the correlation key — no need for Stripe's
    // {CHECKOUT_SESSION_ID} placeholder since the Order already maps to
    // stripeSessionId server-side.
    success_url: `${clientOrigin}/checkout/success?orderId=${order._id}`,
    cancel_url: `${clientOrigin}/checkout/cancel?orderId=${order._id}`,
    metadata: { orderId: order._id.toString() },
  });

  order.stripeSessionId = session.id;
  await order.save();

  res.status(201).json({ url: session.url });
}

// GET /api/checkout/:orderId
async function getCheckoutSession(req, res) {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user.id });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (order.status === 'paid') {
    return res.status(200).json(order);
  }

  if (!order.stripeSessionId) {
    // Session creation failed after the Order was saved (network blip, etc.) — no
    // Mongoose transaction wraps the two writes, so this orphaned-pending state is
    // possible and accepted rather than engineered away.
    return res.status(409).json({ message: 'Checkout session was not created for this order' });
  }
  if (!stripeConfig.stripe) {
    return res.status(503).json({ message: STRIPE_NOT_CONFIGURED_MESSAGE });
  }

  const session = await stripeConfig.stripe.checkout.sessions.retrieve(order.stripeSessionId);
  if (session.payment_status === 'paid') {
    order.status = 'paid';
    order.stripePaymentIntentId = session.payment_intent;
    await order.save();
    // Only clear the cart once payment is confirmed — never eagerly at session creation.
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
  }

  res.status(200).json(order);
}

module.exports = { createCheckoutSession, getCheckoutSession };
