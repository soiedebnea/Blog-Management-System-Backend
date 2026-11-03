const router = require('express').Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const { auth, optionalAuth } = require('../middleware/auth');
const slugify = require('../utils/slugify');

const populate = (q) => q.populate('author', 'name').populate('category', 'name slug');

async function uniqueSlug(title, ignoreId) {
  const base = slugify(title);
  let slug = base, n = 1;
  while (await Post.findOne({ slug, _id: { $ne: ignoreId } })) slug = `${base}-${++n}`;
  return slug;
}
const canEdit = (user, post) => user.role === 'admin' || String(post.author) === String(user._id);

// Public: published posts (?category=slug &q=text &page= &limit=)
router.get('/', async (req, res, next) => {
  try {
    const { category, q, page = 1, limit = 10 } = req.query;
    const filter = { status: 'published' };
    if (category) {
      const c = await Category.findOne({ slug: category });
      filter.category = c ? c._id : null;
    }
    if (q) filter.$text = { $search: q };
    const skip = (Math.max(+page, 1) - 1) * +limit;
    const [items, total] = await Promise.all([
      populate(Post.find(filter).select('-content').sort('-publishedAt').skip(skip).limit(+limit)),
      Post.countDocuments(filter),
    ]);
    res.json({ items, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

// Dashboard: my posts (admin sees all)
router.get('/mine', auth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { author: req.user._id };
    res.json(await populate(Post.find(filter).select('-content').sort('-updatedAt')));
  } catch (e) { next(e); }
});

// Editor: fetch by id (owner/admin)
router.get('/id/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEdit(req.user, post)) return res.status(403).json({ message: 'Not allowed' });
    res.json(post);
  } catch (e) { next(e); }
});

// Public: single post by slug (drafts visible only to owner/admin)
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const post = await populate(Post.findOne({ slug: req.params.slug }));
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.status !== 'published' && !(req.user && canEdit(req.user, { author: post.author._id })))
      return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { title, content, excerpt, category, status } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });
    const post = await Post.create({
      title, content, excerpt, category: category || null, author: req.user._id,
      slug: await uniqueSlug(title),
      status: status === 'published' ? 'published' : 'draft',
      publishedAt: status === 'published' ? new Date() : undefined,
    });
    res.status(201).json(post);
  } catch (e) { next(e); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEdit(req.user, post)) return res.status(403).json({ message: 'Not allowed' });
    const { title, content, excerpt, category, status } = req.body;
    if (title && title !== post.title) { post.title = title; post.slug = await uniqueSlug(title, post._id); }
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (category !== undefined) post.category = category || null;
    if (status && status !== post.status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    }
    await post.save();
    res.json(post);
  } catch (e) { next(e); }
});

// Publish / unpublish toggle
router.patch('/:id/publish', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEdit(req.user, post)) return res.status(403).json({ message: 'Not allowed' });
    post.status = post.status === 'published' ? 'draft' : 'published';
    if (post.status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    await post.save();
    res.json(post);
  } catch (e) { next(e); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canEdit(req.user, post)) return res.status(403).json({ message: 'Not allowed' });
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (e) { next(e); }
});

module.exports = router;