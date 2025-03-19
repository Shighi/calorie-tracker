/**
 * Request validation middleware
 * @module middleware/validationMiddleware
 */

import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('email')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('username')
    .notEmpty().withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
  body('daily_calorie_target')
    .optional()
    .isInt({ min: 500, max: 10000 }).withMessage('Daily calorie target must be between 500 and 10000')
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('emailOrUsername')  // Changed from 'email' to 'emailOrUsername'
    .notEmpty().withMessage('Email or username is required')
    .trim(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for user profile update
 */
export const profileUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email')
    .optional()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Last name must not exceed 50 characters'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('daily_calorie_target')
    .optional()
    .isInt({ min: 500, max: 10000 }).withMessage('Daily calorie target must be between 500 and 10000'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value')
];

/**
 * Validation rules for food creation
 */
export const foodValidation = [
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
export const foodFilterValidation = [
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
  query(['minProtein', 'maxProtein', 'minCarbs', 'maxCarbs', 'minFat', 'maxFat', 'minCalories', 'maxCalories'])
    .optional()
    .isFloat({ min: 0 }).withMessage('Nutrient filter values must be non-negative')
];

/**
 * Validation rules for meal creation
 */
export const mealValidation = [
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
 * Validation rules for meal template
 */
export const mealTemplateValidation = [
  body('name')
    .notEmpty().withMessage('Template name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Template name must be between 2 and 100 characters'),
  body('type')
    .notEmpty().withMessage('Meal type is required')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
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
 * Validation rules for meal update
 */
export const mealUpdateValidation = [
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Meal name must not exceed 100 characters'),
  body('foods')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('foods.*.foodId')
    .optional()
    .isUUID().withMessage('Invalid Food ID format'),
  body('foods.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Food quantity must be positive')
];

/**
 * Validation rules for nutrition report date range
 */
export const nutritionReportValidation = [
  query('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format')
    .toDate(),
  query('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format')
    .toDate(),
  query('endDate').custom((value, { req }) => {
    if (new Date(value) < new Date(req.query.startDate)) {
      throw new Error('End date must be greater than or equal to start date');
    }
    return true;
  })
];

/**
 * Validation rules for locale creation
 */
export const createLocaleValidation = [
  body('name')
    .notEmpty().withMessage('Locale name is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Locale name must be between 2 and 50 characters'),
  body('code')
    .notEmpty().withMessage('Locale code is required')
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Locale code must be between 2 and 10 characters'),
  body('language')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Language must be between 2 and 50 characters'),
  body('region')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Region must be between 2 and 50 characters'),
  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value')
];

/**
 * Validation rules for locale update
 */
export const updateLocaleValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Locale name must be between 2 and 50 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage('Locale code must be between 2 and 10 characters'),
  body('language')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Language must be between 2 and 50 characters'),
  body('region')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Region must be between 2 and 50 characters'),
  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value')
];

/**
 * Helper function to validate meal creation
 */
export const validateMealCreation = [...mealValidation, checkValidation];

/**
 * Helper function to validate meal update
 */
export const validateMealUpdate = [...mealUpdateValidation, checkValidation];

/**
 * Helper function to validate meal template
 */
export const validateMealTemplate = [...mealTemplateValidation, checkValidation];

/**
 * Helper function to validate locale creation
 */
export const validateLocaleCreation = [...createLocaleValidation, checkValidation];

/**
 * Helper function to validate locale update
 */
export const validateLocaleUpdate = [...updateLocaleValidation, checkValidation];

/**
 * Validation selector function
 * Allows selection of validation schema using a string identifier
 */
const validate = (validationType) => {
  switch (validationType) {
    case 'register':
      return [...registerValidation, checkValidation];
    case 'login':
      return [...loginValidation, checkValidation];
    case 'profileUpdate':
      return [...profileUpdateValidation, checkValidation];
    case 'createFood':
      return [...foodValidation, checkValidation];
    case 'foodFilter':
      return [...foodFilterValidation, checkValidation];
    case 'createMeal':
      return validateMealCreation;
    case 'updateMeal':
      return validateMealUpdate;
    case 'createMealTemplate':
      return validateMealTemplate;
    case 'nutritionReport':
      return [...nutritionReportValidation, checkValidation];
    case 'createLocale':
      return validateLocaleCreation;
    case 'updateLocale':
      return validateLocaleUpdate;
    default:
      return [checkValidation];
  }
};

// Export the validate function as the default export
export default validate;