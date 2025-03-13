import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';
import cacheService from './cacheService.js';

class AuthService {
  async registerUser(email, password, name) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
  }

  async loginUser(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    const token = this.generateToken(user.id, user.role);
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
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
      include: ['profile'],
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

    if (profileData.name) user.name = profileData.name;
    if (profileData.email) {
      const existingUser = await User.findOne({ where: { email: profileData.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ApiError('Email already in use', 400);
      }
      user.email = profileData.email;
    }

    await user.save();

    if (user.profile) {
      await user.profile.update(profileData);
    } else {
      await user.createProfile(profileData);
    }
    
    // Invalidate user profile cache
    await cacheService.delete(`user:profile:${userId}`);
    
    // If daily calorie goal was updated, invalidate nutrition caches
    if (profileData.dailyCalorieGoal !== undefined) {
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