import FoodService from '../services/foodService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class FoodController {
  async createFood(req, res) {
    try {
      const userId = req.user.id;
      const foodData = req.body;
      const food = await FoodService.createFood(foodData, userId);
      return successResponse(res, 'Food created successfully', food, 201);
    } catch (error) {
      return errorResponse(res, 'Error creating food', error, 500);
    }
  }

  // This method is referenced in routes as getFoods but implemented as getUserFoods
  async getFoods(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { page = 1, limit = 20, query = '', category = '', sort = 'name', order = 'ASC' } = req.query;

      const foods = await FoodService.getUserFoods(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        query,
        category,
        sort,
        order
      });

      return successResponse(res, 'Foods retrieved successfully', foods);
    } catch (error) {
      return errorResponse(res, 'Error retrieving foods', error, 500);
    }
  }

  async getFoodById(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { id } = req.params;

      const food = await FoodService.getFoodById(id, userId);
      if (!food) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food retrieved successfully', food);
    } catch (error) {
      return errorResponse(res, 'Error retrieving food', error, 500);
    }
  }

  // Added these methods to match the routes
  async getFoodsByCategory(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { category } = req.params;
      const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;

      const foods = await FoodService.getUserFoods(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        category,
        sort,
        order
      });

      return successResponse(res, 'Foods by category retrieved successfully', foods);
    } catch (error) {
      return errorResponse(res, 'Error retrieving foods by category', error, 500);
    }
  }

  async getFoodsByLocale(req, res) {
    try {
      const { localeId } = req.params;
      const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;

      // This would need to be implemented in your FoodService
      const foods = await FoodService.getFoodsByLocale(localeId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        order
      });

      return successResponse(res, 'Foods by locale retrieved successfully', foods);
    } catch (error) {
      return errorResponse(res, 'Error retrieving foods by locale', error, 500);
    }
  }

  async updateFood(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const foodData = req.body;

      const updatedFood = await FoodService.updateFood(id, userId, foodData);
      if (!updatedFood) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food updated successfully', updatedFood);
    } catch (error) {
      return errorResponse(res, 'Error updating food', error, 400);
    }
  }

  async deleteFood(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await FoodService.deleteFood(id, userId);
      if (!deleted) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food deleted successfully', null, 204);
    } catch (error) {
      return errorResponse(res, 'Error deleting food', error, 400);
    }
  }
}

export default new FoodController();