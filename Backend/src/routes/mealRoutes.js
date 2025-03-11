const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get user's meal logs with pagination
router.get('/', mealController.listMeals);

// Get specific meal details
router.get('/:id', mealController.getMealById);

// Create new meal log
router.post(
  '/',
  validationMiddleware.validateMealCreation,
  mealController.createMeal
);

// Update meal log
router.put(
  '/:id',
  validationMiddleware.validateMealUpdate,
  mealController.updateMeal
);

// Delete meal log
router.delete('/:id', mealController.deleteMeal);

// Routes for meal templates
router.get('/templates', mealController.listMealTemplates);
router.post(
  '/templates',
  validationMiddleware.validateMealTemplate,
  mealController.createMealTemplate
);
router.get('/templates/:id', mealController.getMealTemplateById);
router.put(
  '/templates/:id',
  validationMiddleware.validateMealTemplate,
  mealController.updateMealTemplate
);
router.delete('/templates/:id', mealController.deleteMealTemplate);

module.exports = router;