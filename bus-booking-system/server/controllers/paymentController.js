const crypto = require('crypto');
const db = require('../config/jsonDb');
const { emitSeatUpdate } = require('../services/socketService');

const SIMULATED_HMAC_SECRET = process.env.JWT_SECRET || 'simulated_gateway_secret';
const MERCHANT_VPA = process.env.MERCHANT_UPI_ID || 'redbusclone@okaxis';

// POST /api/payments/create-order
const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod = 'UPI', upiId = '', upiChannel = '' } = req.body;
    const booking = db.findById('bookings', bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (String(booking.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    if (paymentMethod === 'UPI') {
      const upiRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiId || !upiRegex.test(upiId.trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a valid UPI ID (e.g. name@okicici)' });
      }
    }

    const mode = process.env.PAYMENT_MODE === 'razorpay_test' && process.env.RAZORPAY_KEY_ID ? 'razorpay_test' : 'simulated';
    const orderId = `order_${mode}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payment = db.insertOne('payments', {
      bookingId: booking._id,
      userId: req.user._id,
      amount: booking.totalAmount,
      currency: 'INR',
      paymentMethod,
      upiId: upiId.trim(),
      upiChannel,
      gateway: mode,
      gatewayOrderId: orderId,
      gatewayPaymentId: '',
      gatewaySignature: '',
      transactionId: '',
      status: 'Pending',
    });

    const simulatedAuthToken = crypto
      .createHmac('sha256', SIMULATED_HMAC_SECRET)
      .update(`${orderId}|${booking.totalAmount}`)
      .digest('hex');

    const upiIntentUri = `upi://pay?pa=${encodeURIComponent(MERCHANT_VPA)}&pn=${encodeURIComponent(
      'RedBus Clone'
    )}&am=${booking.totalAmount}&cu=INR&tr=${encodeURIComponent(orderId)}&tn=${encodeURIComponent(
      `Ticket ${booking.bookingCode}`
    )}`;

    res.status(201).json({
      success: true,
      gateway: mode,
      order: {
        id: orderId,
        amount: booking.totalAmount * 100,
        displayAmount: booking.totalAmount,
        currency: 'INR',
        paymentId: payment._id,
        merchantVpa: MERCHANT_VPA,
        upiIntentUri,
        simulatedAuthToken: mode === 'simulated' ? simulatedAuthToken : undefined,
        razorpayKeyId: mode === 'razorpay_test' ? process.env.RAZORPAY_KEY_ID : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      simulateOutcome = 'success',
      upiId,
      upiChannel,
    } = req.body;

    const payment = db.findOne(
      'payments',
      (p) => String(p.bookingId) === String(bookingId) && p.gatewayOrderId === gatewayOrderId
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    const booking = db.findById('bookings', bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (payment.gateway === 'razorpay_test') {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${gatewayOrderId}|${gatewayPaymentId}`)
        .digest('hex');

      if (expectedSig !== gatewaySignature) {
        db.updateById('payments', payment._id, { status: 'Failed' });
        return res.status(400).json({ success: false, message: 'Razorpay signature verification failed' });
      }
    } else {
      const expectedToken = crypto
        .createHmac('sha256', SIMULATED_HMAC_SECRET)
        .update(`${gatewayOrderId}|${payment.amount}`)
        .digest('hex');

      if (gatewaySignature !== expectedToken || simulateOutcome === 'failure') {
        db.updateById('payments', payment._id, { status: 'Failed' });
        db.updateById('bookings', booking._id, { paymentStatus: 'Failed' });
        return res.status(400).json({ success: false, message: 'Payment failed or signature invalid' });
      }
    }

    const updatedPayment = db.updateById('payments', payment._id, {
      upiId: upiId || payment.upiId,
      upiChannel: upiChannel || payment.upiChannel,
      status: 'Success',
      gatewayPaymentId: gatewayPaymentId || `pay_sim_${Date.now()}`,
      gatewaySignature,
      transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    const updatedBooking = db.updateById('bookings', booking._id, {
      bookingStatus: 'Confirmed',
      paymentStatus: 'Paid',
      paymentId: payment._id,
    });

    const seatIdSet = new Set((booking.seats || []).map(String));
    db.updateMany('seats', (s) => seatIdSet.has(String(s._id)), {
      status: 'booked',
      lockedBy: null,
      lockExpiresAt: null,
      bookingId: booking._id,
    });

    const trip = db.findById('trips', booking.tripId);
    if (trip) {
      const bookedCount = db.count('seats', (s) => String(s.tripId) === String(trip._id) && s.status === 'booked');
      db.updateById('trips', trip._id, {
        availableSeats: Math.max(0, trip.totalSeats - bookedCount),
      });
    }

    const updatedSeats = db.findAll('seats', (s) => String(s.tripId) === String(booking.tripId));
    emitSeatUpdate(String(booking.tripId), updatedSeats);

    db.insertOne('notifications', {
      recipientId: booking.userId,
      recipientModel: 'User',
      title: 'Payment & Booking Confirmed',
      message: `Booking ${booking.bookingCode} confirmed via ${updatedPayment.paymentMethod}. Transaction ID: ${updatedPayment.transactionId}`,
      type: 'payment',
      isRead: false,
      relatedBookingId: booking._id,
    });

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      payment: updatedPayment,
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/history
const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = db
      .findAll('payments', (p) => String(p.userId) === String(req.user._id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((p) => {
        const booking = db.findById('bookings', p.bookingId);
        return {
          ...p,
          bookingId: booking
            ? {
                _id: booking._id,
                bookingCode: booking.bookingCode,
                seatNumbers: booking.seatNumbers,
                bookingStatus: booking.bookingStatus,
                totalAmount: booking.totalAmount,
              }
            : null,
        };
      });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
