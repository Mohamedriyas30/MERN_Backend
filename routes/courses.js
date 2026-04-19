const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/courses — all published courses (public)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/my — faculty's own courses
router.get('/my', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { faculty: req.user._id };
    const courses = await Course.find(query).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('faculty', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses — create a course
router.post('/', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { title, code, description, category, emoji, modules } = req.body;

    // Optional: generate code if not provided? No, schema says it's required.
    // If not provided in req.body, frontend should handle or we fail here.

    const course = await Course.create({
      title,
      code,
      description,
      category,
      emoji,
      faculty: req.user._id,
      modules: modules || [],
    });

    res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses/:id/modules — add a module
router.post('/:id/modules', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Auth check: only creator or admin
    if (req.user.role !== 'admin' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, duration, description, order } = req.body;
    course.modules.push({ title, duration, description, order });
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;