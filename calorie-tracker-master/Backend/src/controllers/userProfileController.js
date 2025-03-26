// userProfileController.js
import UserProfile from '../models/UserProfile.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class UserProfileController {
  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const userProfile = await UserProfile.findOne({
        where: { user_id: userId },
        attributes: { exclude: ['created_at', 'updated_at'] }
      });

      if (!userProfile) {
        return errorResponse(res, 'User profile not found', null, 404);
      }

      return successResponse(res, 'User profile retrieved successfully', userProfile);
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      next(error); // Pass to error handling middleware
    }
  }

  /**
   * Create or update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createOrUpdateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { 
        daily_calorie_goal, 
        height, 
        weight, 
        activity_level 
      } = req.body;

      // Validate input
      if (!daily_calorie_goal && !height && !weight && !activity_level) {
        return errorResponse(res, 'No profile data provided', null, 400);
      }

      // Find or create user profile
      const [userProfile, created] = await UserProfile.findOrCreate({
        where: { user_id: userId },
        defaults: {
          user_id: userId,
          daily_calorie_goal,
          height,
          weight,
          activity_level
        }
      });

      // If profile exists, update it
      if (!created) {
        await userProfile.update({
          daily_calorie_goal: daily_calorie_goal || userProfile.daily_calorie_goal,
          height: height || userProfile.height,
          weight: weight || userProfile.weight,
          activity_level: activity_level || userProfile.activity_level
        });
      }

      return successResponse(
        res, 
        created ? 'User profile created' : 'User profile updated', 
        userProfile
      );
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      next(error); // Pass to error handling middleware
    }
  }
}

export default new UserProfileController();