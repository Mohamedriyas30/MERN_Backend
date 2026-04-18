const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;
console.log('Attempting to connect to:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password

mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS: MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILURE: Connection error details:');
    console.error(err);
    process.exit(1);
  });
