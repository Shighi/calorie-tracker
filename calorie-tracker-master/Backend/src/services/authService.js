import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';
import cacheService from './cacheService.js';
import { Op } from 'sequelize';

class AuthService {
  async registerUser(email, password, username, first_name = null, last_name = null, daily_calorie_target = null) {
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new ApiError('Email already exists', 409);
    }
    
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new ApiError('Username already exists', 409);
    }

    // Create new user with fields that match the database schema
    const user = await User.create({
      email,
      username,
      password, // Password will be hashed by the User model hooks
      first_name,
      last_name,
      daily_calorie_target,
      is_active: true
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  async loginUser(emailOrUsername, password) {
    // Find the user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }]
      }
    });

    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check if the account is active
    if (!user.is_active) {
      throw new ApiError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      config.auth.jwtSecret, // Fixed: Now using config.auth.jwtSecret
      { expiresIn: config.auth.jwtExpiration } // Fixed: Now using config.auth.jwtExpiration
    );

    // Store token in cache with user ID as key
    await cacheService.set(
      `auth:token:${user.id}`,
      token,
      config.auth.jwtExpiration // Fixed: Now using config.auth.jwtExpiration
    );

    // Return user data and token
    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  }

  async getUserProfile(userId) {
    // Try to get user profile from cache
    const cachedProfile = await cacheService.get(`user:profile:${userId}`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }

    // If not in cache, fetch from database
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const profile = user.toJSON();
    delete profile.password;

    // Cache the profile
    await cacheService.set(`user:profile:${userId}`, JSON.stringify(profile), 3600); // Cache for 1 hour

    return profile;
  }

  async updateUserProfile(userId, profileData) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Update only fields that are in the User model
    if (profileData.username) {
      const existingUser = await User.findOne({ where: { username: profileData.username } });
      if (existingUser && existingUser.id !== userId) {
        throw new ApiError('Username already in use', 400);
      }
      user.username = profileData.username;
    }
    
    if (profileData.email) {
      const existingUser = await User.findOne({ where: { email: profileData.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ApiError('Email already in use', 400);
      }
      user.email = profileData.email;
    }

    if (profileData.first_name !== undefined) user.first_name = profileData.first_name;
    if (profileData.last_name !== undefined) user.last_name = profileData.last_name;
    if (profileData.daily_calorie_target !== undefined) user.daily_calorie_target = profileData.daily_calorie_target;
    if (profileData.is_active !== undefined) user.is_active = profileData.is_active;
    
    // If password is changing, the User model hooks will handle hashing
    if (profileData.password) {
      user.password = profileData.password;
    }

    await user.save();
    
    // Invalidate user profile cache
    await cacheService.delete(`user:profile:${userId}`);
    
    // If daily calorie target was updated, invalidate nutrition caches
    if (profileData.daily_calorie_target !== undefined) {
      await cacheService.deleteByPattern(`nutrition:daily:${userId}:*`);
      await cacheService.deleteByPattern(`nutrition:weekly:${userId}:*`);
    }

    return this.getUserProfile(userId);
  }

  async deleteUserSession(userId) {
    // Delete token from cache
    await cacheService.delete(`auth:token:${userId}`);
    return true;
  }
}

export default new AuthService();