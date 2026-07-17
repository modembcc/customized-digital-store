const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const Product = require('../../src/models/Product');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

afterEach(async () => {
  await Product.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function sampleProduct(overrides = {}) {
  return {
    name: 'Integration Product',
    description: 'Created during an integration test.',
    price: 9.99,
    category: 'Testing',
    sku: 'INT-001',
    stock: 3,
    ...overrides,
  };
}

describe('GET /api/health', () => {
  it('responds with ok status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/products', () => {
  it('lists only active products', async () => {
    await Product.create(sampleProduct({ sku: 'INT-002' }));
    await Product.create(sampleProduct({ sku: 'INT-003', isActive: false }));

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].sku).toBe('INT-002');
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product', async () => {
    const product = await Product.create(sampleProduct());

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Integration Product');
  });

  it('returns 404 for a missing product', async () => {
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/products/${missingId}`);

    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');

    expect(res.status).toBe(400);
  });
});

describe('Admin product routes', () => {
  it('creates a product via POST /api/admin/products', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .send(sampleProduct());

    expect(res.status).toBe(201);
    expect(res.body.sku).toBe('INT-001');

    const inDb = await Product.findOne({ sku: 'INT-001' });
    expect(inDb).not.toBeNull();
  });

  it('rejects an invalid product with 400', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .send(sampleProduct({ price: -1 }));

    expect(res.status).toBe(400);
  });

  it('lists all products including inactive ones', async () => {
    await Product.create(sampleProduct({ sku: 'INT-004', isActive: false }));

    const res = await request(app).get('/api/admin/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('updates a product via PUT /api/admin/products/:id', async () => {
    const product = await Product.create(sampleProduct());

    const res = await request(app)
      .put(`/api/admin/products/${product._id}`)
      .send({ price: 49.99 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(49.99);
  });

  it('deletes a product via DELETE /api/admin/products/:id', async () => {
    const product = await Product.create(sampleProduct());

    const res = await request(app).delete(`/api/admin/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
  });
});
