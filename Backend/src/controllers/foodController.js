/**
 * Food management controller
 * @module controllers/foodController
 */

const { validationResult } = require('express-validator');
const foodService = require('../services/foodService');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Get all foods with filtering, sorting, and pagination
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with foods list or error
 */
exports.getFoods = async (req, res, next) => {
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
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
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
};

/**
 * Get food by ID
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with food data or error
 */
exports.getFoodById = async (req, res, next) => {
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
};

/**
 * Create new food (admin only)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with created food data or error
 */
exports.createFood = async (req, res, next) => {
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
};

/**
 * Update food by ID (admin only)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with updated food data or error
 */
exports.updateFood = async (req, res, next) => {
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
};

/**
 * Delete food by ID (admin only)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} API response with success message or error
 */
exports.deleteFood = async (req, res, next) => {
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
};