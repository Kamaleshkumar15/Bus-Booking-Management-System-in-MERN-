const express = require('express');
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('user', 'admin'));
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
