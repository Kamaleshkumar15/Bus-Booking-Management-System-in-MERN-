const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_jwt_secret_change_in_prod', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = { generateToken };
