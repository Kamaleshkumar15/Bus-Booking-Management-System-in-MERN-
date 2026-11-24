const express = require('express');
const { searchTrips, getTripById, createTrip, updateTrip, deleteTrip } = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', searchTrips);
router.get('/:id', getTripById);
router.post('/', protect, authorize('admin'), createTrip);
router.put('/:id', protect, authorize('admin'), updateTrip);
router.delete('/:id', protect, authorize('admin'), deleteTrip);

module.exports = router;
