const express = require('express');
const {
  getAnalytics,
  getAllUsers,
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getAllBookings,
  getAllPayments,
  getRefunds,
  updateRefundStatus,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/drivers', getAllDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/refunds', getRefunds);
router.put('/refunds/:id', updateRefundStatus);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
