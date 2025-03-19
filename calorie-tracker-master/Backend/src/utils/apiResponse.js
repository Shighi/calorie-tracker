// src/utils/apiResponse.js
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

const errorResponse = (res, message, error = null, statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && error && { stack: error.stack })
  });
};

// Add validation error function
const validationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errors.array()
  });
};

export { ApiError, successResponse, errorResponse, validationError };