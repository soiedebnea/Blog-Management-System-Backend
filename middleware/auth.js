const jwt = require('jsonwebtoken');
const User = require('../models/User');

const load = async (req) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    return await User.findById(id);
  } catch { return null; }
};

exports.auth = async (req, res, next) => {
  req.user = await load(req);
  if (!req.user) return res.status(401).json({ message: 'Please log in' });
  next();
};
exports.optionalAuth = async (req, res, next) => { req.user = await load(req); next(); };
exports.admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });