/**
 * Authentication controller handling user auth operations
 * @module controllers/authController
 */

const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with user data or error
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { email, password, name } = req.body;
    const result = await authService.registerUser(email, password, name);
    
    logger.info(`User registered: ${email}`);
    return apiResponse.success(res, result, 'User registered successfully', 201);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error.message === 'Email already exists') {
      return apiResponse.conflict(res, 'Email already registered');
    }
    next(error);
  }
};

/**
 * Login user and return authentication token
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with auth token or error
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    
    logger.info(`User login successful: ${email}`);
    return apiResponse.success(res, result, 'Login successful');
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error.message === 'Invalid credentials') {
      return apiResponse.unauthorized(res, 'Invalid email or password');
    }
    next(error);
  }
};

/**
 * Get user profile information
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with user profile data or error
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await authService.getUserProfile(userId);
    
    return apiResponse.success(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

/**
 * Update user profile information
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with updated profile data or error
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const userId = req.user.id;
    const profileData = req.body;
    
    const updatedProfile = await authService.updateUserProfile(userId, profileData);
    
    logger.info(`Profile updated for user: ${userId}`);
    return apiResponse.success(res, updatedProfile, 'Profile updated successfully');
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
};