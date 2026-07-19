const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const User = require('../../src/models/User');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

afterEach(async () => {
  await User.deleteMany({});
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

describe('POST /api/auth/signup', () => {
  it('creates a customer account and sets an auth cookie', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials());

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), email: 'user@example.com', role: 'customer' });
    expect(res.body.password).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();

    const stored = await User.findOne({ email: 'user@example.com' });
    expect(stored.role).toBe('customer');
  });

  it('ignores a client-supplied role and still creates a customer', async () => {
    const res = await request(app).post('/api/auth/signup').send(credentials({ role: 'admin' }));

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('customer');

    const stored = await User.findOne({ email: 'user@example.com' });
    expect(stored.role).toBe('customer');
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/signup').send(credentials());

    const res = await request(app).post('/api/auth/signup').send(credentials());

    expect(res.status).toBe(409);
  });

  it('rejects a missing password with 400', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'user@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login and GET /api/auth/me', () => {
  it('logs in with correct credentials and resolves /me on the same session', async () => {
    await request(app).post('/api/auth/signup').send(credentials());

    const agent = request.agent(app);
    const loginRes = await agent.post('/api/auth/login').send(credentials());

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.email).toBe('user@example.com');

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('user@example.com');
  });

  it('returns 401 for a wrong password', async () => {
    await request(app).post('/api/auth/signup').send(credentials());

    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials({ password: 'wrong-password' }));

    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials());

    expect(res.status).toBe(401);
  });

  it('returns 401 for /me with no cookie', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 for /me with a tampered cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-real-token');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session so a subsequent /me is unauthenticated', async () => {
    await request(app).post('/api/auth/signup').send(credentials());

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials());
    await agent.get('/api/auth/me').expect(200);

    const logoutRes = await agent.post('/api/auth/logout');
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});

describe('Role-gated admin routes', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/admin/products');

    expect(res.status).toBe(401);
  });

  it('rejects a logged-in customer with 403', async () => {
    await request(app).post('/api/auth/signup').send(credentials());
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials());

    const res = await agent.get('/api/admin/products');

    expect(res.status).toBe(403);
  });

  it('allows a logged-in admin', async () => {
    await User.create({ email: 'admin@example.com', password: 'password123', role: 'admin' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials({ email: 'admin@example.com' }));

    const res = await agent.get('/api/admin/products');

    expect(res.status).toBe(200);
  });
});
