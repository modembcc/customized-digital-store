const Product = require('../models/Product');

// GET /api/products
// Public storefront listing — only active products.
async function getProducts(req, res) {
  const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
  res.status(200).json(products);
}

// GET /api/products/:id
async function getProductById(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.status(200).json(product);
}

// GET /api/admin/products
// Admin listing — includes inactive products.
async function getAllProductsForAdmin(req, res) {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.status(200).json(products);
}

// POST /api/admin/products
async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}

// PUT /api/admin/products/:id
async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.status(200).json(product);
}

// DELETE /api/admin/products/:id
async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.status(200).json({ message: 'Product deleted' });
}

// POST /api/admin/products/upload
async function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a valid image file (jpeg, png, webp, or gif)' });
  }
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
}

module.exports = {
  getProducts,
  getProductById,
  getAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
