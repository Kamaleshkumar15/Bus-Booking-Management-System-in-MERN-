const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/jsonDb');
const { generateToken } = require('../utils/tokenUtils');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.findOne('users', (u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.insertOne('users', {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: passwordHash,
      role: 'user',
      authProvider: 'local',
      avatar: '',
      gender: '',
      address: '',
      isActive: true,
    });

    db.logAudit({ actorId: user._id, actorRole: 'user', action: 'REGISTER', entity: 'users', entityId: user._id });
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true,
      token,
      user: db.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, portal } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const normalizedEmail = email.toLowerCase().trim();

    if (portal === 'driver') {
      const driver = db.findOne('drivers', (d) => d.email === normalizedEmail);
      if (!driver || !(await bcrypt.compare(password, driver.password || ''))) {
        return res.status(401).json({ success: false, message: 'Invalid driver credentials' });
      }
      db.logAudit({ actorId: driver._id, actorRole: 'driver', action: 'LOGIN', entity: 'drivers', entityId: driver._id });
      const token = generateToken(driver._id, 'driver');
      return res.json({
        success: true,
        token,
        user: { ...db.sanitizeUser(driver), role: 'driver' },
      });
    }

    const user = db.findOne('users', (u) => u.email === normalizedEmail);
    if (!user || !user.isActive || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }

    db.logAudit({ actorId: user._id, actorRole: user.role, action: 'LOGIN', entity: 'users', entityId: user._id });
    const token = generateToken(user._id, user.role);
    res.json({
      success: true,
      token,
      user: db.sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google (Local Demo Customer Account Sign-In — Zero External APIs)
const googleLogin = async (req, res, next) => {
  try {
    const { email, name, avatar = '', googleId } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Account email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = db.findOne('users', (u) => u.email === normalizedEmail);

    if (user && user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Quick Google Demo Sign-In is restricted to customer accounts only.',
      });
    }

    if (!user) {
      user = db.insertOne('users', {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: '',
        authProvider: 'google',
        googleId: googleId || `local_google_${Date.now()}`,
        avatar,
        role: 'user',
        gender: '',
        address: '',
        isActive: true,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    const token = generateToken(user._id, 'user');
    res.json({ success: true, token, user: db.sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password (Generates local demo OTP)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const user = db.findOne('users', (u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email' });
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.updateById('users', user._id, { otpCode, otpExpiresAt });

    res.json({
      success: true,
      message: 'Demo OTP generated locally (valid for 10 minutes)',
      demoOtp: otpCode,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const user = db.findOne('users', (u) => u.email === normalizedEmail);

    if (!user || !user.otpCode || user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid demo OTP' });
    }
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Demo OTP has expired' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    db.updateById('users', user._id, { password: passwordHash, otpCode: null, otpExpiresAt: null });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  const token = generateToken(req.user._id, req.userRole);
  res.json({ success: true, token });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      ...req.user,
      role: req.userRole,
    },
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getMe,
};
