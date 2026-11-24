const db = require('../config/jsonDb');
const { emitSeatUpdate } = require('../services/socketService');

const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const sortSeats = (seats) => {
  return seats.sort((a, b) => {
    if (a.deck !== b.deck) return a.deck.localeCompare(b.deck);
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
};

const releaseExpiredLocks = (tripId) => {
  const now = Date.now();
  db.updateMany(
    'seats',
    (s) =>
      String(s.tripId) === String(tripId) &&
      s.status === 'locked' &&
      s.lockExpiresAt &&
      new Date(s.lockExpiresAt).getTime() <= now,
    { status: 'available', lockedBy: null, lockExpiresAt: null }
  );
};

// GET /api/seats/:tripId
const getSeatsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    releaseExpiredLocks(tripId);
    const seats = sortSeats(db.findAll('seats', (s) => String(s.tripId) === String(tripId)));
    res.json({ success: true, count: seats.length, seats });
  } catch (error) {
    next(error);
  }
};

// POST /api/seats/lock
const lockSeats = async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    if (!tripId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ success: false, message: 'tripId and seatIds array are required' });
    }

    releaseExpiredLocks(tripId);

    const idSet = new Set(seatIds.map(String));
    const userId = String(req.user._id);
    const targetSeats = db.findAll('seats', (s) => String(s.tripId) === String(tripId) && idSet.has(String(s._id)));

    const allLockable =
      targetSeats.length === seatIds.length &&
      targetSeats.every(
        (s) => s.status === 'available' || (s.status === 'locked' && String(s.lockedBy) === userId)
      );

    if (!allLockable) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats are no longer available. Please choose different seats.',
      });
    }

    const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
    db.updateMany(
      'seats',
      (s) => String(s.tripId) === String(tripId) && idSet.has(String(s._id)),
      { status: 'locked', lockedBy: req.user._id, lockExpiresAt }
    );

    const updatedSeats = sortSeats(db.findAll('seats', (s) => String(s.tripId) === String(tripId)));
    emitSeatUpdate(tripId, updatedSeats);

    res.json({
      success: true,
      message: 'Seats locked for 10 minutes',
      lockExpiresAt,
      seats: updatedSeats,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/seats/release
const releaseSeats = async (req, res, next) => {
  try {
    const { tripId, seatIds } = req.body;
    if (!tripId) {
      return res.status(400).json({ success: false, message: 'tripId is required' });
    }

    const idSet = Array.isArray(seatIds) && seatIds.length > 0 ? new Set(seatIds.map(String)) : null;
    const userId = String(req.user._id);

    db.updateMany(
      'seats',
      (s) =>
        String(s.tripId) === String(tripId) &&
        s.status === 'locked' &&
        String(s.lockedBy) === userId &&
        (!idSet || idSet.has(String(s._id))),
      { status: 'available', lockedBy: null, lockExpiresAt: null }
    );

    const updatedSeats = sortSeats(db.findAll('seats', (s) => String(s.tripId) === String(tripId)));
    emitSeatUpdate(tripId, updatedSeats);

    res.json({ success: true, message: 'Seat locks released', seats: updatedSeats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSeatsByTrip, lockSeats, releaseSeats, releaseExpiredLocks };
