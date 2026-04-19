const mongoose = require('mongoose');

const moduleProgressSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleProgress: [moduleProgressSchema],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Virtual: completion percentage
enrollmentSchema.virtual('completionPct').get(function () {
  if (!this.moduleProgress || this.moduleProgress.length === 0) return 0;
  const done = this.moduleProgress.filter((m) => m.completed).length;
  return Math.round((done / this.moduleProgress.length) * 100);
});

enrollmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
