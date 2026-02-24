const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');

const userAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authHeader:", authHeader);
    if (!authHeader) {
      return sendError(res, 401, 'No Authorization header', 'NO_AUTH_HEADER');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return sendError(res, 401, 'Invalid Authorization header format', 'INVALID_FORMAT');
    }

    const token = parts[1];
    
    if (!token) {
      return sendError(res, 401, 'No token provided', 'NO_TOKEN');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    sendError(res, 401, 'Invalid token', 'INVALID_TOKEN');
  }
};

module.exports = userAuthMiddleware;
