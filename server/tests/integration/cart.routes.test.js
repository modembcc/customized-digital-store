const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Cart = require('../../src/models/Cart');

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
    name: 'Cart Test Product',
    description: 'Used to test the cart routes.',
    price: 9.99,
    category: 'Testing',
    sku: 'CART-INT-001',
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

describe('GET /api/cart', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/cart');

    expect(res.status).toBe(401);
  });

  it('returns an empty cart for a user with no saved cart yet', async () => {
    const agent = await loginAgent();

    const res = await agent.get('/api/cart');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });
});

describe('PUT /api/cart', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).put('/api/cart').send({ items: [] });

    expect(res.status).toBe(401);
  });

  it('saves items and returns them populated with product data on a GET round-trip', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());

    const putRes = await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 2 }] });
    expect(putRes.status).toBe(200);

    const getRes = await agent.get('/api/cart');
    expect(getRes.status).toBe(200);
    expect(getRes.body.items).toHaveLength(1);
    expect(getRes.body.items[0].quantity).toBe(2);
    expect(getRes.body.items[0].product.name).toBe('Cart Test Product');
    expect(getRes.body.items[0].product.price).toBe(9.99);
  });

  it('replaces (not merges) the existing cart', async () => {
    const agent = await loginAgent();
    const productA = await Product.create(sampleProduct({ sku: 'CART-INT-002' }));
    const productB = await Product.create(sampleProduct({ sku: 'CART-INT-003' }));

    await agent.put('/api/cart').send({ items: [{ product: productA._id, quantity: 1 }] });
    const res = await agent.put('/api/cart').send({ items: [{ product: productB._id, quantity: 5 }] });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].product.sku).toBe('CART-INT-003');
  });

  it('rejects a quantity of 0 with 400', async () => {
    const agent = await loginAgent();
    const product = await Product.create(sampleProduct());

    const res = await agent.put('/api/cart').send({ items: [{ product: product._id, quantity: 0 }] });

    expect(res.status).toBe(400);
  });

  it('keeps each user cart isolated from the others', async () => {
    const agentA = await loginAgent('usera@example.com');
    const agentB = await loginAgent('userb@example.com');
    const productA = await Product.create(sampleProduct({ sku: 'CART-INT-004' }));
    const productB = await Product.create(sampleProduct({ sku: 'CART-INT-005' }));

    await agentA.put('/api/cart').send({ items: [{ product: productA._id, quantity: 1 }] });
    await agentB.put('/api/cart').send({ items: [{ product: productB._id, quantity: 7 }] });

    const cartA = await agentA.get('/api/cart');
    const cartB = await agentB.get('/api/cart');

    expect(cartA.body.items).toHaveLength(1);
    expect(cartA.body.items[0].product.sku).toBe('CART-INT-004');
    expect(cartB.body.items).toHaveLength(1);
    expect(cartB.body.items[0].product.sku).toBe('CART-INT-005');
  });
});
