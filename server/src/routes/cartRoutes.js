const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const { getCart, replaceCart } = require('../controllers/cartController');

const router = express.Router();

router.get('/', requireAuth, asyncHandler(getCart));
router.put('/', requireAuth, asyncHandler(replaceCart));

module.exports = router;
