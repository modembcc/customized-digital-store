jest.mock('../../src/models/Cart');
jest.mock('../../src/models/Order');
jest.mock('../../src/config/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  },
}));

const Cart = require('../../src/models/Cart');
const Order = require('../../src/models/Order');
const stripeConfig = require('../../src/config/stripe');
const { createCheckoutSession, getCheckoutSession } = require('../../src/controllers/checkoutController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Some tests reassign this to null to simulate "not configured" — reset to the mocked client each time.
  stripeConfig.stripe = {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  };
});

describe('createCheckoutSession', () => {
  it('returns 400 and never creates an order when the cart is empty', async () => {
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Your cart is empty' });
    expect(Order.create).not.toHaveBeenCalled();
  });

  it('creates an order and a Stripe session, then returns the session url', async () => {
    const product = { _id: 'prod-1', name: 'Widget', price: 10 };
    const cartDoc = { items: [{ product, quantity: 2 }] };
    Cart.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(cartDoc) });

    const order = {
      _id: 'order-1',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Order.create.mockResolvedValue(order);
    stripeConfig.stripe.checkout.sessions.create.mockResolvedValue({
      id: 'sess-1',
      url: 'https://checkout.stripe.com/sess-1',
    });

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await createCheckoutSession(req, res);

    expect(Order.create).toHaveBeenCalledWith({
      user: 'user-1',
      items: [{ product: 'prod-1', name: 'Widget', price: 10, quantity: 2 }],
      totalAmount: 20,
      status: 'pending',
    });
    expect(stripeConfig.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Widget' },
              unit_amount: 1000,
            },
            quantity: 2,
          },
        ],
        success_url: expect.stringContaining('/checkout/success?orderId=order-1'),
        cancel_url: expect.stringContaining('/checkout/cancel?orderId=order-1'),
        metadata: { orderId: 'order-1' },
      })
    );
    expect(order.stripeSessionId).toBe('sess-1');
    expect(order.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ url: 'https://checkout.stripe.com/sess-1' });
  });

  it('returns 503 when Stripe is not configured, without touching the cart or creating an order', async () => {
    stripeConfig.stripe = null;

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await createCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(Cart.findOne).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
  });
});

describe('getCheckoutSession', () => {
  it('returns 404 when the order does not exist or is not owned by the user', async () => {
    Order.findOne.mockResolvedValue(null);

    const req = { params: { orderId: 'order-1' }, user: { id: 'user-1' } };
    const res = mockRes();

    await getCheckoutSession(req, res);

    expect(Order.findOne).toHaveBeenCalledWith({ _id: 'order-1', user: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns an already-paid order without calling Stripe again', async () => {
    const order = { status: 'paid' };
    Order.findOne.mockResolvedValue(order);

    const req = { params: { orderId: 'order-1' }, user: { id: 'user-1' } };
    const res = mockRes();

    await getCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
    expect(stripeConfig.stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it('returns 409 when the order has no stripeSessionId', async () => {
    const order = { status: 'pending', stripeSessionId: undefined };
    Order.findOne.mockResolvedValue(order);

    const req = { params: { orderId: 'order-1' }, user: { id: 'user-1' } };
    const res = mockRes();

    await getCheckoutSession(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(stripeConfig.stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it('marks the order paid and clears the cart when Stripe reports payment_status paid', async () => {
    const order = {
      status: 'pending',
      stripeSessionId: 'sess-1',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Order.findOne.mockResolvedValue(order);
    stripeConfig.stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      payment_intent: 'pi_1',
    });
    Cart.findOneAndUpdate.mockResolvedValue({});

    const req = { params: { orderId: 'order-1' }, user: { id: 'user-1' } };
    const res = mockRes();

    await getCheckoutSession(req, res);

    expect(order.status).toBe('paid');
    expect(order.stripePaymentIntentId).toBe('pi_1');
    expect(order.save).toHaveBeenCalled();
    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith({ user: 'user-1' }, { items: [] });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('leaves the order pending and the cart untouched when Stripe still reports unpaid', async () => {
    const order = {
      status: 'pending',
      stripeSessionId: 'sess-1',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Order.findOne.mockResolvedValue(order);
    stripeConfig.stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'unpaid' });

    const req = { params: { orderId: 'order-1' }, user: { id: 'user-1' } };
    const res = mockRes();

    await getCheckoutSession(req, res);

    expect(order.status).toBe('pending');
    expect(order.save).not.toHaveBeenCalled();
    expect(Cart.findOneAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
