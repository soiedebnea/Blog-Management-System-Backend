const mongoose = require('mongoose');
module.exports = mongoose.model('Comment', new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true }));