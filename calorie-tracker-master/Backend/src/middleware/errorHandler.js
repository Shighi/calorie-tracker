import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    path: req.path,
    body: req.body,
    stack: err.stack
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Specific error type handling
  if (err.name === 'ValidationError') {
    errorResponse.errors = err.errors;
  } else if (err.name === 'UnauthorizedError') {
    errorResponse.message = 'Authentication failed';
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason:`, reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default errorHandler;