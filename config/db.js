const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠ MongoDB connection failed. Server will start but some features may not work.');
    console.warn('Make sure MongoDB is running on ' + (process.env.MONGODB_URI || 'mongodb://localhost:27017/image-gallery'));
    // Don't exit - allow server to start without DB
  }
};

module.exports = connectDB;
