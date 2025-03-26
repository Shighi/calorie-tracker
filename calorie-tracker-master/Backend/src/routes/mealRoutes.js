/**
 * Meal routes
 * @module routes/mealRoutes
 */

import express from 'express';
import mealController from '../controllers/mealController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { 
  validateMealCreation, 
  validateMealUpdate, 
  validateMealTemplate 
} from '../middleware/validationMiddleware.js';

const { authenticate } = authMiddleware;
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Meals
 *     description: Meal management endpoints
 *   - name: Meal Templates
 *     description: Meal template management endpoints
 */

// All routes require authentication
router.use(authenticate);

// ======= MEAL TEMPLATE ROUTES =======
/**
 * @swagger
 * /api/meals/templates:
 *   get:
 *     summary: Retrieve meal templates
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of templates per page
 *     responses:
 *       200:
 *         description: Successfully retrieved meal templates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templates', mealController.getMealTemplates);

/**
 * @swagger
 * /api/meals/templates:
 *   post:
 *     summary: Create a new meal template
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               meal_type:
 *                 type: string
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Meal template created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/templates', validateMealTemplate, mealController.createMealTemplate);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   get:
 *     summary: Retrieve a specific meal template by ID
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal template ID
 *     responses:
 *       200:
 *         description: Successfully retrieved meal template
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal template not found
 *       500:
 *         description: Server error
 */
router.get('/templates/:id', mealController.getMealTemplateById);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   put:
 *     summary: Update an existing meal template
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               meal_type:
 *                 type: string
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Meal template updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal template not found
 *       500:
 *         description: Server error
 */
router.put('/templates/:id', validateMealTemplate, mealController.updateMealTemplate);

/**
 * @swagger
 * /api/meals/templates/{id}:
 *   delete:
 *     summary: Delete a meal template
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal template ID
 *     responses:
 *       204:
 *         description: Meal template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal template not found
 *       500:
 *         description: Server error
 */
router.delete('/templates/:id', mealController.deleteMealTemplate);

/**
 * @swagger
 * /api/meals/fromTemplate/{templateId}:
 *   post:
 *     summary: Create a meal from a template
 *     tags: [Meal Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal template ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               meal_date:
 *                 type: string
 *                 format: date
 *               meal_time:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meal created from template successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal template not found
 *       500:
 *         description: Server error
 */
router.post('/fromTemplate/:templateId', mealController.createMealFromTemplate);

// ======= MEAL ROUTES =======
/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Retrieve user's meals
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of meals per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for meal filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for meal filter
 *       - in: query
 *         name: mealType
 *         schema:
 *           type: string
 *         description: Filter by meal type
 *     responses:
 *       200:
 *         description: Successfully retrieved meals
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', mealController.getUserMeals);

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Create a new meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               meal_type:
 *                 type: string
 *               meal_date:
 *                 type: string
 *                 format: date
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Meal logged successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', validateMealCreation, mealController.createMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Retrieve a specific meal by ID
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Successfully retrieved meal
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
router.get('/:id', mealController.getMealById);

/**
 * @swagger
 * /api/meals/{id}:
 *   put:
 *     summary: Update an existing meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               meal_type:
 *                 type: string
 *               meal_date:
 *                 type: string
 *                 format: date
 *               foods:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Meal updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
router.put('/:id', validateMealUpdate, mealController.updateMeal);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     summary: Delete a meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal ID
 *     responses:
 *       204:
 *         description: Meal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', mealController.deleteMeal);

/**
 * @swagger
 * /api/meals/{mealId}/foods/{foodId}:
 *   delete:
 *     summary: Remove a specific food from a meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Meal ID
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Food ID to remove
 *     responses:
 *       204:
 *         description: Food removed from meal successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Food not found in meal
 *       500:
 *         description: Server error
 */
router.delete('/:mealId/foods/:foodId', mealController.removeFoodFromMeal);

export default router;