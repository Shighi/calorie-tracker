import express from 'express';
import NutritionController from '../controllers/nutritionController';
import { authenticate } from '../middleware/authMiddleware';
import { apiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply authentication and rate limiting to all nutrition routes
router.use(authenticate);
router.use(apiLimiter);

// Daily nutrition endpoint
router.get('/daily', NutritionController.getDailyNutrition);

// Weekly nutrition endpoint
router.get('/weekly', NutritionController.getWeeklyNutrition);

// Monthly nutrition endpoint
router.get('/monthly', NutritionController.getMonthlyNutrition);

export default router;