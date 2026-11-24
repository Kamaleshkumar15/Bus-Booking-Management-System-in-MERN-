const db = require('../config/jsonDb');

const getProfile = async (req, res, next) => {
  try {
    const user = db.findById('users', req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: db.sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, gender, dateOfBirth, address, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (gender !== undefined) updates.gender = gender;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
    if (address !== undefined) updates.address = address;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = db.updateById('users', req.user._id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: db.sanitizeUser(updated),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const updated = db.updateById('users', req.user._id, { isActive: false });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = db
      .findAll('notifications', (n) => String(n.recipientId) === String(req.user._id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, getNotifications };
