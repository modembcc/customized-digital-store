jest.mock('../../src/models/Cart');

const Cart = require('../../src/models/Cart');
const { getCart, replaceCart } = require('../../src/controllers/cartController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCart', () => {
  it('returns the populated cart for the current user', async () => {
    const cartDoc = { items: [{ product: { _id: '1', name: 'A' }, quantity: 2 }] };
    const populate = jest.fn().mockResolvedValue(cartDoc);
    Cart.findOne.mockReturnValue({ populate });

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await getCart(req, res);

    expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user-1' });
    expect(populate).toHaveBeenCalledWith('items.product');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: cartDoc.items });
  });

  it('returns an empty items array when the user has no cart yet', async () => {
    const populate = jest.fn().mockResolvedValue(null);
    Cart.findOne.mockReturnValue({ populate });

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('filters out items whose product was deleted', async () => {
    const cartDoc = {
      items: [
        { product: { _id: '1', name: 'A' }, quantity: 1 },
        { product: null, quantity: 3 },
      ],
    };
    const populate = jest.fn().mockResolvedValue(cartDoc);
    Cart.findOne.mockReturnValue({ populate });

    const req = { user: { id: 'user-1' } };
    const res = mockRes();

    await getCart(req, res);

    expect(res.json).toHaveBeenCalledWith({ items: [cartDoc.items[0]] });
  });
});

describe('replaceCart', () => {
  it('upserts the cart with the given items', async () => {
    const items = [{ product: '1', quantity: 2 }];
    const cartDoc = { items: [{ product: { _id: '1', name: 'A' }, quantity: 2 }] };
    const populate = jest.fn().mockResolvedValue(cartDoc);
    Cart.findOneAndUpdate.mockReturnValue({ populate });

    const req = { user: { id: 'user-1' }, body: { items } };
    const res = mockRes();

    await replaceCart(req, res);

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'user-1' },
      { items },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: cartDoc.items });
  });

  it('treats a non-array items body as empty', async () => {
    const cartDoc = { items: [] };
    const populate = jest.fn().mockResolvedValue(cartDoc);
    Cart.findOneAndUpdate.mockReturnValue({ populate });

    const req = { user: { id: 'user-1' }, body: {} };
    const res = mockRes();

    await replaceCart(req, res);

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'user-1' },
      { items: [] },
      expect.any(Object)
    );
  });
});
