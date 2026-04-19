const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CORS FIX (IMPORTANT)
app.use(cors({
  origin: [
    'http://localhost:3000',              // local frontend
    'https://mern-frontend-flame-five.vercel.app'   // 🔁 replace with your real Vercel URL
  ],
  credentials: true
}));

app.use(express.json());

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/pdf', require('./routes/routes/pdf'));

// ✅ Test route
app.get('/', (req, res) => {
  res.json({ message: 'EduTrack API running' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection error:', err);
  });