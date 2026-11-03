const router = require('express').Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { auth, optionalAuth } = require('../middleware/auth');

router.get('/posts/:postId/comments', async (req, res, next) => {
  try { res.json(await Comment.find({ post: req.params.postId }).sort('-createdAt')); } catch (e) { next(e); }
});

// Logged-in users comment under their name; guests must give a name
router.post('/posts/:postId/comments', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, status: 'published' });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const name = req.user ? req.user.name : (req.body.name || '').trim();
    if (!name || !req.body.body) return res.status(400).json({ message: 'Name and comment are required' });
    res.status(201).json(await Comment.create({ post: post._id, user: req.user?._id, name, body: req.body.body }));
  } catch (e) { next(e); }
});

// Admin or the post's author can remove a comment
router.delete('/comments/:id', auth, async (req, res, next) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Comment not found' });
    const post = await Post.findById(c.post);
    const ok = req.user.role === 'admin' || (post && String(post.author) === String(req.user._id));
    if (!ok) return res.status(403).json({ message: 'Not allowed' });
    await c.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (e) { next(e); }
});

module.exports = router;