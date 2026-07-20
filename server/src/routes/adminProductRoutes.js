const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const uploadImage = require('../middleware/uploadImage');
const {
  getAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} = require('../controllers/productController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/', asyncHandler(getAllProductsForAdmin));
router.post('/', asyncHandler(createProduct));
router.post('/upload', uploadImage, asyncHandler(uploadProductImage));
router.put('/:id', asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));

module.exports = router;
