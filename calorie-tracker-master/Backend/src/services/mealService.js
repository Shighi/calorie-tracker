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
        total_calories: totalNutrition.total_calories, // Changed from calories
        name: mealData.name || null, // New field
        meal_time: mealData.meal_time || null, // New field
        notes: mealData.notes
      }, { transaction });

      // Associate foods with meal
      for (const food of foods) {
        await MealFood.create({
          meal_id: meal.meal_id,
          food_id: food.food_id,
          serving_qty: food.serving_size,
          serving_unit: food.serving_unit || 'g', // New field
          calories: food.calories // Store the calculated calories
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
          total_calories: totalNutrition.total_calories, // Changed from calories
          name: mealData.name !== undefined ? mealData.name : meal.name,
          meal_time: mealData.meal_time !== undefined ? mealData.meal_time : meal.meal_time,
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
            serving_qty: food.serving_size,
            serving_unit: food.serving_unit || 'g', // New field
            calories: food.calories // Store the calculated calories
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
}

export default new MealService();