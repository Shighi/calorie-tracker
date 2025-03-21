import MealService from '../services/mealService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class MealController {
  async createMeal(req, res) {
    try {
      const userId = req.user.id; // Using user ID correctly
      const { name, meal_time, total_calories } = req.body; // Include new fields (name, meal_time, total_calories)
      const mealData = { name, meal_time, total_calories }; // Ensure data contains total_calories
      const meal = await MealService.createMeal(userId, mealData);
      return successResponse(res, 'Meal logged successfully', meal, 201);
    } catch (error) {
      return errorResponse(res, 'Error logging meal', error, 500);
    }
  }

  async getUserMeals(req, res) {
    try {
      const userId = req.user.id; // Using user ID correctly
      const { page = 1, limit = 10, startDate, endDate, mealType } = req.query;

      const meals = await MealService.getUserMeals(userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        startDate,
        endDate,
        mealType
      });

      return successResponse(res, 'Meals retrieved successfully', meals);
    } catch (error) {
      return errorResponse(res, 'Error retrieving meals', error, 500);
    }
  }

  async getMealById(req, res) {
    try {
      const userId = req.user.id; // Using user ID correctly
      const { id } = req.params;

      const meal = await MealService.getMealById(id, userId);
      if (!meal) {
        return errorResponse(res, 'Meal not found', null, 404);
      }

      return successResponse(res, 'Meal retrieved successfully', meal);
    } catch (error) {
      return errorResponse(res, 'Error retrieving meal', error, 500);
    }
  }

  async updateMeal(req, res) {
    try {
      const userId = req.user.id; // Using user ID correctly
      const { id } = req.params;
      const { name, meal_time, total_calories } = req.body; // Include new fields (name, meal_time, total_calories)
      const mealData = { name, meal_time, total_calories }; // Ensure data contains total_calories

      const updatedMeal = await MealService.updateMeal(id, userId, mealData);
      if (!updatedMeal) {
        return errorResponse(res, 'Meal not found', null, 404);
      }

      return successResponse(res, 'Meal updated successfully', updatedMeal);
    } catch (error) {
      return errorResponse(res, 'Error updating meal', error, 400);
    }
  }

  async deleteMeal(req, res) {
    try {
      const userId = req.user.id; // Using user ID correctly
      const { id } = req.params;

      const deleted = await MealService.deleteMeal(id, userId);
      if (!deleted) {
        return errorResponse(res, 'Meal not found', null, 404);
      }

      return successResponse(res, 'Meal deleted successfully', null, 204);
    } catch (error) {
      return errorResponse(res, 'Error deleting meal', error, 400);
    }
  }

  // Add meal template methods
  async getMealTemplates(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const templates = await MealService.getMealTemplates(userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
      });

      return successResponse(res, 'Meal templates retrieved successfully', templates);
    } catch (error) {
      return errorResponse(res, 'Error retrieving meal templates', error, 500);
    }
  }

  async getMealTemplateById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const template = await MealService.getMealTemplateById(id, userId);
      if (!template) {
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      return successResponse(res, 'Meal template retrieved successfully', template);
    } catch (error) {
      return errorResponse(res, 'Error retrieving meal template', error, 500);
    }
  }

  async createMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { name, meal_time, total_calories } = req.body; // Include new fields
      const templateData = { name, meal_time, total_calories }; // Ensure template contains total_calories

      const template = await MealService.createMealTemplate(userId, templateData);
      return successResponse(res, 'Meal template created successfully', template, 201);
    } catch (error) {
      return errorResponse(res, 'Error creating meal template', error, 500);
    }
  }

  async updateMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { name, meal_time, total_calories } = req.body; // Include new fields
      const templateData = { name, meal_time, total_calories }; // Ensure template contains total_calories

      const updatedTemplate = await MealService.updateMealTemplate(id, userId, templateData);
      if (!updatedTemplate) {
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      return successResponse(res, 'Meal template updated successfully', updatedTemplate);
    } catch (error) {
      return errorResponse(res, 'Error updating meal template', error, 400);
    }
  }

  async deleteMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await MealService.deleteMealTemplate(id, userId);
      if (!deleted) {
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      return successResponse(res, 'Meal template deleted successfully', null, 204);
    } catch (error) {
      return errorResponse(res, 'Error deleting meal template', error, 400);
    }
  }
}

export default new MealController();