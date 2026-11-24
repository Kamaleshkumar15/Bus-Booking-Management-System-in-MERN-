const express = require('express');
const db = require('../config/jsonDb');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Coupon validation for checkout
router.get('/coupons/validate', (req, res) => {
  const code = String(req.query.code || '').toUpperCase().trim();
  const amount = Number(req.query.amount || 0);
  const coupon = db.findOne('coupons', (c) => c.isActive && c.code === code);
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  }
  if (amount < (coupon.minOrder || 0)) {
    return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrder} required` });
  }
  const discount =
    coupon.discountPercent > 0
      ? Math.min(coupon.maxDiscount || 200, Math.round((amount * coupon.discountPercent) / 100))
      : coupon.discountFlat || 0;
  res.json({ success: true, coupon, discount });
});

// Public Contact / Support ticket submission
router.post('/support', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
  }
  const ticket = db.insertOne('support_tickets', {
    name,
    email,
    subject: subject || 'General Inquiry',
    message,
    status: 'OPEN',
  });
  res.status(201).json({ success: true, message: 'Support request submitted', ticket });
});

router.get('/support', protect, authorize('admin'), (req, res) => {
  const tickets = db.findAll('support_tickets').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, tickets });
});

// Reviews for buses
router.get('/reviews/:busId', (req, res) => {
  const reviews = db.findAll('reviews', (r) => String(r.busId) === String(req.params.busId));
  res.json({ success: true, reviews });
});

router.post('/reviews', protect, authorize('user', 'admin'), (req, res) => {
  const { busId, rating, comment } = req.body;
  if (!busId || !rating) {
    return res.status(400).json({ success: false, message: 'Bus ID and rating are required' });
  }
  const review = db.insertOne('reviews', {
    busId,
    userId: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    comment: comment || '',
  });
  res.status(201).json({ success: true, review });
});

module.exports = router;
