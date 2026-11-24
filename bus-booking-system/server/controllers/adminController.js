const bcrypt = require('bcryptjs');
const db = require('../config/jsonDb');

const getAnalytics = async (req, res, next) => {
  try {
    const totalRevenue = db
      .findAll('payments', (p) => p.status === 'Success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      analytics: {
        totalUsers: db.count('users', (u) => u.role === 'user'),
        totalDrivers: db.count('drivers'),
        totalBuses: db.count('buses'),
        totalRoutes: db.count('routes'),
        totalTrips: db.count('trips'),
        totalBookings: db.count('bookings'),
        totalRefunds: db.count('refunds'),
        totalCoupons: db.count('coupons'),
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = db.findAll('users').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(db.sanitizeUser);
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = db.findAll('drivers').map((d) => {
      const sanitized = db.sanitizeUser(d);
      const buses = (d.assignedBuses || [])
        .map((id) => db.findById('buses', id))
        .filter(Boolean)
        .map((b) => ({ _id: b._id, busName: b.busName, busNumber: b.busNumber }));
      return { ...sanitized, assignedBuses: buses };
    });
    res.json({ success: true, drivers });
  } catch (error) {
    next(error);
  }
};

const createDriver = async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(req.body.password || 'Driver@123', salt);
    const driver = db.insertOne('drivers', {
      ...req.body,
      email: String(req.body.email).toLowerCase(),
      password: passwordHash,
      assignedBuses: req.body.assignedBuses || [],
      role: 'driver',
    });
    res.status(201).json({ success: true, driver: db.sanitizeUser(driver) });
  } catch (error) {
    next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = db.updateById('drivers', req.params.id, req.body);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, driver: db.sanitizeUser(driver) });
  } catch (error) {
    next(error);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const driver = db.deleteById('drivers', req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = db
      .findAll('bookings')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((b) => {
        const user = db.findById('users', b.userId);
        const trip = db.findById('trips', b.tripId);
        return {
          ...b,
          userId: user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null,
          tripId: trip
            ? { ...trip, busId: db.findById('buses', trip.busId), routeId: db.findById('routes', trip.routeId) }
            : null,
        };
      });
    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const payments = db
      .findAll('payments')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((p) => {
        const user = db.findById('users', p.userId);
        const booking = db.findById('bookings', p.bookingId);
        return {
          ...p,
          userId: user ? { _id: user._id, name: user.name, email: user.email } : null,
          bookingId: booking ? { _id: booking._id, bookingCode: booking.bookingCode, totalAmount: booking.totalAmount } : null,
        };
      });
    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

const getRefunds = async (req, res, next) => {
  try {
    const refunds = db.findAll('refunds').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, refunds });
  } catch (error) {
    next(error);
  }
};

const updateRefundStatus = async (req, res, next) => {
  try {
    const refund = db.updateById('refunds', req.params.id, { status: req.body.status || 'Approved' });
    if (!refund) return res.status(404).json({ success: false, message: 'Refund not found' });
    res.json({ success: true, refund });
  } catch (error) {
    next(error);
  }
};

const getCoupons = async (req, res, next) => {
  try {
    res.json({ success: true, coupons: db.findAll('coupons') });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = db.insertOne('coupons', {
      code: String(req.body.code).toUpperCase().trim(),
      discountPercent: Number(req.body.discountPercent || 0),
      discountFlat: Number(req.body.discountFlat || 0),
      maxDiscount: Number(req.body.maxDiscount || 200),
      minOrder: Number(req.body.minOrder || 0),
      isActive: true,
    });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    db.deleteById('coupons', req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = db.findAll('audit_logs').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
