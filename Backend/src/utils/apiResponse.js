// src/utils/apiResponse.js
class ApiError extends Error {
    constructor(message, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  }
  
  class ApiResponse {
    static success(res, data, statusCode = 200) {
      return res.status(statusCode).json({
        status: 'success',
        data
      });
    }
  
    static created(res, data) {
      return res.status(201).json({
        status: 'success',
        data
      });
    }
  
    static error(res, error) {
      const statusCode = error.statusCode || 500;
      
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  }
  
  module.exports = {
    ApiResponse,
    ApiError
  };