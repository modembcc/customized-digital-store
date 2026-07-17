const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const {
  getProducts,
  getProductById,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', asyncHandler(getProducts));
router.get('/:id', asyncHandler(getProductById));

module.exports = router;
