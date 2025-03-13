/**
 * Food management controller
 * @module controllers/foodController
 */

import { validationResult } from 'express-validator';
import foodService from '../services/foodService.js';
import * as apiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

class FoodController {
  /**
   * Get all foods with filtering, sorting, and pagination
   */
  static async getFoods(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortDir = 'asc',
        search,
        locale,
        category,
        minProtein,
        maxProtein,
        minCarbs,
        maxCarbs,
        minFat,
        maxFat,
        minCalories,
        maxCalories
      } = req.query;

      const filters = {
        search,
        locale,
        category,
        nutrients: {
          protein: { min: minProtein, max: maxProtein },
          carbs: { min: minCarbs, max: maxCarbs },
          fat: { min: minFat, max: maxFat },
          calories: { min: minCalories, max: maxCalories }
        }
      };

      const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        sortBy,
        sortDir
      };

      const result = await foodService.getAllFoods(filters, options);

      return apiResponse.success(res, result.data, 'Foods retrieved successfully', 200, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error fetching foods: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get food by ID
   */
  static async getFoodById(req, res, next) {
    try {
      const { id } = req.params;
      const food = await foodService.getFoodById(id);

      if (!food) {
        return apiResponse.notFound(res, 'Food not found');
      }

      return apiResponse.success(res, food, 'Food retrieved successfully');
    } catch (error) {
      logger.error(`Error fetching food by ID: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get foods by category
   */
  static async getFoodsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        sortBy: req.query.sortBy || 'name',
        sortDir: req.query.sortDir || 'asc'
      };

      const result = await foodService.getFoodsByCategory(category, options);

      return apiResponse.success(res, result.data, 'Foods retrieved successfully', 200, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error fetching foods by category: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get foods by locale
   */
  static async getFoodsByLocale(req, res, next) {
    try {
      const { localeId } = req.params;
      const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        sortBy: req.query.sortBy || 'name',
        sortDir: req.query.sortDir || 'asc'
      };

      const result = await foodService.getFoodsByLocale(localeId, options);

      return apiResponse.success(res, result.data, 'Foods retrieved successfully', 200, {
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error fetching foods by locale: ${error.message}`);
      next(error);
    }
  }

  /**
   * Create new food (admin only)
   */
  static async createFood(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationError(res, errors.array());
      }

      const foodData = req.body;
      const newFood = await foodService.createFood(foodData);

      logger.info(`New food created: ${newFood.name}`);
      return apiResponse.success(res, newFood, 'Food created successfully', 201);
    } catch (error) {
      logger.error(`Error creating food: ${error.message}`);
      next(error);
    }
  }

  /**
   * Update food by ID (admin only)
   */
  static async updateFood(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.validationError(res, errors.array());
      }

      const { id } = req.params;
      const foodData = req.body;

      const updatedFood = await foodService.updateFood(id, foodData);

      if (!updatedFood) {
        return apiResponse.notFound(res, 'Food not found');
      }

      logger.info(`Food updated: ${id}`);
      return apiResponse.success(res, updatedFood, 'Food updated successfully');
    } catch (error) {
      logger.error(`Error updating food: ${error.message}`);
      next(error);
    }
  }

  /**
   * Delete food by ID (admin only)
   */
  static async deleteFood(req, res, next) {
    try {
      const { id } = req.params;
      const result = await foodService.deleteFood(id);

      if (!result) {
        return apiResponse.notFound(res, 'Food not found');
      }

      logger.info(`Food deleted: ${id}`);
      return apiResponse.success(res, null, 'Food deleted successfully');
    } catch (error) {
      logger.error(`Error deleting food: ${error.message}`);
      next(error);
    }
  }
}

export default FoodController;