import NutritionService from '../services/nutritionService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class NutritionController {
  async getDailyNutrition(req, res) {
    try {
      const userId = req.user?.id; // Changed from user_id to id
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const { date } = req.query;
      const dailyNutrition = await NutritionService.getDailyNutrition(userId, date);

      return successResponse(res, 'Daily nutrition retrieved successfully', dailyNutrition);
    } catch (error) {
      console.error('Error in getDailyNutrition:', error);
      return errorResponse(res, 'Error retrieving daily nutrition', error, 500);
    }
  }

  async getWeeklyNutrition(req, res) {
    try {
      const userId = req.user?.id; // Changed from user_id to id
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const weeklyNutrition = await NutritionService.getWeeklyNutrition(userId);
      return successResponse(res, 'Weekly nutrition retrieved successfully', weeklyNutrition);
    } catch (error) {
      console.error('Error in getWeeklyNutrition:', error);
      return errorResponse(res, 'Error retrieving weekly nutrition', error, 500);
    }
  }

  async getMonthlyNutrition(req, res) {
    try {
      const userId = req.user?.id; // Changed from user_id to id
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const monthlyNutrition = await NutritionService.getMonthlyNutrition(userId);
      return successResponse(res, 'Monthly nutrition retrieved successfully', monthlyNutrition);
    } catch (error) {
      console.error('Error in getMonthlyNutrition:', error);
      return errorResponse(res, 'Error retrieving monthly nutrition', error, 500);
    }
  }
}

export default new NutritionController();