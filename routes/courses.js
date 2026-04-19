const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: String,
  description: String,
  order: Number
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },

  // ✅ FIXED
  code: { type: String, required: true, unique: true },

  description: String,
  category: String,
  emoji: { type: String, default: '📚' },

  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  modules: [moduleSchema],

  isPublished: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);