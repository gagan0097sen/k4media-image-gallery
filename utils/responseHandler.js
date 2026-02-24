

const sendError = (res, statusCode, errorMessage, errorCode = null) => {
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: errorCode,
  });
};

const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const handleException = (res, error) => {
  console.error('Exception:', error.message || error);
  return res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    message: error.message || 'An unexpected error occurred',
  });
};

module.exports = {
  sendError,
  sendSuccess,
  handleException,
};
