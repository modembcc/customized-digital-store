const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const { createCheckoutSession, getCheckoutSession } = require('../controllers/checkoutController');

const router = express.Router();

router.post('/', requireAuth, asyncHandler(createCheckoutSession));
router.get('/:orderId', requireAuth, asyncHandler(getCheckoutSession));

module.exports = router;
