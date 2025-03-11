const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');

// Public routes
router.get('/', foodController.listFoods);
router.get('/:id', foodController.getFoodById);

// Protected routes (admin only)
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.isAdmin,
  validationMiddleware.validateFoodCreation,
  foodController.createFood
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isAdmin,
  validationMiddleware.validateFoodUpdate,
  foodController.updateFood
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isAdmin,
  foodController.deleteFood
);

// Advanced search and filtering
router.get('/search', foodController.searchFoods);
router.get('/category/:category', foodController.getFoodsByCategory);
router.get('/locale/:localeId', foodController.getFoodsByLocale);

module.exports = router;