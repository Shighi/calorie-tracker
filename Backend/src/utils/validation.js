import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const validate = (method) => {
  switch (method) {
    case 'createUser':
      return [
        body('username')
          .trim()
          .isLength({ min: 3 })
          .withMessage('Username must be at least 3 characters long')
          .isAlphanumeric()
          .withMessage('Username must contain only letters and numbers'),

        body('email')
          .trim()
          .isEmail()
          .withMessage('Invalid email address')
          .normalizeEmail(),

        body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters long')
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
          .withMessage('Password must include uppercase, lowercase, number, and special character')
      ];

    case 'createFood':
      return [
        body('name')
          .trim()
          .isLength({ min: 2 })
          .withMessage('Food name must be at least 2 characters'),

        body('calories')
          .isFloat({ min: 0 })
          .withMessage('Calories must be a positive number'),

        body('proteins')
          .isFloat({ min: 0 })
          .withMessage('Proteins must be a positive number'),

        body('carbs')
          .isFloat({ min: 0 })
          .withMessage('Carbs must be a positive number'),

        body('fats')
          .isFloat({ min: 0 })
          .withMessage('Fats must be a positive number')
      ];

    case 'createMeal':
      return [
        body('meal_type')
          .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
          .withMessage('Invalid meal type'),

        body('log_date')
          .isDate()
          .withMessage('Invalid date format'),

        body('foods')
          .isArray({ min: 1 })
          .withMessage('At least one food item is required')
      ];
  }
};

// Middleware to check validation results
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};