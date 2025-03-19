import express from 'express';
import mealController from '../controllers/mealController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate, { validateMealCreation, validateMealUpdate, validateMealTemplate } from '../middleware/validationMiddleware.js';

const { authenticate } = authMiddleware;
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's meal logs with pagination
router.get('/', mealController.getUserMeals);

// Routes for meal templates - these must come before the /:id routes
router.get('/templates', mealController.getMealTemplates);
router.post(
  '/templates',
  validateMealTemplate,
  mealController.createMealTemplate
);
router.get('/templates/:id', mealController.getMealTemplateById);
router.put(
  '/templates/:id',
  validateMealTemplate,
  mealController.updateMealTemplate
);
router.delete('/templates/:id', mealController.deleteMealTemplate);

// Get specific meal details
router.get('/:id', mealController.getMealById);

// Create new meal log
router.post(
  '/',
  validateMealCreation,
  mealController.createMeal
);

// Update meal log
router.put(
  '/:id',
  validateMealUpdate,
  mealController.updateMeal
);

// Delete meal log
router.delete('/:id', mealController.deleteMeal);

export default router;