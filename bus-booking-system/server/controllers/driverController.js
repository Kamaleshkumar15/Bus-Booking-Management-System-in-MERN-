const db = require('../config/jsonDb');
const { emitTripStatusUpdate } = require('../services/socketService');
const { generateManifestPDF } = require('../services/pdfService');

const populateTrip = (trip) => ({
  ...trip,
  busId: db.findById('buses', trip.busId) || null,
  routeId: db.findById('routes', trip.routeId) || null,
});

const getDriverDashboard = async (req, res, next) => {
  try {
    const driverId = String(req.user._id);
    const assignedBuses = db.findAll('buses', (b) => String(b.driverId) === driverId);

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const allTrips = db.findAll('trips', (t) => String(t.driverId) === driverId).map(populateTrip);
    const todaysTrips = allTrips.filter((t) => {
      const d = new Date(t.journeyDate);
      return d >= startOfDay && d <= endOfDay;
    });
    const upcomingTrips = allTrips.filter(
      (t) => new Date(t.journeyDate) >= startOfDay && ['Scheduled', 'Boarding'].includes(t.status)
    );

    const tripIdSet = new Set(allTrips.map((t) => String(t._id)));
    const totalPassengers = db.count('passengers', (p) => tripIdSet.has(String(p.tripId)));

    res.json({
      success: true,
      stats: {
        totalAssignedBuses: assignedBuses.length,
        todaysTripsCount: todaysTrips.length,
        totalPassengers,
        upcomingTripsCount: upcomingTrips.length,
      },
      assignedBuses,
      todaysTrips,
    });
  } catch (error) {
    next(error);
  }
};

const getDriverTrips = async (req, res, next) => {
  try {
    const trips = db
      .findAll('trips', (t) => String(t.driverId) === String(req.user._id))
      .sort((a, b) => new Date(a.journeyDate) - new Date(b.journeyDate))
      .map(populateTrip);

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

const getTripPassengers = async (req, res, next) => {
  try {
    const trip = db.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (String(trip.driverId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this trip.' });
    }

    const bookings = db.findAll(
      'bookings',
      (b) => String(b.tripId) === String(trip._id) && ['Confirmed', 'Completed'].includes(b.bookingStatus)
    );
    const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));

    const passengers = db
      .findAll('passengers', (p) => bookingMap.has(String(p.bookingId)))
      .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
      .map((p) => {
        const b = bookingMap.get(String(p.bookingId));
        return {
          ...p,
          bookingId: b
            ? {
                _id: b._id,
                bookingCode: b.bookingCode,
                pnr: b.pnr || b.bookingCode,
                boardingPoint: b.boardingPoint,
                droppingPoint: b.droppingPoint,
                paymentStatus: b.paymentStatus,
                totalAmount: b.totalAmount,
                boarded: Boolean(b.boarded),
              }
            : null,
        };
      });

    const seats = db
      .findAll('seats', (s) => String(s.tripId) === String(trip._id))
      .sort((a, b) => (a.deck !== b.deck ? a.deck.localeCompare(b.deck) : a.row - b.row || a.col - b.col));

    res.json({
      success: true,
      trip: populateTrip(trip),
      passengers,
      seats,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/driver/trips/:id/verify-boarding (QR / PNR scan verification)
const verifyBoarding = async (req, res, next) => {
  try {
    const trip = db.findById('trips', req.params.id);
    if (!trip || String(trip.driverId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied for this trip' });
    }

    const rawCode = String(req.body.pnr || '').trim().toUpperCase();
    const pnr = rawCode.includes('|') ? rawCode.split('|')[0] : rawCode;

    const booking = db.findOne(
      'bookings',
      (b) =>
        String(b.tripId) === String(trip._id) &&
        (String(b.bookingCode).toUpperCase() === pnr || String(b.pnr || '').toUpperCase() === pnr)
    );

    if (!booking || booking.bookingStatus !== 'Confirmed') {
      return res.status(404).json({ success: false, message: 'No confirmed booking found for this PNR / QR code on this trip' });
    }

    db.updateById('bookings', booking._id, { boarded: true });
    db.updateMany('passengers', (p) => String(p.bookingId) === String(booking._id), { boarded: true });
    db.logAudit({
      actorId: req.user._id,
      actorRole: 'driver',
      action: 'VERIFY_BOARDING',
      entity: 'bookings',
      entityId: booking._id,
      details: `Verified PNR ${booking.bookingCode}`,
    });

    res.json({
      success: true,
      message: `Boarding verified for ${booking.bookingCode} (Seats: ${booking.seatNumbers.join(', ')})`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

const updateTripStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'Boarding', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid trip status' });
    }

    const trip = db.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (String(trip.driverId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this trip.' });
    }

    const updatedTrip = db.updateById('trips', trip._id, { status });

    if (status === 'Completed') {
      db.updateMany(
        'bookings',
        (b) => String(b.tripId) === String(trip._id) && b.bookingStatus === 'Confirmed',
        { bookingStatus: 'Completed' }
      );
    }

    emitTripStatusUpdate(String(trip._id), status);
    res.json({ success: true, message: `Trip status updated to ${status}`, trip: updatedTrip });
  } catch (error) {
    next(error);
  }
};

const downloadManifestPDF = async (req, res, next) => {
  try {
    const trip = db.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (String(trip.driverId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const bookings = db.findAll(
      'bookings',
      (b) => String(b.tripId) === String(trip._id) && ['Confirmed', 'Completed'].includes(b.bookingStatus)
    );
    const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));
    const passengers = db
      .findAll('passengers', (p) => bookingMap.has(String(p.bookingId)))
      .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
      .map((p) => {
        const b = bookingMap.get(String(p.bookingId));
        return { ...p, bookingId: b ? { bookingCode: b.bookingCode, paymentStatus: b.paymentStatus } : null };
      });

    generateManifestPDF(populateTrip(trip), passengers, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDriverDashboard,
  getDriverTrips,
  getTripPassengers,
  verifyBoarding,
  updateTripStatus,
  downloadManifestPDF,
};
