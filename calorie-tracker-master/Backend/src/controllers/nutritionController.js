import NutritionService from '../services/nutritionService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class NutritionController {
  /**
   * Get daily nutrition information for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response object with daily nutrition data
   */
  async getDailyNutrition(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const { date } = req.query;
      if (!date) {
        return errorResponse(res, 'Date parameter is required', null, 400);
      }

      const dailyNutrition = await NutritionService.getDailyNutrition(userId, date);
      return successResponse(res, 'Daily nutrition retrieved successfully', dailyNutrition);
    } catch (error) {
      console.error('Error in getDailyNutrition:', error);
      return errorResponse(res, 'Error retrieving daily nutrition', error.message, 500);
    }
  }

  /**
   * Get weekly nutrition information for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response object with weekly nutrition data
   */
  async getWeeklyNutrition(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return errorResponse(res, 'Start date and end date parameters are required', null, 400);
      }

      const weeklyNutrition = await NutritionService.getWeeklyNutrition(userId, startDate, endDate);
      return successResponse(res, 'Weekly nutrition retrieved successfully', weeklyNutrition);
    } catch (error) {
      console.error('Error in getWeeklyNutrition:', error);
      return errorResponse(res, 'Error retrieving weekly nutrition', error.message, 500);
    }
  }

  /**
   * Get monthly nutrition information for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response object with monthly nutrition data
   */
  async getMonthlyNutrition(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'User ID not provided', null, 400);
      }

      const { month, year } = req.query;
      if (!month || !year) {
        return errorResponse(res, 'Month and year parameters are required', null, 400);
      }

      const monthlyNutrition = await NutritionService.getMonthlyNutrition(userId, month, year);
      return successResponse(res, 'Monthly nutrition retrieved successfully', monthlyNutrition);
    } catch (error) {
      console.error('Error in getMonthlyNutrition:', error);
      return errorResponse(res, 'Error retrieving monthly nutrition', error.message, 500);
    }
  }

  /**
   * Get nutrient details for a specific food
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} Response object with nutrient details
   */
  async getNutrientsByFoodId(req, res) {
    try {
      const { foodId } = req.params;
      if (!foodId) {
        return errorResponse(res, 'Food ID is required', null, 400);
      }

      const nutrients = await NutritionService.getNutrientsByFoodId(foodId);
      return successResponse(res, 'Nutrients retrieved successfully', nutrients);
    } catch (error) {
      console.error('Error in getNutrientsByFoodId:', error);
      return errorResponse(res, 'Error retrieving nutrients', error.message, 500);
    }
  }
}

export default new NutritionController();