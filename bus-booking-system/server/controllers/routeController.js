const db = require('../config/jsonDb');

const getRoutes = async (req, res, next) => {
  try {
    const routes = db
      .findAll('routes')
      .sort((a, b) => a.source.localeCompare(b.source));
    res.json({ success: true, count: routes.length, routes });
  } catch (error) {
    next(error);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = db.findById('routes', req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

const createRoute = async (req, res, next) => {
  try {
    const route = db.insertOne('routes', {
      ...req.body,
      routeName: req.body.routeName || `${req.body.source} to ${req.body.destination}`,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      stops: req.body.stops || [],
    });
    res.status(201).json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = db.updateById('routes', req.params.id, req.body);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    const route = db.deleteById('routes', req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
