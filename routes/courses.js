const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/courses — all published courses
router.get('/', protect, async (req, res) => {
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
router.get('/my', protect, requireRole('faculty'), async (req, res) => {
  try {
    const courses = await Course.find({ faculty: req.user._id }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('faculty', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses — faculty create
router.post('/', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { title, description, category, emoji, modules } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const course = await Course.create({
      title, description, category, emoji: emoji || '📚',
      faculty: req.user._id,
      modules: (modules || []).map((m, i) => ({ ...m, order: i })),
    });
    await course.populate('faculty', 'name email');
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses/:id/modules — add module
router.post('/:id/modules', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.faculty.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, duration, description } = req.body;
    course.modules.push({ title, duration, description, order: course.modules.length });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/courses/:id — admin or owner faculty
router.delete('/:id', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
