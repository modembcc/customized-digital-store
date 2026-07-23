jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  }));
});

process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Cart = require('../../src/models/Cart');
const Order = require('../../src/models/Order');
const { stripe } = require('../../src/config/stripe');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

afterEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Cart.deleteMany({});
  await Order.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function credentials(overrides = {}) {
  return {
    email: 'user@example.com',
    password: 'password123',
    ...overrides,
  };
}

function sampleProduct(overrides = {}) {
  return {
    name: 'Checkout Test Product',
    description: 'Used to test the checkout routes.',
    price: 9.99,
    category: 'Testing',
    sku: 'CHECKOUT-INT-001',
    stock: 10,
    ...overrides,
  };
}

async function loginAgent(email = 'user@example.com') {
  await request(app).post('/api/auth/signup').send(credentials({ email }));
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send(credentials({ email }));
  return agent;
}

describe('POST /api/checkout', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/checkout');

    expect(res.status).toBe(401);
  });

  it('rejects an empty cart with 400', async () => {
    const agent = await loginAgent();

    const res = await agent.post('/api/checkout');

    expect(res.status).toBe(400);
  });

  it('creates a pending order and a Stripe session for the cart contents', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());
    await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 3 }] });
    stripe.checkout.sessions.create.mockResolvedValue({
      id: 'sess_fake_1',
      url: 'https://checkout.stripe.com/sess_fake_1',
    });

    const res = await agent.post('/api/checkout');

    expect(res.status).toBe(201);
    expect(res.body.url).toBe('https://checkout.stripe.com/sess_fake_1');

    const orders = await Order.find({});
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('pending');
    expect(orders[0].stripeSessionId).toBe('sess_fake_1');
    expect(orders[0].items[0].name).toBe('Checkout Test Product');
    expect(orders[0].items[0].quantity).toBe(3);
    expect(orders[0].totalAmount).toBeCloseTo(29.97);
  });

  it('creates a separate pending order on a second call (no dedup)', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());
    await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 1 }] });
    stripe.checkout.sessions.create.mockResolvedValue({ id: 'sess_fake_2', url: 'https://checkout.stripe.com/sess_fake_2' });

    await agent.post('/api/checkout');
    await agent.post('/api/checkout');

    const orders = await Order.find({});
    expect(orders).toHaveLength(2);
  });
});

describe('GET /api/checkout/:orderId', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/checkout/000000000000000000000000');

    expect(res.status).toBe(401);
  });

  it('returns 404 for an order that does not belong to the requesting user', async () => {
    const agentA = await loginAgent('checkouta@example.com');
    const agentB = await loginAgent('checkoutb@example.com');
    const product = await Product.create(sampleProduct());
    await agentA.put('/api/cart').send({ items: [{ product: product._id, quantity: 1 }] });
    stripe.checkout.sessions.create.mockResolvedValue({ id: 'sess_fake_3', url: 'https://checkout.stripe.com/sess_fake_3' });
    const createRes = await agentA.post('/api/checkout');
    const orderId = (await Order.findOne({})).id;
    expect(createRes.status).toBe(201);

    const res = await agentB.get(`/api/checkout/${orderId}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed orderId', async () => {
    const agent = await loginAgent();

    const res = await agent.get('/api/checkout/not-a-valid-id');

    expect(res.status).toBe(400);
  });

  it('marks the order paid and empties the cart once Stripe reports payment_status paid', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());
    await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 2 }] });
    stripe.checkout.sessions.create.mockResolvedValue({ id: 'sess_fake_4', url: 'https://checkout.stripe.com/sess_fake_4' });
    await agent.post('/api/checkout');
    const order = await Order.findOne({});
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid', payment_intent: 'pi_fake_1' });

    const res = await agent.get(`/api/checkout/${order.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(res.body.stripePaymentIntentId).toBe('pi_fake_1');

    const cartRes = await agent.get('/api/cart');
    expect(cartRes.body.items).toEqual([]);
  });

  it('does not call Stripe again for an already-paid order', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());
    await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 1 }] });
    stripe.checkout.sessions.create.mockResolvedValue({ id: 'sess_fake_5', url: 'https://checkout.stripe.com/sess_fake_5' });
    await agent.post('/api/checkout');
    const order = await Order.findOne({});
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_status: 'paid', payment_intent: 'pi_fake_2' });
    await agent.get(`/api/checkout/${order.id}`);
    stripe.checkout.sessions.retrieve.mockClear();

    const res = await agent.get(`/api/checkout/${order.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paid');
    expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });
});
