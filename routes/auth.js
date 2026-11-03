const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// The first registered user becomes admin
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already in use' });
    const role = (await User.countDocuments()) === 0 ? 'admin' : 'author';
    const user = await User.create({ name, email, password, role });
    res.status(201).json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matches(req.body.password || '')))
      return res.status(401).json({ message: 'Wrong email or password' });
    res.json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

router.get('/me', auth, (req, res) => res.json(pub(req.user)));

module.exports = router;