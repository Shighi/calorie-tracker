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
}

/**
 * Get user profile information
 */
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await authService.getUserProfile(userId);
    return apiResponse.success(res, profile, 'Profile retrieved successfully');
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
    return apiResponse.success(res, updatedProfile, 'Profile updated successfully');
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
}