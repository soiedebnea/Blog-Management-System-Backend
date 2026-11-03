const router = require('express').Router();
const Category = require('../models/Category');
const Post = require('../models/Post');
const { auth, admin } = require('../middleware/auth');
const slugify = require('../utils/slugify');

router.get('/', async (req, res, next) => {
  try { res.json(await Category.find().sort('name')); } catch (e) { next(e); }
});

router.post('/', auth, admin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    res.status(201).json(await Category.create({ name, description, slug: slugify(name) }));
  } catch (e) { next(e); }
});

router.put('/:id', auth, admin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const c = await Category.findByIdAndUpdate(req.params.id, { name, description, slug: slugify(name) }, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ message: 'Category not found' });
    res.json(c);
  } catch (e) { next(e); }
});

router.delete('/:id', auth, admin, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await Post.updateMany({ category: req.params.id }, { category: null });
    res.json({ message: 'Category deleted' });
  } catch (e) { next(e); }
});

module.exports = router;