const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, default: '30 min' },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Data Science', 'Web Development', 'Programming', 'AI / Deep Learning', 'Database', 'Other'],
      default: 'Other',
    },
    emoji: { type: String, default: '📚' },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modules: [moduleSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
