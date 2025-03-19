import { Op } from 'sequelize';
import { Meal, MealFood } from '../models/Meal.js';
import Food from '../models/Food.js';
import sequelize from '../config/database.js';
import cacheService from './cacheService.js';

class MealService {
  async createMeal(userId, mealData) {
    const transaction = await sequelize.transaction();

    try {
      const { foods } = mealData;
      const foodDetails = await Promise.all(
        foods.map(async (foodItem) => {
          const food = await Food.findByPk(foodItem.food_id);
          return {
            ...foodItem,
            calories: food.calories * (foodItem.serving_size / 100),
            proteins: food.proteins * (foodItem.serving_size / 100),
            carbs: food.carbs * (foodItem.serving_size / 100),
            fats: food.fats * (foodItem.serving_size / 100)
          };
        })
      );

      // Calculate total nutritional values
      const totalNutrition = foodDetails.reduce((acc, food) => ({
        total_calories: acc.total_calories + food.calories,
        total_proteins: acc.total_proteins + food.proteins,
        total_carbs: acc.total_carbs + food.carbs,
        total_fats: acc.total_fats + food.fats
      }), {
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0
      });

      // Create meal log
      const meal = await Meal.create({
        user_id: userId,
        meal_type: mealData.meal_type,
        meal_date: mealData.log_date || new Date(),
        calories: totalNutrition.total_calories,
        notes: mealData.notes
      }, { transaction });

      // Associate foods with meal
      for (const food of foods) {
        await MealFood.create({
          meal_id: meal.meal_id,
          food_id: food.food_id,
          serving_qty: food.serving_size
        }, { transaction });
      }

      await transaction.commit();
      
      // Invalidate user meals cache
      await cacheService.deleteByPattern(`meals:user:${userId}:*`);
      // Invalidate nutrition cache for the specific date
      const mealDate = mealData.log_date ? new Date(mealData.log_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      await cacheService.delete(`nutrition:daily:${userId}:${mealDate}`);
      
      return meal;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating meal: ${error.message}`);
    }
  }

  async getUserMeals(userId, options = {}) {
    const { page = 1, limit = 20, startDate, endDate, mealType } = options;
    
    // Generate cache key based on query parameters
    const cacheKey = `meals:user:${userId}:page${page}:limit${limit}:start${startDate || ''}:end${endDate || ''}:type${mealType || ''}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const whereClause = { user_id: userId };

    if (startDate && endDate) {
      whereClause.meal_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (mealType) {
      whereClause.meal_type = mealType;
    }

    try {
      const result = await Meal.findAndCountAll({
        where: whereClause,
        include: [{
          model: Food,
          as: 'Foods',
          through: {
            model: MealFood,
            attributes: ['serving_qty']
          }
        }],
        order: [['meal_date', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      const response = {
        meals: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, response);
      
      return response;
    } catch (error) {
      throw new Error(`Error fetching meals: ${error.message}`);
    }
  }

  async getMealById(mealId, userId) {
    // Generate cache key
    const cacheKey = `meal:${mealId}:user:${userId}`;
    
    // Try to get from cache first
    const cachedMeal = await cacheService.get(cacheKey);
    if (cachedMeal) {
      return cachedMeal;
    }
    
    try {
      const meal = await Meal.findOne({
        where: { meal_id: mealId, user_id: userId },
        include: [{
          model: Food,
          as: 'Foods',
          through: {
            model: MealFood,
            attributes: ['serving_qty']
          }
        }]
      });
      
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Cache the result
      await cacheService.set(cacheKey, meal);
      
      return meal;
    } catch (error) {
      throw new Error(`Error fetching meal: ${error.message}`);
    }
  }

  async updateMeal(mealId, userId, mealData) {
    const transaction = await sequelize.transaction();

    try {
      const meal = await Meal.findOne({
        where: { meal_id: mealId, user_id: userId }
      });

      if (!meal) {
        throw new Error('Meal not found');
      }
      
      // Store original meal date for cache invalidation
      const originalMealDate = new Date(meal.meal_date).toISOString().split('T')[0];

      if (mealData.foods) {
        const foodDetails = await Promise.all(
          mealData.foods.map(async (foodItem) => {
            const food = await Food.findByPk(foodItem.food_id);
            return {
              ...foodItem,
              calories: food.calories * (foodItem.serving_size / 100),
              proteins: food.proteins * (foodItem.serving_size / 100),
              carbs: food.carbs * (foodItem.serving_size / 100),
              fats: food.fats * (foodItem.serving_size / 100)
            };
          })
        );

        const totalNutrition = foodDetails.reduce((acc, food) => ({
          total_calories: acc.total_calories + food.calories,
          total_proteins: acc.total_proteins + food.proteins,
          total_carbs: acc.total_carbs + food.carbs,
          total_fats: acc.total_fats + food.fats
        }), {
          total_calories: 0,
          total_proteins: 0,
          total_carbs: 0,
          total_fats: 0
        });

        await meal.update({
          meal_type: mealData.meal_type || meal.meal_type,
          meal_date: mealData.log_date || meal.meal_date,
          calories: totalNutrition.total_calories,
          notes: mealData.notes !== undefined ? mealData.notes : meal.notes
        }, { transaction });

        // Delete existing meal-food associations
        await MealFood.destroy({
          where: { meal_id: mealId },
          transaction
        });

        // Create new meal-food associations
        for (const food of mealData.foods) {
          await MealFood.create({
            meal_id: mealId,
            food_id: food.food_id,
            serving_qty: food.serving_size
          }, { transaction });
        }
      } else {
        await meal.update({
          meal_type: mealData.meal_type || meal.meal_type,
          meal_date: mealData.log_date || meal.meal_date,
          notes: mealData.notes !== undefined ? mealData.notes : meal.notes
        }, { transaction });
      }

      await transaction.commit();
      
      // Invalidate caches
      await cacheService.delete(`meal:${mealId}:user:${userId}`);
      await cacheService.deleteByPattern(`meals:user:${userId}:*`);
      
      // Invalidate nutrition cache for both the original and new date (if changed)
      await cacheService.delete(`nutrition:daily:${userId}:${originalMealDate}`);
      if (mealData.log_date) {
        const newMealDate = new Date(mealData.log_date).toISOString().split('T')[0];
        if (newMealDate !== originalMealDate) {
          await cacheService.delete(`nutrition:daily:${userId}:${newMealDate}`);
        }
      }
      
      return this.getMealById(mealId, userId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error updating meal: ${error.message}`);
    }
  }

  async deleteMeal(mealId, userId) {
    const transaction = await sequelize.transaction();

    try {
      // Get meal details for cache invalidation
      const meal = await Meal.findOne({
        where: { meal_id: mealId, user_id: userId }
      });
      
      if (!meal) {
        throw new Error('Meal not found');
      }
      
      const mealDate = new Date(meal.meal_date).toISOString().split('T')[0];
      
      // First delete the associated meal_foods records
      await MealFood.destroy({
        where: { meal_id: mealId },
        transaction
      });

      // Then delete the meal itself
      const result = await Meal.destroy({
        where: {
          meal_id: mealId,
          user_id: userId
        },
        transaction
      });

      if (result === 0) {
        await transaction.rollback();
        throw new Error('Meal not found');
      }

      await transaction.commit();
      
      // Invalidate caches
      await cacheService.delete(`meal:${mealId}:user:${userId}`);
      await cacheService.deleteByPattern(`meals:user:${userId}:*`);
      await cacheService.delete(`nutrition:daily:${userId}:${mealDate}`);
      
      return true;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error deleting meal: ${error.message}`);
    }
  }
  
  async getUserMealsByDate(userId, date) {
    // Generate cache key
    const cacheKey = `meals:user:${userId}:date:${date}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      const meals = await Meal.findAll({
        where: {
          user_id: userId,
          meal_date: date
        },
        include: [{
          model: Food,
          as: 'Foods',
          through: {
            model: MealFood,
            attributes: ['serving_qty']
          }
        }],
        order: [['meal_type', 'ASC']]
      });
      
      // Cache the result
      await cacheService.set(cacheKey, meals);
      
      return meals;
    } catch (error) {
      throw new Error(`Error fetching meals by date: ${error.message}`);
    }
  }
}

export default new MealService();