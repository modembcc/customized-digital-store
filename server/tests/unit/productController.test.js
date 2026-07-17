jest.mock('../../src/models/Product');

const Product = require('../../src/models/Product');
const {
  getProducts,
  getProductById,
  getAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../../src/controllers/productController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProducts', () => {
  it('returns only active products as 200', async () => {
    const products = [{ name: 'A' }, { name: 'B' }];
    const sort = jest.fn().mockResolvedValue(products);
    Product.find.mockReturnValue({ sort });

    const req = {};
    const res = mockRes();

    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({ isActive: true });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products);
  });
});

describe('getProductById', () => {
  it('returns the product as 200 when found', async () => {
    const product = { _id: '1', name: 'A' };
    Product.findById.mockResolvedValue(product);

    const req = { params: { id: '1' } };
    const res = mockRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(product);
  });

  it('returns 404 when the product does not exist', async () => {
    Product.findById.mockResolvedValue(null);

    const req = { params: { id: 'missing' } };
    const res = mockRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
  });
});

describe('getAllProductsForAdmin', () => {
  it('returns all products, active or not, as 200', async () => {
    const products = [{ name: 'A', isActive: false }];
    const sort = jest.fn().mockResolvedValue(products);
    Product.find.mockReturnValue({ sort });

    const req = {};
    const res = mockRes();

    await getAllProductsForAdmin(req, res);

    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products);
  });
});

describe('createProduct', () => {
  it('creates a product and returns 201', async () => {
    const body = { name: 'New Product' };
    const created = { _id: '1', ...body };
    Product.create.mockResolvedValue(created);

    const req = { body };
    const res = mockRes();

    await createProduct(req, res);

    expect(Product.create).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });
});

describe('updateProduct', () => {
  it('updates the product and returns 200 when found', async () => {
    const updated = { _id: '1', name: 'Updated' };
    Product.findByIdAndUpdate.mockResolvedValue(updated);

    const req = { params: { id: '1' }, body: { name: 'Updated' } };
    const res = mockRes();

    await updateProduct(req, res);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Updated' }, {
      new: true,
      runValidators: true,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when the product does not exist', async () => {
    Product.findByIdAndUpdate.mockResolvedValue(null);

    const req = { params: { id: 'missing' }, body: {} };
    const res = mockRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
  });
});

describe('deleteProduct', () => {
  it('deletes the product and returns 200 when found', async () => {
    Product.findByIdAndDelete.mockResolvedValue({ _id: '1' });

    const req = { params: { id: '1' } };
    const res = mockRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted' });
  });

  it('returns 404 when the product does not exist', async () => {
    Product.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: 'missing' } };
    const res = mockRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
  });
});
