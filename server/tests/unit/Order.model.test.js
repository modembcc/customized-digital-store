const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await Order.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function createTestUser(overrides = {}) {
  return User.create({ email: 'order-test@example.com', password: 'password123', ...overrides });
}

async function createTestProduct(overrides = {}) {
  return Product.create({
    name: 'Test Product',
    description: 'A product used for testing.',
    price: 19.99,
    category: 'Testing',
    sku: 'ORDER-TEST-001',
    stock: 5,
    ...overrides,
  });
}

function validOrderItem(product, overrides = {}) {
  return {
    product: product._id,
    name: product.name,
    price: product.price,
    quantity: 1,
    ...overrides,
  };
}

describe('Order model', () => {
  it('saves a valid order with items', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    const order = await Order.create({
      user: user._id,
      items: [validOrderItem(product, { quantity: 2 })],
      totalAmount: 39.98,
    });

    expect(order._id).toBeDefined();
    expect(order.items).toHaveLength(1);
    expect(order.status).toBe('pending');
  });

  it('requires a user', async () => {
    const product = await createTestProduct();
    const order = new Order({ items: [validOrderItem(product)], totalAmount: 19.99 });

    await expect(order.validate()).rejects.toThrow(/User is required/);
  });

  it('rejects an empty items array', async () => {
    const user = await createTestUser();
    const order = new Order({ user: user._id, items: [], totalAmount: 0 });

    await expect(order.validate()).rejects.toThrow(/Order must contain at least one item/);
  });

  it('rejects a negative item price', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const order = new Order({
      user: user._id,
      items: [validOrderItem(product, { price: -5 })],
      totalAmount: -5,
    });

    await expect(order.validate()).rejects.toThrow(/Price cannot be negative/);
  });

  it('rejects a negative totalAmount', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const order = new Order({
      user: user._id,
      items: [validOrderItem(product)],
      totalAmount: -1,
    });

    await expect(order.validate()).rejects.toThrow(/Total amount cannot be negative/);
  });

  it('defaults status to pending', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    const order = await Order.create({
      user: user._id,
      items: [validOrderItem(product)],
      totalAmount: 19.99,
    });

    expect(order.status).toBe('pending');
  });

  it('rejects an invalid status value', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const order = new Order({
      user: user._id,
      items: [validOrderItem(product)],
      totalAmount: 19.99,
      status: 'shipped',
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('allows two orders for the same user', async () => {
    const user = await createTestUser();
    const product = await createTestProduct();

    await Order.create({ user: user._id, items: [validOrderItem(product)], totalAmount: 19.99 });

    await expect(
      Order.create({ user: user._id, items: [validOrderItem(product)], totalAmount: 19.99 })
    ).resolves.toBeDefined();
  });
});
