/**
 * User Validation Rules
 */

const { sendError } = require('../utils/responseHandler');

const validateUserId = (userId) => {
  return userId && userId.trim().length > 0;
};

const validateUserUpdate = (req, res, next) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return sendError(res, 400, 'At least one field (name or email) is required for update', 'NO_UPDATE_FIELDS');
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Invalid email format', 'INVALID_EMAIL');
    }
  }

  next();
};

const validateUserProfile = (req, res, next) => {
  const { userId } = req.params;

  if (!validateUserId(userId)) {
    return sendError(res, 400, 'User ID is required', 'MISSING_USER_ID');
  }

  next();
};

module.exports = {
  validateUserUpdate,
  validateUserProfile,
  validateUserId,
};
