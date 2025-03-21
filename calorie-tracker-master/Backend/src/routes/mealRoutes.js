/**
 * Meal routes
 * @module routes/mealRoutes
 */

import express from 'express';
import mealController from '../controllers/mealController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate, { validateMealCreation, validateMealUpdate, validateMealTemplate } from '../middleware/validationMiddleware.js';

const { authenticate } = authMiddleware;
const router = express.Router();

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Get user's meal logs with pagination
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of user meals
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// All routes require authentication
router.use(authenticate);

// Get user's meal logs with pagination
router.get('/', mealController.getUserMeals);

/**
 * @swagger
 * /api/meals/templates:
 *   get:
 *     summary: Get user's meal templates
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meal templates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Routes for meal templates - these must come before the /:id routes
router.get('/templates', mealController.getMealTemplates);

/**
 * @swagger
 * /api/meals/templates:
 *   post:
 *     summary: Create meal template
 *     tags: [Meal Templates]
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
 *               - meal_time
 *             properties:
 *               name:
 *                 type: string
 *               meal_time:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                     serving_size:
 *                       type: number
 *                     serving_unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/templates',
  validateMealTemplate,
  mealController.createMealTemplate
);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   get:
 *     summary: Get meal template by ID
 *     tags: [Meal Templates]
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
 *         description: Template details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get('/templates/:id', mealController.getMealTemplateById);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   put:
 *     summary: Update meal template
 *     tags: [Meal Templates]
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
 *               meal_time:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                     serving_size:
 *                       type: number
 *                     serving_unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.put(
  '/templates/:id',
  validateMealTemplate,
  mealController.updateMealTemplate
);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   delete:
 *     summary: Delete meal template
 *     tags: [Meal Templates]
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
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.delete('/templates/:id', mealController.deleteMealTemplate);

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Get meal by ID
 *     tags: [Meals]
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
 *         description: Meal details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
// Get specific meal details
router.get('/:id', mealController.getMealById);

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Create new meal log
 *     tags: [Meals]
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
 *               - meal_time
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *               meal_time:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               date:
 *                 type: string
 *                 format: date
 *               total_calories:
 *                 type: number
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                     serving_size:
 *                       type: number
 *                     serving_unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *     responses:
 *       201:
 *         description: Meal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Create new meal log
router.post(
  '/',
  validateMealCreation,
  mealController.createMeal
);

/**
 * @swagger
 * /api/meals/{id}:
 *   put:
 *     summary: Update meal log
 *     tags: [Meals]
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
 *               meal_time:
 *                 type: string
 *                 enum: [breakfast, lunch, dinner, snack]
 *               date:
 *                 type: string
 *                 format: date
 *               total_calories:
 *                 type: number
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     food_id:
 *                       type: integer
 *                     serving_size:
 *                       type: number
 *                     serving_unit:
 *                       type: string
 *                     calories:
 *                       type: number
 *     responses:
 *       200:
 *         description: Meal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
// Update meal log
router.put(
  '/:id',
  validateMealUpdate,
  mealController.updateMeal
);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     summary: Delete meal log
 *     tags: [Meals]
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
 *         description: Meal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
// Delete meal log
router.delete('/:id', mealController.deleteMeal);

export default router;