const db = require('../config/jsonDb');

const populateBus = (bus) => {
  if (!bus) return null;
  const driver = bus.driverId ? db.findById('drivers', bus.driverId) : null;
  return {
    ...bus,
    driverId: driver ? { _id: driver._id, name: driver.name, phone: driver.phone, licenseNumber: driver.licenseNumber } : null,
  };
};

const getBuses = async (req, res, next) => {
  try {
    const buses = db
      .findAll('buses')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(populateBus);
    res.json({ success: true, count: buses.length, buses });
  } catch (error) {
    next(error);
  }
};

const getBusById = async (req, res, next) => {
  try {
    const bus = db.findById('buses', req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    res.json({ success: true, bus: populateBus(bus) });
  } catch (error) {
    next(error);
  }
};

const createBus = async (req, res, next) => {
  try {
    const existing = db.findOne('buses', (b) => b.busNumber === String(req.body.busNumber).toUpperCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bus number already exists' });
    }
    const bus = db.insertOne('buses', {
      ...req.body,
      busNumber: String(req.body.busNumber).toUpperCase(),
      rating: req.body.rating || 4.3,
      totalReviews: req.body.totalReviews || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });
    if (bus.driverId) {
      const driver = db.findById('drivers', bus.driverId);
      if (driver) {
        const assigned = Array.from(new Set([...(driver.assignedBuses || []), bus._id]));
        db.updateById('drivers', driver._id, { assignedBuses: assigned });
      }
    }
    res.status(201).json({ success: true, bus });
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const bus = db.findById('buses', req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    let updates = {};
    if (req.userRole === 'driver') {
      if (String(bus.driverId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this bus' });
      }
      if (req.body.amenities !== undefined) updates.amenities = req.body.amenities;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    } else {
      updates = { ...req.body };
    }

    const updated = db.updateById('buses', bus._id, updates);
    res.json({ success: true, bus: updated });
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    const bus = db.deleteById('buses', req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }
    if (bus.driverId) {
      const driver = db.findById('drivers', bus.driverId);
      if (driver) {
        db.updateById('drivers', driver._id, {
          assignedBuses: (driver.assignedBuses || []).filter((id) => String(id) !== String(bus._id)),
        });
      }
    }
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus };
