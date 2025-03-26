import MealService from '../services/mealService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

class MealController {
  async createMeal(req, res) {
    try {
      const userId = req.user.id;
      const mealData = req.body;
      
      logger.info(`Creating meal for user: ${userId}`, { mealData });
      
      // Ensure consistency with meal_date vs log_date
      mealData.meal_date = mealData.log_date || new Date();
      
      // Normalize food items if present
      if (mealData.foods && Array.isArray(mealData.foods)) {
        mealData.foods = mealData.foods.map(food => {
          // Ensure both serving_qty and serving_size are present for consistency
          if (food.serving_qty && !food.serving_size) {
            food.serving_size = food.serving_qty;
          } else if (food.serving_size && !food.serving_qty) {
            food.serving_qty = food.serving_size;
          }
          return food;
        });
      }
      
      const meal = await MealService.createMeal(userId, mealData);
      logger.info(`Meal created successfully for user: ${userId}`, { mealId: meal.id });
      return successResponse(res, 'Meal logged successfully', meal, 201);
    } catch (error) {
      logger.error('Error logging meal', { userId: req.user.id, error: error.message });
      return errorResponse(res, 'Error logging meal', error, 500);
    }
  }

  async getUserMeals(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, startDate, endDate, mealType } = req.query;

      logger.info('Fetching meals for user', { 
        userId, 
        page, 
        limit, 
        startDate, 
        endDate, 
        mealType 
      });

      const meals = await MealService.getUserMeals(userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        startDate,
        endDate,
        mealType
      });

      logger.info(`Retrieved ${meals.length} meals for user`, { userId });
      return successResponse(res, 'Meals retrieved successfully', meals);
    } catch (error) {
      logger.error('Error retrieving meals', { 
        userId: req.user.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error retrieving meals', error, 500);
    }
  }

  async getMealById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal ID', null, 400);
      }

      logger.info('Retrieving meal by ID', { userId, mealId: id });

      const meal = await MealService.getMealById(parsedId, userId);
      if (!meal) {
        logger.warn('Meal not found', { userId, mealId: id });
        return errorResponse(res, 'Meal not found', null, 404);
      }

      return successResponse(res, 'Meal retrieved successfully', meal);
    } catch (error) {
      logger.error('Error retrieving meal', { 
        userId: req.user.id, 
        mealId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error retrieving meal', error, 500);
    }
  }

  async updateMeal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const mealData = req.body;
      
      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal ID', null, 400);
      }
      
      logger.info('Updating meal', { userId, mealId: id, mealData });
      
      // Ensure consistency with meal_date vs log_date
      mealData.meal_date = mealData.log_date || new Date();
      
      // Normalize food items if present
      if (mealData.foods && Array.isArray(mealData.foods)) {
        mealData.foods = mealData.foods.map(food => {
          // Ensure both serving_qty and serving_size are present for consistency
          if (food.serving_qty && !food.serving_size) {
            food.serving_size = food.serving_qty;
          } else if (food.serving_size && !food.serving_qty) {
            food.serving_qty = food.serving_size;
          }
          return food;
        });
      }

      const updatedMeal = await MealService.updateMeal(parsedId, userId, mealData);
      if (!updatedMeal) {
        logger.warn('Meal not found for update', { userId, mealId: id });
        return errorResponse(res, 'Meal not found', null, 404);
      }

      logger.info('Meal updated successfully', { userId, mealId: id });
      return successResponse(res, 'Meal updated successfully', updatedMeal);
    } catch (error) {
      logger.error('Error updating meal', { 
        userId: req.user.id, 
        mealId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error updating meal', error, 500);
    }
  }

  async deleteMeal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal ID', null, 400);
      }

      logger.info('Deleting meal', { userId, mealId: id });

      const deleted = await MealService.deleteMeal(parsedId, userId);
      if (!deleted) {
        logger.warn('Meal not found for deletion', { userId, mealId: id });
        return errorResponse(res, 'Meal not found', null, 404);
      }

      logger.info('Meal deleted successfully', { userId, mealId: id });
      return successResponse(res, 'Meal deleted successfully', null, 204);
    } catch (error) {
      logger.error('Error deleting meal', { 
        userId: req.user.id, 
        mealId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error deleting meal', error, 500);
    }
  }

  async removeFoodFromMeal(req, res) {
    try {
      const userId = req.user.id;
      const { mealId, foodId } = req.params;

      // Validate input
      if (!mealId || !foodId) {
        return errorResponse(res, 'Invalid meal or food ID', null, 400);
      }

      // Convert mealId and foodId to integers
      const parsedMealId = parseInt(mealId, 10);
      const parsedFoodId = parseInt(foodId, 10);

      // Check for valid number conversion
      if (isNaN(parsedMealId) || isNaN(parsedFoodId)) {
        return errorResponse(res, 'Invalid meal or food ID format', null, 400);
      }

      logger.info('Removing food from meal', { userId, mealId, foodId });

      const result = await MealService.removeFoodFromMeal(parsedMealId, parsedFoodId, userId);
      
      if (!result) {
        logger.warn('Food not found in meal', { userId, mealId, foodId });
        return errorResponse(res, 'Food not found in meal', null, 404);
      }
      
      logger.info('Food removed from meal successfully', { userId, mealId, foodId });
      return successResponse(res, 'Food removed from meal successfully', null, 204);
    } catch (error) {
      logger.error('Error removing food from meal', { 
        userId: req.user.id, 
        mealId: req.params.mealId, 
        foodId: req.params.foodId, 
        error: error.message 
      });
      return errorResponse(res, 'Error removing food from meal', error, 500);
    }
  }

  async getMealTemplates(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      logger.info('Retrieving meal templates', { userId, page, limit });

      const templates = await MealService.getMealTemplates(userId, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
      });

      logger.info(`Retrieved ${templates.length} meal templates`, { userId });
      return successResponse(res, 'Meal templates retrieved successfully', templates);
    } catch (error) {
      logger.error('Error retrieving meal templates', { 
        userId: req.user.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error retrieving meal templates', error, 500);
    }
  }

  async getMealTemplateById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal template ID', null, 400);
      }

      logger.info('Retrieving meal template by ID', { userId, templateId: id });

      const template = await MealService.getMealTemplateById(parsedId, userId);
      if (!template) {
        logger.warn('Meal template not found', { userId, templateId: id });
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      return successResponse(res, 'Meal template retrieved successfully', template);
    } catch (error) {
      logger.error('Error retrieving meal template', { 
        userId: req.user.id, 
        templateId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error retrieving meal template', error, 500);
    }
  }

  async createMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const templateData = req.body;
      
      logger.info('Creating meal template', { userId, templateData });
      
      // Normalize food items if present
      if (templateData.foods && Array.isArray(templateData.foods)) {
        templateData.foods = templateData.foods.map(food => {
          // Ensure both serving_qty and serving_size are present for consistency
          if (food.serving_qty && !food.serving_size) {
            food.serving_size = food.serving_qty;
          } else if (food.serving_size && !food.serving_qty) {
            food.serving_qty = food.serving_size;
          }
          return food;
        });
      }

      const template = await MealService.createMealTemplate(userId, templateData);
      
      logger.info('Meal template created successfully', { 
        userId, 
        templateId: template.id 
      });
      
      return successResponse(res, 'Meal template created successfully', template, 201);
    } catch (error) {
      logger.error('Error creating meal template', { 
        userId: req.user.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error creating meal template', error, 500);
    }
  }

  async updateMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const templateData = req.body;
      
      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal template ID', null, 400);
      }
      
      logger.info('Updating meal template', { userId, templateId: id, templateData });
      
      // Normalize food items if present
      if (templateData.foods && Array.isArray(templateData.foods)) {
        templateData.foods = templateData.foods.map(food => {
          // Ensure both serving_qty and serving_size are present for consistency
          if (food.serving_qty && !food.serving_size) {
            food.serving_size = food.serving_qty;
          } else if (food.serving_size && !food.serving_qty) {
            food.serving_qty = food.serving_size;
          }
          return food;
        });
      }

      const updatedTemplate = await MealService.updateMealTemplate(parsedId, userId, templateData);
      if (!updatedTemplate) {
        logger.warn('Meal template not found for update', { userId, templateId: id });
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      logger.info('Meal template updated successfully', { userId, templateId: id });
      return successResponse(res, 'Meal template updated successfully', updatedTemplate);
    } catch (error) {
      logger.error('Error updating meal template', { 
        userId: req.user.id, 
        templateId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error updating meal template', error, 500);
    }
  }

  async deleteMealTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Validate input
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        return errorResponse(res, 'Invalid meal template ID', null, 400);
      }

      logger.info('Deleting meal template', { userId, templateId: id });

      const deleted = await MealService.deleteMealTemplate(parsedId, userId);
      if (!deleted) {
        logger.warn('Meal template not found for deletion', { userId, templateId: id });
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      logger.info('Meal template deleted successfully', { userId, templateId: id });
      return successResponse(res, 'Meal template deleted successfully', null, 204);
    } catch (error) {
      logger.error('Error deleting meal template', { 
        userId: req.user.id, 
        templateId: req.params.id, 
        error: error.message 
      });
      return errorResponse(res, 'Error deleting meal template', error, 500);
    }
  }

  async createMealFromTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { templateId } = req.params;
      const { meal_date, meal_time, notes } = req.body;

      // Validate input
      const parsedTemplateId = parseInt(templateId, 10);
      if (isNaN(parsedTemplateId)) {
        return errorResponse(res, 'Invalid template ID', null, 400);
      }

      logger.info('Creating meal from template', { 
        userId, 
        templateId, 
        meal_date, 
        meal_time 
      });

      // First get the template
      const template = await MealService.getMealTemplateById(parsedTemplateId, userId);
      if (!template) {
        logger.warn('Meal template not found', { userId, templateId });
        return errorResponse(res, 'Meal template not found', null, 404);
      }

      // Prepare meal data from template
      const mealData = {
        name: template.name,
        meal_type: template.meal_type,
        log_date: meal_date || new Date(),
        meal_time: meal_time || template.meal_time,
        notes: notes || template.notes,
        foods: template.foods.map(food => ({
          food_id: food.id,
          serving_qty: food.TemplateFood.serving_qty,
          serving_unit: food.TemplateFood.serving_unit
        }))
      };

      // Create meal using the template data
      const meal = await MealService.createMeal(userId, mealData);
      
      logger.info('Meal created from template successfully', { 
        userId, 
        templateId, 
        mealId: meal.id 
      });
      
      return successResponse(res, 'Meal created from template successfully', meal, 201);
    } catch (error) {
      logger.error('Error creating meal from template', { 
        userId: req.user.id, 
        templateId: req.params.templateId, 
        error: error.message 
      });
      return errorResponse(res, 'Error creating meal from template', error, 500);
    }
  }
}

export default new MealController();