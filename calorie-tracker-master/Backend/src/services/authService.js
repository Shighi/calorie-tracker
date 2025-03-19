import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';
import cacheService from './cacheService.js';
import { Op } from 'sequelize';

class AuthService {
  async registerUser(email, password, username, last_name = null, daily_calorie_target = null) {
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
      last_name,
      daily_calorie_target,
      is_active: true
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  async loginUser(emailOrUsername, password) {
    if (!emailOrUsername) {
      throw new ApiError('Email or username is required', 400);
    }

    // Find the user by either email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });
    
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Use the comparePassword method from the User model
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check if the user is active
    if (!user.is_active) {
      throw new ApiError('Account is inactive', 403);
    }

    const token = this.generateToken(user.id);
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRATION }
    );
  }

  async getUserProfile(userId) {
    // Generate cache key
    const cacheKey = `user:profile:${userId}`;
    
    // Try to get from cache first
    const cachedProfile = await cacheService.get(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Cache the result
    await cacheService.set(cacheKey, user);
    
    return user;
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
    try {
      // When a user logs out, we can invalidate their profile cache
      await cacheService.delete(`user:profile:${userId}`);
      return true;
    } catch (error) {
      console.error(`Error invalidating user session: ${error.message}`);
      return false;
    }
  }
}

export default new AuthService();