const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const verifyCaptcha = require('../middleware/verifyCaptcha');
const { signup, login, logout, me } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', verifyCaptcha, asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

module.exports = router;
