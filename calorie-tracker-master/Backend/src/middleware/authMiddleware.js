/**
 * Authentication middleware
 * @module middleware/authMiddleware
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided.', null, 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return errorResponse(res, 'Invalid token. User not found.', null, 401);
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
      return errorResponse(res, 'Token expired.', error, 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token.', error, 401);
    }

    logger.error(`Auth middleware error: ${error.message}`);
    return errorResponse(res, 'Authentication error.', error, 500);
  }
};

/**
 * Check if authenticated user has required roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', null, 401);
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return errorResponse(res, `Access denied. Required role: ${roles.join(', ')}.`, null, 403);
    }

    next();
  };
};

/**
 * Check if authenticated user has admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Admin privileges required.', null, 403);
  }

  next();
};

/**
 * Check if authenticated user is accessing their own resource
 */
const isResourceOwner = (paramName) => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName];

    if (!req.user) {
      return errorResponse(res, 'Authentication required.', null, 401);
    }

    // Allow admins to access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is accessing their own resource
    if (req.user.id.toString() !== resourceUserId.toString()) {
      return errorResponse(res, 'Access denied. You can only access your own resources.', null, 403);
    }

    next();
  };
};

export default {
  authenticate,
  authorize,
  isAdmin,
  isResourceOwner
};