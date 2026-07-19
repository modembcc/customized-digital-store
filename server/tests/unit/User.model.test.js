const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../src/models/User');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

function validUserData(overrides = {}) {
  return {
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}

describe('User model', () => {
  it('saves a valid user and defaults role to customer', async () => {
    const user = await User.create(validUserData());

    expect(user._id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('customer');
  });

  it('requires an email', async () => {
    const user = new User(validUserData({ email: undefined }));

    await expect(user.validate()).rejects.toThrow(/Email is required/);
  });

  it('requires a password', async () => {
    const user = new User(validUserData({ password: undefined }));

    await expect(user.validate()).rejects.toThrow(/Password is required/);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const user = new User(validUserData({ password: 'short' }));

    await expect(user.validate()).rejects.toThrow(/at least 8 characters/);
  });

  it('rejects a malformed email', async () => {
    const user = new User(validUserData({ email: 'not-an-email' }));

    await expect(user.validate()).rejects.toThrow(/valid email/);
  });

  it('lowercases and trims the email on save', async () => {
    const user = await User.create(validUserData({ email: '  Test@Example.com  ' }));

    expect(user.email).toBe('test@example.com');
  });

  it('requires a unique email', async () => {
    await User.create(validUserData({ email: 'dup@example.com' }));

    await expect(User.create(validUserData({ email: 'dup@example.com' }))).rejects.toThrow();
  });

  it('hashes the password on save', async () => {
    const user = await User.create(validUserData());
    const stored = await User.findById(user._id).select('+password');

    expect(stored.password).not.toBe('password123');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('does not rehash the password when re-saving without changing it', async () => {
    const user = await User.create(validUserData());
    const stored = await User.findById(user._id).select('+password');
    const originalHash = stored.password;

    stored.email = 'changed@example.com';
    await stored.save();

    const restored = await User.findById(user._id).select('+password');
    expect(restored.password).toBe(originalHash);
  });

  it('excludes the password by default but includes it with select("+password")', async () => {
    const user = await User.create(validUserData());

    const withoutPassword = await User.findById(user._id);
    expect(withoutPassword.password).toBeUndefined();

    const withPassword = await User.findById(user._id).select('+password');
    expect(withPassword.password).toBeDefined();
  });

  describe('comparePassword', () => {
    it('resolves true for the correct password', async () => {
      const user = await User.create(validUserData());
      const stored = await User.findById(user._id).select('+password');

      await expect(stored.comparePassword('password123')).resolves.toBe(true);
    });

    it('resolves false for an incorrect password', async () => {
      const user = await User.create(validUserData());
      const stored = await User.findById(user._id).select('+password');

      await expect(stored.comparePassword('wrong-password')).resolves.toBe(false);
    });
  });
});
