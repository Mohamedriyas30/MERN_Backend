const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/enrollments/my — student's enrollments
router.get('/my', protect, requireRole('student'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({ path: 'course', populate: { path: 'faculty', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/enrollments/course/:courseId — faculty sees all students in a course
router.get('/course/:courseId', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .populate('course', 'title modules');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/enrollments/all — admin sees everything
router.get('/all', protect, requireRole('admin'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate({ path: 'course', populate: { path: 'faculty', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/enrollments — faculty assigns student to course
router.post('/', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) return res.status(400).json({ message: 'Student already enrolled' });

    // Initialize progress for each module
    const moduleProgress = course.modules.map((m) => ({
      moduleId: m._id,
      completed: false,
    }));

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      moduleProgress,
      assignedBy: req.user._id,
    });

    await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title' },
    ]);
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/enrollments/:id/module/:moduleId — student toggles module done
router.patch('/:id/module/:moduleId', protect, requireRole('student'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const mod = enrollment.moduleProgress.find(
      (m) => m.moduleId.toString() === req.params.moduleId
    );
    if (!mod) return res.status(404).json({ message: 'Module not found' });

    mod.completed = !mod.completed;
    mod.completedAt = mod.completed ? new Date() : null;

    // Check if all modules done
    const allDone = enrollment.moduleProgress.every((m) => m.completed);
    if (allDone && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
      enrollment.certificateIssued = true;
    } else if (!allDone) {
      enrollment.completedAt = null;
      enrollment.certificateIssued = false;
    }

    await enrollment.save();
    await enrollment.populate({ path: 'course', populate: { path: 'faculty', select: 'name' } });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
