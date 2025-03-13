import express from 'express';
import foodController from '../controllers/foodController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { foodValidation, foodFilterValidation } from '../middleware/validationMiddleware.js';

const { authenticate, isAdmin } = authMiddleware;
const router = express.Router();

// Public routes
router.get('/', foodFilterValidation, foodController.getFoods);
router.get('/:id', foodController.getFoodById);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  foodValidation,
  foodController.createFood
);

router.put(
  '/:id',
  authenticate,
  isAdmin,
  foodValidation,
  foodController.updateFood
);

router.delete(
  '/:id',
  authenticate,
  isAdmin,
  foodController.deleteFood
);

// Advanced search and filtering (these methods need to be implemented in controller)
router.get('/search', foodFilterValidation, foodController.getFoods);
router.get('/category/:category', foodController.getFoodsByCategory);
router.get('/locale/:localeId', foodController.getFoodsByLocale);

export default router;