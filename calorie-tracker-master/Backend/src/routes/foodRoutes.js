/**
 * Food routes
 * @module routes/foodRoutes
 */

import express from 'express';
import foodController from '../controllers/foodController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { foodValidation, foodFilterValidation } from '../middleware/validationMiddleware.js';

const { authenticate, isAdmin } = authMiddleware;
const router = express.Router();

/**
 * @swagger
 * /api/foods/search:
 *   get:
 *     summary: Search foods with filtering
 *     tags: [Foods]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search string
 *       - in: query
 *         name: locale_id
 *         schema:
 *           type: integer
 *         description: Locale ID filter
 *     responses:
 *       200:
 *         description: List of foods matching criteria
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
// Advanced search and filtering routes must come before /:id route
router.get('/search', foodFilterValidation, foodController.getFoods);

/**
 * @swagger
 * /api/foods/categories:
 *   get:
 *     summary: Get all food categories
 *     tags: [Foods]
 *     responses:
 *       200:
 *         description: List of all food categories
 *       500:
 *         description: Server error
 */
router.get('/categories', foodController.getCategories);

/**
 * @swagger
 * /api/foods/category/{category}:
 *   get:
 *     summary: Get foods by category
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of foods in category
 *       500:
 *         description: Server error
 */
router.get('/category/:category', foodController.getFoodsByCategory);

/**
 * @swagger
 * /api/foods/locale/{localeId}:
 *   get:
 *     summary: Get foods by locale
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: localeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of foods for locale
 *       500:
 *         description: Server error
 */
router.get('/locale/:localeId', foodController.getFoodsByLocale);

/**
 * @swagger
 * /api/foods:
 *   get:
 *     summary: Get all foods with optional filtering
 *     tags: [Foods]
 *     responses:
 *       200:
 *         description: List of foods
 *       500:
 *         description: Server error
 */
// Public routes
router.get('/', foodFilterValidation, foodController.getFoods);

/**
 * @swagger
 * /api/foods/{id}:
 *   get:
 *     summary: Get food by ID
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Food details
 *       404:
 *         description: Food not found
 *       500:
 *         description: Server error
 */
router.get('/:id', foodController.getFoodById);

/**
 * @swagger
 * /api/foods:
 *   post:
 *     summary: Create new food (admin only)
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - calories
 *               - locale_id
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               calories:
 *                 type: number
 *               protein:
 *                 type: number
 *               carbs:
 *                 type: number
 *               fat:
 *                 type: number
 *               fiber:
 *                 type: number
 *               sugar:
 *                 type: number
 *               category:
 *                 type: string
 *               locale_id:
 *                 type: integer
 *               external_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Food created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  foodValidation,
  foodController.createFood
);

/**
 * @swagger
 * /api/foods/{id}:
 *   put:
 *     summary: Update food (admin only)
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               calories:
 *                 type: number
 *               protein:
 *                 type: number
 *               carbs:
 *                 type: number
 *               fat:
 *                 type: number
 *               fiber:
 *                 type: number
 *               sugar:
 *                 type: number
 *               category:
 *                 type: string
 *               locale_id:
 *                 type: integer
 *               external_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Food updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Food not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  authenticate,
  isAdmin,
  foodValidation,
  foodController.updateFood
);

/**
 * @swagger
 * /api/foods/{id}:
 *   delete:
 *     summary: Delete food (admin only)
 *     tags: [Foods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Food deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Food not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  foodController.deleteFood
);

export default router;