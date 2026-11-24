const db = require('../config/jsonDb');
const { generateSeatsForTrip } = require('../utils/seatGenerator');

const populateTrip = (trip) => {
  if (!trip) return null;
  const bus = db.findById('buses', trip.busId);
  const route = db.findById('routes', trip.routeId);
  const driver = db.findById('drivers', trip.driverId);
  return {
    ...trip,
    busId: bus || null,
    routeId: route || null,
    driverId: driver ? { _id: driver._id, name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber } : null,
  };
};

const searchTrips = async (req, res, next) => {
  try {
    const {
      source,
      destination,
      journeyDate,
      passengers = 1,
      busType,
      minPrice,
      maxPrice,
      departureWindow,
      all,
    } = req.query;

    if (all === 'true') {
      const allTrips = db
        .findAll('trips')
        .map(populateTrip)
        .sort((a, b) => new Date(a.journeyDate) - new Date(b.journeyDate));
      return res.json({ success: true, count: allTrips.length, trips: allTrips });
    }

    const matchingRoutes = db.findAll('routes', (r) => {
      if (!r.isActive) return false;
      if (source && !new RegExp(source.trim(), 'i').test(r.source)) return false;
      if (destination && !new RegExp(destination.trim(), 'i').test(r.destination)) return false;
      return true;
    });

    const routeIdSet = new Set(matchingRoutes.map((r) => String(r._id)));
    if ((source || destination) && routeIdSet.size === 0) {
      return res.json({ success: true, count: 0, trips: [] });
    }

    const minSeats = Number(passengers) || 1;
    let trips = db
      .findAll('trips', (t) => {
        if (!['Scheduled', 'Boarding'].includes(t.status)) return false;
        if (t.availableSeats < minSeats) return false;
        if (routeIdSet.size > 0 && !routeIdSet.has(String(t.routeId))) return false;
        if (journeyDate) {
          const targetDate = new Date(journeyDate).toISOString().split('T')[0];
          const tripDate = new Date(t.journeyDate).toISOString().split('T')[0];
          if (targetDate !== tripDate) return false;
        }
        if (minPrice && t.basePrice < Number(minPrice)) return false;
        if (maxPrice && t.basePrice > Number(maxPrice)) return false;
        return true;
      })
      .map(populateTrip)
      .sort((a, b) => a.basePrice - b.basePrice);

    if (busType) {
      const types = busType.split(',').map((t) => t.trim().toLowerCase());
      trips = trips.filter((t) => t.busId && types.includes(t.busId.busType.toLowerCase()));
    }

    if (departureWindow) {
      trips = trips.filter((t) => {
        const hourMatch = t.departureTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!hourMatch) return true;
        let hour = parseInt(hourMatch[1], 10);
        const meridiem = hourMatch[3]?.toUpperCase();
        if (meridiem === 'PM' && hour !== 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        if (departureWindow === 'morning') return hour >= 6 && hour < 12;
        if (departureWindow === 'afternoon') return hour >= 12 && hour < 17;
        if (departureWindow === 'evening') return hour >= 17 && hour < 21;
        if (departureWindow === 'night') return hour >= 21 || hour < 6;
        return true;
      });
    }

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = db.findById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip: populateTrip(trip) });
  } catch (error) {
    next(error);
  }
};

const createTrip = async (req, res, next) => {
  try {
    const bus = db.findById('buses', req.body.busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    const route = db.findById('routes', req.body.routeId);

    const trip = db.insertOne('trips', {
      ...req.body,
      driverId: req.body.driverId || bus.driverId,
      totalSeats: bus.totalSeats,
      availableSeats: bus.totalSeats,
      status: req.body.status || 'Scheduled',
      boardingPoints:
        req.body.boardingPoints ||
        (route?.stops || [])
          .filter((s) => s.isBoardingPoint)
          .map((s) => ({ name: s.name, time: req.body.departureTime, address: s.address })),
      droppingPoints:
        req.body.droppingPoints ||
        (route?.stops || [])
          .filter((s) => s.isDroppingPoint)
          .map((s) => ({ name: s.name, time: req.body.arrivalTime, address: s.address })),
    });

    const seatDocs = generateSeatsForTrip({
      tripId: trip._id,
      seatLayoutType: bus.seatLayoutType,
      totalSeats: bus.totalSeats,
      basePrice: Number(trip.basePrice),
      sleeperPrice: Number(trip.sleeperPrice || 0),
    });
    db.insertMany('seats', seatDocs);

    res.status(201).json({ success: true, trip: populateTrip(trip) });
  } catch (error) {
    next(error);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = db.updateById('trips', req.params.id, req.body);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip: populateTrip(trip) });
  } catch (error) {
    next(error);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    const trip = db.deleteById('trips', req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    db.deleteMany('seats', (s) => String(s.tripId) === String(trip._id));
    res.json({ success: true, message: 'Trip and associated seats deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchTrips, getTripById, createTrip, updateTrip, deleteTrip };
