const express = require('express');
const { getBuses, getBusById, createBus, updateBus, deleteBus } = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getBuses);
router.get('/:id', getBusById);
router.post('/', protect, authorize('admin'), createBus);
router.put('/:id', protect, authorize('admin', 'driver'), updateBus);
router.delete('/:id', protect, authorize('admin'), deleteBus);

module.exports = router;
