import MealService from '../services/mealService';
import { successResponse, errorResponse } from '../utils/apiResponse';

class MealController {
  async createMeal(req, res) {
    try {
      const userId = req.user.user_id;
      const mealData = req.body;

      const meal = await MealService.createMeal(userId, mealData);

      return successResponse(
        res, 
        'Meal logged successfully', 
        meal, 
        201
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error logging meal', 
        error, 
        500
      );
    }
  }

  async getUserMeals(req, res) {
    try {
      const userId = req.user.user_id;
      const { 
        page, 
        limit, 
        startDate, 
        endDate, 
        mealType 
      } = req.query;

      const meals = await MealService.getUserMeals(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        mealType
      });

      return successResponse(
        res, 
        'Meals retrieved successfully', 
        meals
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error retrieving meals', 
        error, 
        500
      );
    }
  }

  async getMealById(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;

      const meal = await MealService.getMealById(id, userId);

      return successResponse(
        res, 
        'Meal retrieved successfully', 
        meal
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error retrieving meal', 
        error, 
        404
      );
    }
  }

  async updateMeal(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;
      const mealData = req.body;

      const updatedMeal = await MealService.updateMeal(
        id, 
        userId, 
        mealData
      );

      return successResponse(
        res, 
        'Meal updated successfully', 
        updatedMeal
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error updating meal', 
        error, 
        400
      );
    }
  }

  async deleteMeal(req, res) {
    try {
      const userId = req.user.user_id;
      const { id } = req.params;

      await MealService.deleteMeal(id, userId);

      return successResponse(
        res, 
        'Meal deleted successfully', 
        null, 
        204
      );
    } catch (error) {
      return errorResponse(
        res, 
        'Error deleting meal', 
        error, 
        400
      );
    }
  }
}

export default new MealController();