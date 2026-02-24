require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const fs = require('fs');
const { sendError, handleException } = require('./utils/responseHandler');
const cookieParser = require("cookie-parser");


const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Security Middleware - Helmet
app.use(helmet());

// Body parser middleware
app.use(express.json());
app.use(cookieParser());

// CORS Middleware with credentials
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.ADMIN_DASHBOARD_URL,
    process.env.PUBLIC_WEBSITE_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/images', require('./routes/images'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' });
});

// 404 handler
app.use((req, res) => {
  sendError(res, 404, 'Route not found', 'NOT_FOUND');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  handleException(res, err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
