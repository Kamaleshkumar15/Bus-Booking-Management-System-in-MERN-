const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  downloadTicketPDF,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', authorize('user', 'admin'), createBooking);
router.get('/my-bookings', authorize('user', 'admin'), getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id', authorize('user', 'admin'), updateBooking);
router.delete('/:id', authorize('user', 'admin'), cancelBooking);
router.get('/:id/ticket', authorize('user', 'admin'), downloadTicketPDF);

module.exports = router;
