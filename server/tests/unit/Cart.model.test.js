const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Cart = require('../../src/models/Cart');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await Cart.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createTestUser(overrides = {}) {
  return User.create({ email: 'cart-test@example.com', password: 'password123', ...overrides });
}

async function createTestProduct(overrides = {}) {
  return Product.create({
    name: 'Test Product',
    description: 'A product used for testing.',
    price: 19.99,
    category: 'Testing',
    sku: 'CART-TEST-001',
    stock: 5,
    ...overrides,
  });
}

describe('Cart model', () => {
  it('saves a valid cart with items', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    const cart = await Cart.create({ user: user._id, items: [{ product: product._id, quantity: 2 }] });

    expect(cart._id).toBeDefined();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it('defaults items to an empty array when omitted', async () => {
    const user = await createTestUser();

    const cart = await Cart.create({ user: user._id });

    expect(cart.items).toEqual([]);
  });

  it('requires a user', async () => {
    const cart = new Cart({ items: [] });

    await expect(cart.validate()).rejects.toThrow(/User is required/);
  });

  it('rejects a duplicate user (one cart per user)', async () => {
    const user = await createTestUser();
    await Cart.create({ user: user._id, items: [] });

    await expect(Cart.create({ user: user._id, items: [] })).rejects.toThrow();
  });

  it('requires items.product', async () => {
    const user = await createTestUser();
    const cart = new Cart({ user: user._id, items: [{ quantity: 1 }] });

    await expect(cart.validate()).rejects.toThrow(/Product is required/);
  });

  it('rejects a quantity below 1', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const cart = new Cart({ user: user._id, items: [{ product: product._id, quantity: 0 }] });

    await expect(cart.validate()).rejects.toThrow(/Quantity must be at least 1/);
  });

  it('defaults an omitted item quantity to 1', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    const cart = await Cart.create({ user: user._id, items: [{ product: product._id }] });

    expect(cart.items[0].quantity).toBe(1);
  });
});
