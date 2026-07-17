const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAdmin = require('../middleware/requireAdmin');
const {
  getAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.use(requireAdmin);

router.get('/', asyncHandler(getAllProductsForAdmin));
router.post('/', asyncHandler(createProduct));
router.put('/:id', asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));

module.exports = router;
