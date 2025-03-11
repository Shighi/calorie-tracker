/**
 * Authentication middleware
 * @module middleware/authMiddleware
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Validate JWT token and attach user to request
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiResponse.unauthorized(res, 'Access denied. No token provided.');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return apiResponse.unauthorized(res, 'Invalid token. User not found.');
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiResponse.unauthorized(res, 'Token expired.');
    }
    if (error.name === 'JsonWebTokenError') {
      return apiResponse.unauthorized(res, 'Invalid token.');
    }
    
    logger.error(`Auth middleware error: ${error.message}`);
    return apiResponse.serverError(res, 'Authentication error.');
  }
};

/**
 * Check if authenticated user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return apiResponse.forbidden(res, 'Access denied. Admin privileges required.');
  }
  
  next();
};

/**
 * Check if authenticated user is accessing their own resource
 * @param {string} paramName - Request parameter name containing user ID to check
 * @returns {Function} Middleware function
 */
exports.isResourceOwner = (paramName) => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];
    
    if (!req.user) {
      return apiResponse.unauthorized(res, 'Authentication required.');
    }
    
    // Allow admins to access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user is accessing their own resource
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return apiResponse.forbidden(res, 'Access denied. You can only access your own resources.');
    }
    
    next();
  };
};