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
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
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
  body('emailOrUsername')
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
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('First name must not exceed 50 characters'),
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
 * Validation rules for user profile creation/update
 */
export const userProfileValidation = [
  body('daily_calorie_goal')
    .optional()
    .isInt({ min: 500, max: 10000 })
    .withMessage('Daily calorie goal must be between 500 and 10,000'),
  
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('Height must be between 50 and 250 cm'),
  
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),
  
  body('activity_level')
    .optional()
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
    .withMessage('Invalid activity level'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  
  body('age')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Age must be between 1 and 120'),
  
  body('target_weight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Target weight must be between 20 and 500 kg'),
  
  body('target_type')
    .optional()
    .isIn(['lose_weight', 'maintain_weight', 'gain_weight'])
    .withMessage('Invalid target type')
];

/**
 * Validation rules for food creation
 */
export const foodValidation = [
  body('name')
    .notEmpty().withMessage('Food name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Food name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('external_id')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('External ID must not exceed 100 characters'),
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
  body(['date', 'meal_date', 'log_date'])
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('type')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Meal name must not exceed 100 characters'),
  body('meal_time')
    .optional()
    .isISO8601().withMessage('Invalid meal time format')
    .toDate(),
  body('total_calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total calories must be non-negative'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('foods')
    .isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('foods.*.foodId')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.food_id')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Food quantity must be positive'),
  body('foods.*.serving_qty')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving quantity must be positive'),
  body('foods.*.serving_size')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving size must be positive'),
  body('foods.*.serving_unit')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Serving unit must not exceed 50 characters'),
  body('foods.*.calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Calories must be non-negative')
];

/**
 * Validation rules for meal update
 */
export const mealUpdateValidation = [
  body(['date', 'meal_date', 'log_date'])
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Meal name must not exceed 100 characters'),
  body('meal_time')
    .optional()
    .isISO8601().withMessage('Invalid meal time format')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('total_calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total calories must be non-negative'),
  body('foods')
    .optional()
    .isArray().withMessage('Foods must be an array'),
  body('foods.*.foodId')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.food_id')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Food quantity must be positive'),
  body('foods.*.serving_qty')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving quantity must be positive'),
  body('foods.*.serving_size')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving size must be positive'),
  body('foods.*.serving_unit')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Serving unit must not exceed 50 characters'),
  body('foods.*.calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Calories must be non-negative')
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
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_time')
    .optional()
    .isISO8601().withMessage('Invalid meal time format')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('foods')
    .isArray({ min: 1 }).withMessage('At least one food item is required'),
  body('foods.*.foodId')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.food_id')
    .optional()
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID'),
  body('foods.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Food quantity must be positive'),
  body('foods.*.serving_qty')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving quantity must be positive'),
  body('foods.*.serving_size')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Serving size must be positive'),
  body('foods.*.serving_unit')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Serving unit must not exceed 50 characters'),
  body('foods.*.calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Calories must be non-negative')
];

/**
 * Validation rules for removing a meal from template
 */
export const removeFoodFromMealValidation = [
  param('mealId')
    .notEmpty().withMessage('Meal ID is required')
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Meal ID format - must be a UUID or numeric ID'),
  param('foodId')
    .notEmpty().withMessage('Food ID is required')
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID')
];

/**
 * Validation rules for creating a meal from template
 */
export const createFromTemplateValidation = [
  body('meal_date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('log_date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  body('meal_time')
    .optional()
    .isISO8601().withMessage('Invalid meal time format')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  param('templateId')
    .notEmpty().withMessage('Template ID is required')
    .isUUID().withMessage('Invalid Template ID format')
];

/**
 * Validation rules for daily nutrition information
 */
export const dailyNutritionValidation = [
  query('date')
    .notEmpty().withMessage('Date parameter is required')
    .isISO8601().withMessage('Invalid date format')
    .toDate()
];

/**
 * Validation rules for weekly nutrition information
 */
export const weeklyNutritionValidation = [
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
 * Validation rules for monthly nutrition information
 */
export const monthlyNutritionValidation = [
  query('month')
    .notEmpty().withMessage('Month parameter is required')
    .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year')
    .notEmpty().withMessage('Year parameter is required')
    .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')
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
 * Validation rules for getting nutrients by food ID
 */
export const nutrientsByFoodIdValidation = [
  param('foodId')
    .notEmpty().withMessage('Food ID is required')
    .custom(value => {
      // Accept UUID or numeric ID
      return typeof value === 'string' && 
        (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        /^\d+$/.test(value)) || 
        typeof value === 'number';
    }).withMessage('Invalid Food ID format - must be a UUID or numeric ID')
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

// Helper validation functions
export const validateMealCreation = [...mealValidation, checkValidation];
export const validateMealUpdate = [...mealUpdateValidation, checkValidation];
export const validateMealTemplate = [...mealTemplateValidation, checkValidation];
export const validateMealFromTemplate = [...createFromTemplateValidation, checkValidation];
export const validateDailyNutrition = [...dailyNutritionValidation, checkValidation];
export const validateWeeklyNutrition = [...weeklyNutritionValidation, checkValidation];
export const validateMonthlyNutrition = [...monthlyNutritionValidation, checkValidation];
export const validateNutrientsByFoodId = [...nutrientsByFoodIdValidation, checkValidation];
export const validateLocaleCreation = [...createLocaleValidation, checkValidation];
export const validateLocaleUpdate = [...updateLocaleValidation, checkValidation];
export const validateRemoveFoodFromMeal = [...removeFoodFromMealValidation, checkValidation];


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
    case 'userProfile':
      return [...userProfileValidation, checkValidation];
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
    case 'createMealFromTemplate':
      return validateMealFromTemplate;
    case 'dailyNutrition':
      return validateDailyNutrition;
    case 'weeklyNutrition':
      return validateWeeklyNutrition;
    case 'monthlyNutrition':
      return validateMonthlyNutrition;
    case 'nutrientsByFoodId':
      return validateNutrientsByFoodId;
    case 'nutritionReport':
      return [...nutritionReportValidation, checkValidation];
    case 'createLocale':
      return validateLocaleCreation;
    case 'updateLocale':
      return validateLocaleUpdate;
    case 'removeFoodFromMeal':
      return validateRemoveFoodFromMeal;
    default:
      return [checkValidation];
  }
};

export default validate;
