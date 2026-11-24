const express = require('express');
const {
  getDriverDashboard,
  getDriverTrips,
  getTripPassengers,
  verifyBoarding,
  updateTripStatus,
  downloadManifestPDF,
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('driver'));
router.get('/dashboard', getDriverDashboard);
router.get('/trips', getDriverTrips);
router.get('/trips/:id/passengers', getTripPassengers);
router.put('/trips/:id/verify-boarding', verifyBoarding);
router.put('/trips/:id/status', updateTripStatus);
router.get('/trips/:id/manifest', downloadManifestPDF);

module.exports = router;
