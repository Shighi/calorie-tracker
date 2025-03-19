import express from 'express';
import NutritionController from '../controllers/nutritionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const { authenticate } = authMiddleware;
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