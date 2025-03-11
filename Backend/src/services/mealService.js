import { Op } from 'sequelize';
import Meal from '../models/Meal';
import Food from '../models/Food';
import sequelize from '../config/database';

class MealService {
  async createMeal(userId, mealData) {
    const transaction = await sequelize.transaction();

    try {
      // Calculate total nutritional values
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
        log_date: mealData.log_date || new Date(),
        ...totalNutrition,
        notes: mealData.notes,
        is_template: mealData.is_template || false
      }, { transaction });

      // Create meal-food associations
      const mealFoods = foodDetails.map(food => ({
        log_id: meal.log_id,
        food_id: food.food_id,
        serving_size: food.serving_size
      }));

      await meal.addFoods(mealFoods, { transaction });

      await transaction.commit();
      return meal;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating meal: ${error.message}`);
    }
  }

  async getUserMeals(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      mealType
    } = options;

    const whereClause = { user_id: userId };

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.log_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Add meal type filter if provided
    if (mealType) {
      whereClause.meal_type = mealType;
    }

    try {
      const result = await Meal.findAndCountAll({
        where: whereClause,
        include: [{ 
          model: Food, 
          as: 'foods',
          through: { attributes: ['serving_size'] }
        }],
        order: [['log_date', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return {
        meals: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      throw new Error(`Error fetching meals: ${error.message}`);
    }
  }

  async updateMeal(mealId, userId, mealData) {
    const transaction = await sequelize.transaction();

    try {
      const meal = await Meal.findOne({
        where: { log_id: mealId, user_id: userId }
      });

      if (!meal) {
        throw new Error('Meal not found');
      }

      // If foods are being updated, recalculate nutritional values
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

        // Update meal with new nutritional values
        await meal.update({
          ...mealData,
          ...totalNutrition
        }, { transaction });

        // Remove existing food associations
        await meal.removeFoods(await meal.getFoods(), { transaction });

        // Create new meal-food associations
        const mealFoods = foodDetails.map(food => ({
          log_id: meal.log_id,
          food_id: food.food_id,
          serving_size: food.serving_size
        }));

        await meal.addFoods(mealFoods, { transaction });
      } else {
        // Update meal without changing foods
        await meal.update(mealData, { transaction });
      }

      await transaction.commit();
      return meal;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error updating meal: ${error.message}`);
    }
  }

  async deleteMeal(mealId, userId) {
    try {
      const result = await Meal.destroy({
        where: { 
          log_id: mealId, 
          user_id: userId 
        }
      });

      if (result === 0) {
        throw new Error('Meal not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting meal: ${error.message}`);
    }
  }
}

export default new MealService();