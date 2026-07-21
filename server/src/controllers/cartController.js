const Cart = require('../models/Cart');

function toCartResponse(cart) {
  // Guard against a dangling reference to a deleted Product — populate()
  // resolves those to null, and the client always reads item.product._id.
  const items = cart ? cart.items.filter((item) => item.product) : [];
  return { items };
}

// GET /api/cart
async function getCart(req, res) {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  res.status(200).json(toCartResponse(cart));
}

// PUT /api/cart
async function replaceCart(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('items.product');
  res.status(200).json(toCartResponse(cart));
}

module.exports = { getCart, replaceCart };
