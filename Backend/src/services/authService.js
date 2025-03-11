const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { ApiError } = require('../utils/apiResponse');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Newly created user (without password)
   */
  async register(userData) {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new ApiError('Email already in use', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      role: 'user', // Default role is 'user'
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  /**
   * Authenticate user and generate JWT token
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data and access token
   */
  async login(email, password) {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  }

  /**
   * Generate JWT token
   * @param {number} userId - User ID
   * @param {string} role - User role
   * @returns {string} JWT token
   */
  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRATION }
    );
  }

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Object} User profile data
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: ['profile'],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    return user;
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Object} Updated user profile
   */
  async updateProfile(userId, profileData) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Update user data
    if (profileData.name) user.name = profileData.name;
    if (profileData.email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        where: { email: profileData.email }
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new ApiError('Email already in use', 400);
      }
      
      user.email = profileData.email;
    }
    
    await user.save();
    
    // Update or create user profile
    if (user.profile) {
      await user.profile.update(profileData);
    } else {
      await user.createProfile(profileData);
    }
    
    // Get updated user with profile
    return this.getProfile(userId);
  }
}

module.exports = new AuthService();