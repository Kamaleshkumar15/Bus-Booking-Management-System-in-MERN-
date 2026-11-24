const jwt = require('jsonwebtoken');
const db = require('../config/jsonDb');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod');

    if (decoded.role === 'driver') {
      const driver = db.findById('drivers', decoded.id);
      if (!driver) {
        return res.status(401).json({ success: false, message: 'Driver account not found' });
      }
      req.user = db.sanitizeUser(driver);
      req.userRole = 'driver';
    } else {
      const user = db.findById('users', decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'User account not found or deactivated' });
      }
      req.user = db.sanitizeUser(user);
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.userRole || 'guest'}' is not authorized.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
