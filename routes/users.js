const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

// GET /api/users — admin only
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// PATCH /api/users/:id/status — admin toggle active/inactive
router.patch('/:id/status', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ _id: user._id, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/students — faculty or admin
router.get('/students', protect, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
