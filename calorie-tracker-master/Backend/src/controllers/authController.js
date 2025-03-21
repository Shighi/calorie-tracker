/**
 * Authentication controller handling user auth operations
 * @module controllers/authController
 */
import { validationResult } from 'express-validator';
import authService from '../services/authService.js';
import * as apiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }
    
    // Extract all required fields from request body
    const { email, password, username, first_name, last_name, daily_calorie_target } = req.body;
    
    // Log the registration attempt with all fields
    logger.info(`Registration attempt: email=${email}, username=${username}`);
    
    // Pass all fields to the service
    const result = await authService.registerUser(email, password, username, first_name, last_name, daily_calorie_target);
    
    logger.info(`User registered: ${email}`);
    return apiResponse.successResponse(res, 'User registered successfully', result, 201);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { body: req.body, method: req.method, path: req.path, stack: error.stack });
    
    if (error.message === 'Email already exists') {
      return apiResponse.errorResponse(res, 'Email already registered', error, 409);
    }
    if (error.message === 'Username already exists') {
      return apiResponse.errorResponse(res, 'Username already registered', error, 409);
    }
    
    next(error);
  }
}

/**
 * Login user and return authentication token
 */
export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }
    const { emailOrUsername, password } = req.body;
    const result = await authService.loginUser(emailOrUsername, password);
    logger.info(`User login successful: ${emailOrUsername}`);
    return apiResponse.successResponse(res, 'Login successful', result);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error.message === 'Invalid credentials') {
      return apiResponse.errorResponse(res, 'Invalid email or password', error, 401);
    }
    next(error);
  }
}

/**
 * Get user profile information
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await authService.getUserProfile(userId);
    return apiResponse.successResponse(res, 'Profile retrieved successfully', profile);
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
}

/**
 * Update user profile information
 */
export async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }
    const userId = req.user.id;
    const profileData = req.body;
    const updatedProfile = await authService.updateUserProfile(userId, profileData);
    logger.info(`Profile updated for user: ${userId}`);
    return apiResponse.successResponse(res, 'Profile updated successfully', updatedProfile);
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
}

/**
 * Logout user and invalidate token
 */
export async function logout(req, res, next) {
  try {
    const userId = req.user.id;
    await authService.deleteUserSession(userId);
    logger.info(`User logged out: ${userId}`);
    return apiResponse.successResponse(res, 'Logout successful');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
}