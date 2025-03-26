import UserProfile from '../models/UserProfile.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import cacheService from './cacheService.js';

class UserProfileService {
  /**
   * Get user profile by user ID
   * @param {number} userId - The ID of the user
   * @returns {Promise<Object>} User profile details
   */
  async getUserProfile(userId) {
    // Generate cache key
    const cacheKey = `user_profile:${userId}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const userProfile = await UserProfile.findOne({
        where: { user_id: userId },
        attributes: { 
          exclude: ['created_at', 'updated_at'] 
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['email', 'username']
        }]
      });

      if (!userProfile) {
        return null;
      }

      // Cache the result
      await cacheService.set(cacheKey, userProfile);

      return userProfile;
    } catch (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }
  }

  /**
   * Create or update user profile
   * @param {number} userId - The ID of the user
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated or created user profile
   */
  async createOrUpdateProfile(userId, profileData) {
    const transaction = await sequelize.transaction();

    try {
      // Find or create user profile
      const [userProfile, created] = await UserProfile.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          ...profileData
        },
        transaction
      });

      // If profile exists, update it
      if (!created) {
        await userProfile.update(profileData, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      // Invalidate cache
      await cacheService.delete(`user_profile:${userId}`);

      return userProfile;
    } catch (error) {
      // Rollback transaction if something goes wrong
      await transaction.rollback();
      throw new Error(`Error saving user profile: ${error.message}`);
    }
  }

  /**
   * Calculate recommended daily calorie intake
   * @param {Object} profileData - User profile data
   * @returns {number} Recommended daily calorie intake
   */
  calculateDailyCalorieGoal(profileData) {
    const { 
      height, 
      weight, 
      activity_level 
    } = profileData;

    // Assuming user provides age and gender through frontend or additional fields
    const age = profileData.age || 30; // Default age
    const gender = profileData.gender || 'male'; // Default gender

    // Harris-Benedict Equation for Basal Metabolic Rate (BMR)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };

    // Calculate total daily energy expenditure (TDEE)
    const multiplier = activityMultipliers[activity_level] || 1.2;
    const dailyCalorieGoal = Math.round(bmr * multiplier);

    return dailyCalorieGoal;
  }

  /**
   * Invalidate user profile cache
   * @param {number} userId - The ID of the user
   * @returns {Promise<boolean>} Whether cache invalidation was successful
   */
  async invalidateUserProfileCache(userId) {
    try {
      await cacheService.delete(`user_profile:${userId}`);
      return true;
    } catch (error) {
      console.error(`Error invalidating user profile cache: ${error.message}`);
      return false;
    }
  }
}

export default new UserProfileService();