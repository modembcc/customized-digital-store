const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const User = require('../../src/models/User');
const { UPLOAD_DIR } = require('../../src/middleware/uploadImage');

let mongod;
let app;
let adminAgent;
const createdFiles = [];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();

  await User.create({ email: 'admin@test.com', password: 'password123', role: 'admin' });
  adminAgent = request.agent(app);
  await adminAgent.post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
});

afterEach(() => {
  for (const filename of createdFiles) {
    fs.rmSync(path.join(UPLOAD_DIR, filename), { force: true });
  }
  createdFiles.length = 0;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
  await mongod.stop();
});

describe('POST /api/admin/products/upload', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.png');

    expect(res.status).toBe(401);
  });

  it('rejects a logged-in customer with 403', async () => {
    await request(app).post('/api/auth/signup').send({ email: 'customer@test.com', password: 'password123' });
    const customerAgent = request.agent(app);
    await customerAgent.post('/api/auth/login').send({ email: 'customer@test.com', password: 'password123' });

    const res = await customerAgent
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.png');

    expect(res.status).toBe(403);
  });

  it('rejects a request with no file as 400', async () => {
    const res = await adminAgent.post('/api/admin/products/upload');

    expect(res.status).toBe(400);
  });

  it('rejects a non-image file as 400', async () => {
    const res = await adminAgent
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('just some text'), 'notes.txt');

    expect(res.status).toBe(400);
  });

  it('rejects a file over the 2MB size limit as 400', async () => {
    const oversized = Buffer.alloc(3 * 1024 * 1024);

    const res = await adminAgent.post('/api/admin/products/upload').attach('image', oversized, 'big.png');

    expect(res.status).toBe(400);
  });

  it('rejects a second file under the same field as 400', async () => {
    const res = await adminAgent
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('one'), 'one.png')
      .attach('image', Buffer.from('two'), 'two.png');

    expect(res.status).toBe(400);
  });

  it('accepts a valid image and saves it to disk', async () => {
    const res = await adminAgent
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.png');

    expect(res.status).toBe(201);
    expect(res.body.imageUrl).toMatch(/^\/uploads\/.+\.png$/);

    const filename = path.basename(res.body.imageUrl);
    createdFiles.push(filename);
    expect(fs.existsSync(path.join(UPLOAD_DIR, filename))).toBe(true);
  });

  it('serves the uploaded file at its returned URL', async () => {
    const uploadRes = await adminAgent
      .post('/api/admin/products/upload')
      .attach('image', Buffer.from('fake-image-bytes'), 'photo.jpg');
    createdFiles.push(path.basename(uploadRes.body.imageUrl));

    const fileRes = await request(app).get(uploadRes.body.imageUrl).buffer(true);

    expect(fileRes.status).toBe(200);
    expect(fileRes.headers['content-type']).toMatch(/^image\//);
    expect(fileRes.body.toString()).toBe('fake-image-bytes');
  });
});
