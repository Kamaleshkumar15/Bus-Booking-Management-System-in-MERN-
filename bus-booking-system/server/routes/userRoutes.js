const express = require('express');
const { getProfile, updateProfile, deleteAccount, getNotifications } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('user', 'admin'));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);
router.get('/notifications', getNotifications);

module.exports = router;
