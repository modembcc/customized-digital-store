jest.mock('../../src/models/User');

const User = require('../../src/models/User');
const { signup, login, logout, me } = require('../../src/controllers/authController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signup', () => {
  it('creates the user with role forced to customer, ignoring any client-supplied role', async () => {
    const createdUser = { _id: '507f1f77bcf86cd799439011', email: 'new@example.com', role: 'customer' };
    User.create.mockResolvedValue(createdUser);

    const req = { body: { email: 'new@example.com', password: 'password123', role: 'admin' } };
    const res = mockRes();

    await signup(req, res);

    expect(User.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      role: 'customer',
    });
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: createdUser._id,
      email: createdUser.email,
      role: createdUser.role,
    });
  });
});

describe('login', () => {
  it('returns 200 and sets a cookie when credentials match', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      role: 'customer',
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const req = { body: { email: 'user@example.com', password: 'password123' } };
    const res = mockRes();

    await login(req, res);

    expect(user.comparePassword).toHaveBeenCalledWith('password123');
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: user._id, email: user.email, role: user.role });
  });

  it('returns 401 when no user matches the email', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const req = { body: { email: 'missing@example.com', password: 'password123' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('returns 401 when the password does not match', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      role: 'customer',
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    const req = { body: { email: 'user@example.com', password: 'wrong-password' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });
});

describe('logout', () => {
  it('clears the auth cookie and returns 200', async () => {
    const req = {};
    const res = mockRes();

    await logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('me', () => {
  it('returns the current user as 200', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', email: 'user@example.com', role: 'customer' };
    User.findById.mockResolvedValue(user);

    const req = { user: { id: user._id, role: 'customer' } };
    const res = mockRes();

    await me(req, res);

    expect(User.findById).toHaveBeenCalledWith(user._id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: user._id, email: user.email, role: user.role });
  });

  it('returns 401 when the user no longer exists', async () => {
    User.findById.mockResolvedValue(null);

    const req = { user: { id: 'deleted-id', role: 'customer' } };
    const res = mockRes();

    await me(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
  });
});
