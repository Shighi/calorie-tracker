import FoodService from '../services/foodService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class FoodController {
  async createFood(req, res) {
    try {
      const userId = req.user.id;
      const foodData = req.body;
      
      // Validate required fields
      if (!foodData.name) {
        return errorResponse(res, 'Food name is required', null, 400);
      }
      
      const food = await FoodService.createFood(foodData, userId);
      return successResponse(res, 'Food created successfully', food, 201);
    } catch (error) {
      console.error('Error creating food:', error);
      return errorResponse(res, 'Error creating food', error.message, 500);
    }
  }

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

      // Ensure data is properly structured for frontend
      return successResponse(res, 'Foods retrieved successfully', { 
        foods: foods.foods || foods, 
        totalCount: foods.totalCount || foods.length,
        page: parseInt(page, 10),
        totalPages: foods.totalPages || Math.ceil(foods.length / parseInt(limit, 10)),
        limit: parseInt(limit, 10)
      });
    } catch (error) {
      console.error('Error retrieving foods:', error);
      return errorResponse(res, 'Error retrieving foods', error.message, 500);
    }
  }

  async getCategories(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      
      const categories = await FoodService.getCategories(userId);
      return successResponse(res, 'Categories retrieved successfully', categories);
    } catch (error) {
      console.error('Error retrieving categories:', error);
      return errorResponse(res, 'Error retrieving categories', error.message, 500);
    }
  }

  async getFoodById(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Food ID is required', null, 400);
      }

      // Validate id is a number
      if (isNaN(parseInt(id, 10))) {
        return errorResponse(res, 'Invalid Food ID format', null, 400);
      }

      const food = await FoodService.getFoodById(id, userId);
      if (!food) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food retrieved successfully', food);
    } catch (error) {
      console.error('Error retrieving food:', error);
      return errorResponse(res, 'Error retrieving food', error.message, 500);
    }
  }

  async getFoodsByCategory(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { category } = req.params;
      const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;

      if (!category) {
        return errorResponse(res, 'Category is required', null, 400);
      }

      const foods = await FoodService.getUserFoods(userId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        category,
        sort,
        order
      });

      return successResponse(res, 'Foods by category retrieved successfully', { 
        foods: foods.foods || foods, 
        totalCount: foods.totalCount || foods.length,
        page: parseInt(page, 10),
        totalPages: foods.totalPages || Math.ceil(foods.length / parseInt(limit, 10)),
        limit: parseInt(limit, 10),
        category
      });
    } catch (error) {
      console.error('Error retrieving foods by category:', error);
      return errorResponse(res, 'Error retrieving foods by category', error.message, 500);
    }
  }

  async getFoodsByLocale(req, res) {
    try {
      const { localeId } = req.params;
      const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;

      if (!localeId) {
        return errorResponse(res, 'Locale ID is required', null, 400);
      }

      const foods = await FoodService.getFoodsByLocale(localeId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        order
      });

      return successResponse(res, 'Foods by locale retrieved successfully', { 
        foods: foods.foods || foods, 
        totalCount: foods.totalCount || foods.length,
        page: parseInt(page, 10),
        totalPages: foods.totalPages || Math.ceil(foods.length / parseInt(limit, 10)),
        limit: parseInt(limit, 10),
        localeId
      });
    } catch (error) {
      console.error('Error retrieving foods by locale:', error);
      return errorResponse(res, 'Error retrieving foods by locale', error.message, 500);
    }
  }

  async updateFood(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const foodData = req.body;

      if (!id) {
        return errorResponse(res, 'Food ID is required', null, 400);
      }

      const updatedFood = await FoodService.updateFood(id, userId, foodData);
      if (!updatedFood) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food updated successfully', updatedFood);
    } catch (error) {
      console.error('Error updating food:', error);
      return errorResponse(res, 'Error updating food', error.message, 400);
    }
  }

  async deleteFood(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Food ID is required', null, 400);
      }

      const deleted = await FoodService.deleteFood(id, userId);
      if (!deleted) {
        return errorResponse(res, 'Food not found', null, 404);
      }

      return successResponse(res, 'Food deleted successfully', null, 204);
    } catch (error) {
      console.error('Error deleting food:', error);
      return errorResponse(res, 'Error deleting food', error.message, 400);
    }
  }
}

export default new FoodController();