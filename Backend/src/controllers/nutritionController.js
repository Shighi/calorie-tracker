import NutritionService from '../services/nutritionService';
import { successResponse, errorResponse } from '../utils/apiResponse';

class NutritionController {
  async getDailyNutrition(req, res) {
    try {
      const userId = req.user.user_id;
      const { date } = req.query;

      const dailyNutrition = await NutritionService.getDailyNutrition(
        userId, 
        date
      );

      return successResponse(
        res, 
        'Daily nutrition retrieved successfully', 
        dailyNutrition
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error retrieving daily nutrition', 
        error, 
        500
      );
    }
  }

  async getWeeklyNutrition(req, res) {
    try {
      const userId = req.user.user_id;

      const weeklyNutrition = await NutritionService.getWeeklyNutrition(userId);

      return successResponse(
        res, 
        'Weekly nutrition retrieved successfully', 
        weeklyNutrition
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error retrieving weekly nutrition', 
        error, 
        500
      );
    }
  }

  async getMonthlyNutrition(req, res) {
    try {
      const userId = req.user.user_id;

      const monthlyNutrition = await NutritionService.getMonthlyNutrition(userId);

      return successResponse(
        res, 
        'Monthly nutrition retrieved successfully', 
        monthlyNutrition
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error retrieving monthly nutrition', 
        error, 
        500
      );
    }
  }
}

export default new NutritionController();