/**
 * Request validation middleware
 * @module middleware/validationMiddleware
 */

const { body, param, query } = require('express-validator');
const validation = require('../utils/validation');

/**
 * Validation rules for user registration
 */
exports.registerValidation = [
  body('email')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
];

/**
 * Validation rules for user login
 */
exports.loginValidation = [
  body('email')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for user profile update
 */
exports.profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50 and 250 cm'),
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg'),
  body('goal')
    .optional()
    .isIn(['lose_weight', 'maintain', 'gain_weight', 'build_muscle']).withMessage('Invalid goal'),
  body('activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']).withMessage('Invalid activity level'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate()
];

/**
 * Validation rules for food creation
 */
exports.foodValidation = [
  body('name')
    .notEmpty().withMessage('Food name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Food name must be between 2 and 100 characters'),
  body('category')
    .notEmpty().withMessage('Food category is required')
    .trim(),
  body('localeId')
    .notEmpty().withMessage('Locale ID is required')
    .isUUID().withMessage('Invalid Locale ID format'),
  body('servingSize')
    .notEmpty().withMessage('Serving size is required')
    .isFloat({ min: 0.1 }).withMessage('Serving size must be positive'),
  body('servingUnit')
    .notEmpty().withMessage('Serving unit is required')
    .trim(),
  body('nutrients')
    .isArray().withMessage('Nutrients must be an array'),
  body('nutrients.*.nutrientId')
    .notEmpty().withMessage('Nutrient ID is required')
    .isUUID().withMessage('Invalid Nutrient ID format'),
  body('nutrients.*.amount')
    .notEmpty().withMessage('Nutrient amount is required')
    .isFloat({ min: 0 }).withMessage('Nutrient amount must be non-negative')
];

/**
 * Validation rules for food filters
 */
exports.foodFilterValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['name', 'category', 'calories', 'protein', 'carbs', 'fat', 'createdAt']).withMessage('Invalid sort field'),
  query('sortDir')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc'),
  query('minProtein', 'maxProtein', 'minCarbs', 'maxCarbs', 'minFat', 'maxFat', 'minCalories', 'maxCalories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Nutrient filter values must be non-negative')
];

/**
 * Validation rules for meal creation
 */
exports.mealValidation = [
  body('date')
    .notEmpty().withMessage('Meal date is required')
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('type')
    .notEmpty().withMessage('Meal type is required')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Meal name must not exceed 100 characters'),
  body('foods')
    .isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('foods.*.foodId')
    .notEmpty().withMessage('Food ID is required')
    .isUUID().withMessage('Invalid Food ID format'),
  body('foods.*.quantity')
    .notEmpty().withMessage('Food quantity is required')
    .isFloat({ min: 0.01 }).withMessage('Food quantity must be positive')
];

/**
 * Validation rules for nutrition report date range
 */
exports.nutritionReportValidation = [
  query('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format')
    .toDate(),
  query('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format')
    .toDate(),
  validation.customValidator('endDate', (value, { req }) => {
    if (new Date(value) < new Date(req.query.startDate)) {
      throw new Error('End date must be greater than or equal to start date');
    }
    return true;
  })
];