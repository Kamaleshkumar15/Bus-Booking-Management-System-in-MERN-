const db = require('../config/jsonDb');
const { emitSeatUpdate } = require('../services/socketService');
const { generateTicketPDF } = require('../services/pdfService');

const generateBookingCode = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BUS${new Date().getFullYear()}${rand}`;
};

const populateBooking = (booking) => {
  if (!booking) return null;
  const trip = db.findById('trips', booking.tripId);
  const bus = trip ? db.findById('buses', trip.busId) : null;
  const route = trip ? db.findById('routes', trip.routeId) : null;
  const driver = trip ? db.findById('drivers', trip.driverId) : null;
  const passengers = db.findAll('passengers', (p) => String(p.bookingId) === String(booking._id));
  const payment = booking.paymentId ? db.findById('payments', booking.paymentId) : null;

  return {
    ...booking,
    tripId: trip
      ? {
          ...trip,
          busId: bus || null,
          routeId: route || null,
          driverId: driver ? { _id: driver._id, name: driver.name, phone: driver.phone } : null,
        }
      : null,
    passengers,
    paymentId: payment || null,
  };
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { tripId, seatIds, passengers, boardingPoint, droppingPoint, couponCode } = req.body;

    if (
      !tripId ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0 ||
      !Array.isArray(passengers) ||
      passengers.length !== seatIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, seat IDs, and matching passenger details for each seat are required',
      });
    }

    const trip = db.findById('trips', tripId);
    if (!trip || trip.status === 'Cancelled' || trip.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Trip is not available for booking' });
    }

    const idSet = new Set(seatIds.map(String));
    const userId = String(req.user._id);
    const seats = db.findAll(
      'seats',
      (s) =>
        String(s.tripId) === String(tripId) &&
        idSet.has(String(s._id)) &&
        (s.status === 'available' || (s.status === 'locked' && String(s.lockedBy) === userId))
    );

    if (seats.length !== seatIds.length) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats are already booked or locked by another user.',
      });
    }

    const baseAmount = seats.reduce((sum, s) => sum + s.price, 0);
    const taxAmount = Math.round(baseAmount * 0.05);
    const convenienceFee = 30;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = db.findOne(
        'coupons',
        (c) => c.isActive && c.code === String(couponCode).toUpperCase().trim()
      );
      if (coupon && baseAmount >= (coupon.minOrder || 0)) {
        if (coupon.discountPercent > 0) {
          discountAmount = Math.min(coupon.maxDiscount || 200, Math.round((baseAmount * coupon.discountPercent) / 100));
        } else if (coupon.discountFlat > 0) {
          discountAmount = coupon.discountFlat;
        }
      }
    }

    const totalAmount = Math.max(0, baseAmount + taxAmount + convenienceFee - discountAmount);
    const code = generateBookingCode();

    const booking = db.insertOne('bookings', {
      bookingCode: code,
      pnr: code,
      userId: req.user._id,
      tripId,
      seats: seats.map((s) => s._id),
      seatNumbers: seats.map((s) => s.seatNumber),
      passengers: [],
      boardingPoint: boardingPoint || trip.boardingPoints?.[0] || { name: 'Main Terminal', time: trip.departureTime },
      droppingPoint: droppingPoint || trip.droppingPoints?.[0] || { name: 'Central Stand', time: trip.arrivalTime },
      baseAmount,
      taxAmount,
      convenienceFee,
      discountAmount,
      couponCode: couponCode ? String(couponCode).toUpperCase().trim() : '',
      totalAmount,
      bookingStatus: 'Pending',
      paymentStatus: 'Pending',
      boarded: false,
      paymentId: null,
      cancellationReason: '',
      cancelledAt: null,
    });

    const passengerDocs = db.insertMany(
      'passengers',
      passengers.map((p) => ({
        bookingId: booking._id,
        tripId,
        seatNumber: p.seatNumber,
        fullName: p.fullName,
        age: Number(p.age),
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        boarded: false,
      }))
    );

    const updatedBooking = db.updateById('bookings', booking._id, {
      passengers: passengerDocs.map((p) => p._id),
    });

    db.updateMany('seats', (s) => idSet.has(String(s._id)), {
      status: 'locked',
      lockedBy: req.user._id,
      lockExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      bookingId: booking._id,
    });

    res.status(201).json({ success: true, booking: populateBooking(updatedBooking) });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/my-bookings
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = db
      .findAll('bookings', (b) => String(b.userId) === String(req.user._id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(populateBooking);

    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = db.findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const populated = populateBooking(booking);
    const isOwner = String(booking.userId) === String(req.user._id);
    const isAdmin = req.userRole === 'admin';
    const isAssignedDriver =
      req.userRole === 'driver' &&
      populated.tripId?.driverId &&
      String(populated.tripId.driverId._id) === String(req.user._id);

    if (!isOwner && !isAdmin && !isAssignedDriver) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id
const updateBooking = async (req, res, next) => {
  try {
    const booking = db.findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (String(booking.userId) !== String(req.user._id) && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update a cancelled booking' });
    }

    const updates = {};
    if (req.body.boardingPoint) updates.boardingPoint = req.body.boardingPoint;
    if (req.body.droppingPoint) updates.droppingPoint = req.body.droppingPoint;

    if (req.body.couponCode) {
      const coupon = db.findOne(
        'coupons',
        (c) => c.isActive && c.code === String(req.body.couponCode).toUpperCase().trim()
      );
      if (coupon && booking.baseAmount >= (coupon.minOrder || 0)) {
        const disc =
          coupon.discountPercent > 0
            ? Math.min(coupon.maxDiscount || 200, Math.round((booking.baseAmount * coupon.discountPercent) / 100))
            : coupon.discountFlat || 0;
        updates.discountAmount = disc;
        updates.couponCode = coupon.code;
        updates.totalAmount = Math.max(0, booking.baseAmount + booking.taxAmount + booking.convenienceFee - disc);
      }
    }

    const updated = db.updateById('bookings', booking._id, updates);
    res.json({ success: true, booking: populateBooking(updated) });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookings/:id
const cancelBooking = async (req, res, next) => {
  try {
    const booking = db.findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (String(booking.userId) !== String(req.user._id) && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }
    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const trip = db.findById('trips', booking.tripId);
    if (trip && ['In Progress', 'Completed'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a trip that is already in progress or completed' });
    }

    const wasConfirmed = booking.bookingStatus === 'Confirmed';
    const updates = {
      bookingStatus: 'Cancelled',
      cancellationReason: req.body?.reason || 'Cancelled by passenger',
      cancelledAt: new Date().toISOString(),
    };

    if (booking.paymentStatus === 'Paid' && booking.paymentId) {
      updates.paymentStatus = 'Refunded';
      db.updateById('payments', booking.paymentId, {
        status: 'Refunded',
        refundId: `REF-${Date.now()}`,
        refundAmount: booking.totalAmount,
        refundedAt: new Date().toISOString(),
      });
      db.insertOne('refunds', {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
        amount: booking.totalAmount,
        reason: updates.cancellationReason,
        status: 'REQUESTED',
      });
    }

    const updatedBooking = db.updateById('bookings', booking._id, updates);

    const seatIdSet = new Set((booking.seats || []).map(String));
    db.updateMany('seats', (s) => seatIdSet.has(String(s._id)), {
      status: 'available',
      lockedBy: null,
      lockExpiresAt: null,
      bookingId: null,
    });

    if (trip && wasConfirmed) {
      db.updateById('trips', trip._id, {
        availableSeats: Math.min(trip.totalSeats, trip.availableSeats + booking.seats.length),
      });
    }

    const updatedSeats = db.findAll('seats', (s) => String(s.tripId) === String(booking.tripId));
    emitSeatUpdate(String(booking.tripId), updatedSeats);

    db.insertOne('notifications', {
      recipientId: booking.userId,
      recipientModel: 'User',
      title: 'Booking Cancelled',
      message: `Booking ${booking.bookingCode} has been cancelled. ${
        updates.paymentStatus === 'Refunded' ? 'Demo refund request created.' : ''
      }`,
      type: 'cancellation',
      isRead: false,
      relatedBookingId: booking._id,
    });

    res.json({ success: true, message: 'Booking cancelled and seats released', booking: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id/ticket
const downloadTicketPDF = async (req, res, next) => {
  try {
    const booking = db.findById('bookings', req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (String(booking.userId) !== String(req.user._id) && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    generateTicketPDF(populateBooking(booking), res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  downloadTicketPDF,
};
