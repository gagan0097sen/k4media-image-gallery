const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');

const authMiddleware = (req, res, next) => {
  try {
    console.log('Auth Middleware - Cookies:', req.cookies,req.headers);
    const token = req.cookies.adminToken;
    
    if (!token) {
      return sendError(res, 401, 'No token provided', 'NO_TOKEN');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    sendError(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }
};

module.exports = authMiddleware;
