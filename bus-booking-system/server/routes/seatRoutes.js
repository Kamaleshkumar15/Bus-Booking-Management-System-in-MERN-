const express = require('express');
const { getSeatsByTrip, lockSeats, releaseSeats } = require('../controllers/seatController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:tripId', getSeatsByTrip);
router.post('/lock', protect, authorize('user', 'admin'), lockSeats);
router.post('/release', protect, authorize('user', 'admin'), releaseSeats);

module.exports = router;
