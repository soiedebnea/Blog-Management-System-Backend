const mongoose = require('mongoose');
module.exports = mongoose.model('Category', new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
}, { timestamps: true }));