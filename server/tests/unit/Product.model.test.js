const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Product = require('../../src/models/Product');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function validProductData(overrides = {}) {
  return {
    name: 'Test Product',
    description: 'A product used for testing.',
    price: 19.99,
    category: 'Testing',
    sku: 'TEST-001',
    stock: 5,
    ...overrides,
  };
}

describe('Product model', () => {
  it('saves a valid product', async () => {
    const product = await Product.create(validProductData());

    expect(product._id).toBeDefined();
    expect(product.name).toBe('Test Product');
    expect(product.isActive).toBe(true);
    expect(product.imageUrl).toContain('placehold.co');
  });

  it('requires a name', async () => {
    const product = new Product(validProductData({ name: undefined }));

    await expect(product.validate()).rejects.toThrow(/Product name is required/);
  });

  it('requires a description', async () => {
    const product = new Product(validProductData({ description: undefined }));

    await expect(product.validate()).rejects.toThrow(/Product description is required/);
  });

  it('rejects a negative price', async () => {
    const product = new Product(validProductData({ price: -5 }));

    await expect(product.validate()).rejects.toThrow(/Price cannot be negative/);
  });

  it('rejects a negative stock', async () => {
    const product = new Product(validProductData({ stock: -1 }));

    await expect(product.validate()).rejects.toThrow(/Stock cannot be negative/);
  });

  it('requires a unique SKU', async () => {
    await Product.create(validProductData({ sku: 'DUP-001' }));

    await expect(Product.create(validProductData({ sku: 'DUP-001' }))).rejects.toThrow();
  });

  it('uppercases the SKU', async () => {
    const product = await Product.create(validProductData({ sku: 'lower-case' }));

    expect(product.sku).toBe('LOWER-CASE');
  });
});
