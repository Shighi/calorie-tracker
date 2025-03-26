import { Op, DataTypes } from 'sequelize';
import { Meal, MealFood } from '../models/Meal.js';
import { MealTemplate, TemplateFood } from '../models/MealTemplate.js';
import Food from '../models/Food.js';
import sequelize from '../config/database.js';
import cacheService from './cacheService.js';

class MealService {
  async removeFoodFromMeal(mealId, foodId, userId) {
    const transaction = await sequelize.transaction();

    try {
      // Find the meal to ensure it belongs to the user
      const meal = await Meal.findOne({
        where: { meal_id: mealId, user_id: userId },
        include: [
          {
            model: Food,
            through: {
              attributes: ['id', 'serving_qty', 'serving_unit', 'calories']
            },
            as: 'foods'
          }
        ]
      });

      if (!meal) {
        await transaction.rollback();
        throw new Error('Meal not found');
      }

      // Check if the food is actually in the meal
      const mealFood = await MealFood.findOne({
        where: { 
          meal_id: mealId, 
          food_id: foodId 
        }
      });

      if (!mealFood) {
        await transaction.rollback();
        throw new Error('Food not found in this meal');
      }

      // Remove the specific food from the meal
      const deleted = await MealFood.destroy({
        where: { 
          meal_id: mealId, 
          food_id: foodId 
        },
        transaction
      });

      // Recalculate total nutrition
      const remainingFoods = await MealFood.findAll({
        where: { meal_id: mealId },
        include: [{ model: Food }]
      });

      const totalNutrition = remainingFoods.reduce((acc, mealFoodItem) => {
        const food = mealFoodItem.Food;
        const servingMultiplier = (mealFoodItem.serving_qty || mealFoodItem.serving_size) / 100;
        
        return {
          total_calories: acc.total_calories + (food.calories * servingMultiplier),
          total_proteins: acc.total_proteins + (food.proteins * servingMultiplier),
          total_carbs: acc.total_carbs + (food.carbs * servingMultiplier),
          total_fats: acc.total_fats + (food.fats * servingMultiplier)
        };
      }, {
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0
      });

      // Update meal's total calories
      await meal.update({
        total_calories: totalNutrition.total_calories
      }, { transaction });

      await transaction.commit();
      
      // Invalidate caches
      await cacheService.delete(`meal:${mealId}:user:${userId}`);
      await cacheService.deleteByPattern(`meals:user:${userId}:*`);
      
      // Invalidate nutrition cache for the meal's date
      const mealDate = new Date(meal.meal_date).toISOString().split('T')[0];
      await cacheService.delete(`nutrition:daily:${userId}:${mealDate}`);

      return true;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error removing food from meal: ${error.message}`);
    }
  }

  async createMeal(userId, mealData) {
    const transaction = await sequelize.transaction();

    try {
      const { foods, type, log_date, name, meal_time, notes } = mealData;

      // Validate meal type 
const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']; 
const mealType = validMealTypes.includes(type.toLowerCase()) 
  ? type.toLowerCase() 
  : 'lunch'; // Default to lunch if invalid

      // Calculate nutritional values if foods are provided
      let totalNutrition = {
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0
      };

      if (foods && foods.length > 0) {
        const foodDetails = await Promise.all(
          foods.map(async (foodItem) => {
            const food = await Food.findByPk(foodItem.food_id);
            return {
              ...foodItem,
              calories: food.calories * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              proteins: food.proteins * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              carbs: food.carbs * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              fats: food.fats * ((foodItem.serving_qty || foodItem.serving_size) / 100)
            };
          })
        );

        totalNutrition = foodDetails.reduce((acc, food) => ({
          total_calories: acc.total_calories + food.calories,
          total_proteins: acc.total_proteins + food.proteins,
          total_carbs: acc.total_carbs + food.carbs,
          total_fats: acc.total_fats + food.fats
        }), totalNutrition);
      }

      // Create meal with validated meal type
      const meal = await Meal.create({
        user_id: userId,
        meal_type: mealType, // Use validated meal type
        meal_date: log_date || new Date(),
        total_calories: totalNutrition.total_calories,
        name: name || 'Unnamed Meal',
        meal_time: meal_time || null,
        notes: notes || null
      }, { transaction });

      // Associate foods with meal if provided
      if (foods && foods.length > 0) {
        for (const food of foods) {
          await MealFood.create({
            meal_id: meal.meal_id,
            food_id: food.food_id,
            serving_qty: food.serving_qty || food.serving_size,
            serving_unit: food.serving_unit || 'g',
            calories: food.calories
          }, { transaction });
        }
      }

      await transaction.commit();

      // Invalidate nutrition cache
      const mealDate = new Date(meal.meal_date).toISOString().split('T')[0];
      await cacheService.delete(`nutrition:daily:${userId}:${mealDate}`);
      await cacheService.deleteByPattern(`meals:user:${userId}:*`);

      return this.getMealById(meal.meal_id, userId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating meal: ${error.message}`);
    }
  }

  async getUserMeals(userId, options = {}) {
    const { page = 1, limit = 10, startDate, endDate, mealType } = options;
    const offset = (page - 1) * limit;
    
    try {
      // Check cache first
      const cacheKey = `meals:user:${userId}:${startDate || 'all'}:${endDate || 'all'}:${mealType || 'all'}:${page}:${limit}`;
      const cachedMeals = await cacheService.get(cacheKey);
      
      if (cachedMeals) {
        return JSON.parse(cachedMeals);
      }
      
      // Build where clause
      const whereClause = { user_id: userId };
      
      // Add date range filters if provided
      if (startDate || endDate) {
        whereClause.meal_date = {};
        
        if (startDate) {
          whereClause.meal_date[Op.gte] = new Date(startDate);
        }
        
        if (endDate) {
          // Set endDate to the end of the day
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          whereClause.meal_date[Op.lte] = endDateTime;
        }
      }
      
      // Add meal type filter if provided
      if (mealType) {
        whereClause.meal_type = {
          [Op.iLike]: mealType.toLowerCase() // Case-insensitive comparison
        };
      }
      
      // Fetch meals with pagination
      const { count, rows: meals } = await Meal.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Food,
            through: {
              attributes: ['id', 'serving_qty', 'serving_unit', 'calories'] // Added 'id'
            },
            as: 'foods'
          }
        ],
        limit,
        offset,
        order: [['meal_date', 'DESC']]
      });
      
      const result = {
        meals,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
      
      // Cache results
      await cacheService.set(cacheKey, JSON.stringify(result), 3600); // Cache for 1 hour
      
      return result;
    } catch (error) {
      throw new Error(`Error fetching user meals: ${error.message}`);
    }
  }

  async getMealById(mealId, userId) {
    try {
      // Check cache first
      const cacheKey = `meal:${mealId}:user:${userId}`;
      const cachedMeal = await cacheService.get(cacheKey);
      
      if (cachedMeal) {
        return JSON.parse(cachedMeal);
      }
      
      const meal = await Meal.findOne({
        where: {
          meal_id: mealId,
          user_id: userId
        },
        include: [
          {
            model: Food,
            through: {
              attributes: ['id', 'serving_qty', 'serving_unit', 'calories'] // Added 'id'
            },
            as: 'foods'
          }
        ]
      });
      
      if (!meal) {
        return null;
      }
      
      // Cache the result
      await cacheService.set(cacheKey, JSON.stringify(meal), 3600); // Cache for 1 hour
      
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

      // Validate meal type 
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']; 
      const mealType = validMealTypes.includes(mealData.type) ? mealData.type : 'lunch'; // Default to lunch if invalid

      if (mealData.foods) {
        const foodDetails = await Promise.all(
          mealData.foods.map(async (foodItem) => {
            const food = await Food.findByPk(foodItem.food_id);
            return {
              ...foodItem,
              calories: food.calories * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              proteins: food.proteins * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              carbs: food.carbs * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              fats: food.fats * ((foodItem.serving_qty || foodItem.serving_size) / 100)
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
          meal_type: mealType, // Use validated meal type
          meal_date: mealData.log_date || meal.meal_date,
          total_calories: totalNutrition.total_calories,
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
            serving_qty: food.serving_qty || food.serving_size,
            serving_size: food.serving_size || food.serving_qty,
            serving_unit: food.serving_unit || 'g',
            calories: food.calories
          }, { transaction });
        }
      } else {
        await meal.update({
          meal_type: mealType, // Use validated meal type
          meal_date: mealData.log_date || meal.meal_date,
          name: mealData.name !== undefined ? mealData.name : meal.name,
          meal_time: mealData.meal_time !== undefined ? mealData.meal_time : meal.meal_time,
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

  async createMealTemplate(userId, templateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { foods, name, type } = templateData;
      
      // Validate meal type 
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']; 
      const mealType = validMealTypes.includes(type) ? type : 'lunch'; // Default to lunch if invalid
      
      // Calculate nutritional values if foods are provided
      let totalNutrition = {
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0
      };
      
      if (foods && foods.length > 0) {
        const foodDetails = await Promise.all(
          foods.map(async (foodItem) => {
            const food = await Food.findByPk(foodItem.food_id);
            return {
              ...foodItem,
              calories: food.calories * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              proteins: food.proteins * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              carbs: food.carbs * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              fats: food.fats * ((foodItem.serving_qty || foodItem.serving_size) / 100)
            };
          })
        );
        
        totalNutrition = foodDetails.reduce((acc, food) => ({
          total_calories: acc.total_calories + food.calories,
          total_proteins: acc.total_proteins + food.proteins,
          total_carbs: acc.total_carbs + food.carbs,
          total_fats: acc.total_fats + food.fats
        }), totalNutrition);
      }
      
      // Create meal template with validated meal type
      const template = await MealTemplate.create({
        user_id: userId,
        name: name || 'Unnamed Template',
        meal_type: mealType,
        total_calories: totalNutrition.total_calories,
        meal_time: templateData.meal_time || null,
        notes: templateData.notes || null
      }, { transaction });
      
      // Associate foods with template if provided
      if (foods && foods.length > 0) {
        for (const food of foods) {
          await TemplateFood.create({
            template_id: template.template_id,
            food_id: food.food_id,
            serving_qty: food.serving_qty || food.serving_size,
            serving_unit: food.serving_unit || 'g',
            calories: food.calories
          }, { transaction });
        }
      }
      
      await transaction.commit();
      return template;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating meal template: ${error.message}`);
    }
  }

  async updateMealTemplate(templateId, userId, templateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const template = await MealTemplate.findOne({
        where: { template_id: templateId, user_id: userId }
      });
      
      if (!template) {
        await transaction.rollback();
        return null;
      }
      
      // Validate meal type 
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']; 
      const mealType = validMealTypes.includes(templateData.type) ? templateData.type : 'lunch'; // Default to lunch if invalid
      
      if (templateData.foods) {
        const foodDetails = await Promise.all(
          templateData.foods.map(async (foodItem) => {
            const food = await Food.findByPk(foodItem.food_id);
            return {
              ...foodItem,
              calories: food.calories * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              proteins: food.proteins * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              carbs: food.carbs * ((foodItem.serving_qty || foodItem.serving_size) / 100),
              fats: food.fats * ((foodItem.serving_qty || foodItem.serving_size) / 100)
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
        
        await template.update({
          name: templateData.name !== undefined ? templateData.name : template.name,
          meal_type: mealType, // Use validated meal type
          total_calories: totalNutrition.total_calories,
          meal_time: templateData.meal_time !== undefined ? templateData.meal_time : template.meal_time,
          notes: templateData.notes !== undefined ? templateData.notes : template.notes
        }, { transaction });
        
        // Delete existing template-food associations
        await TemplateFood.destroy({
          where: { template_id: templateId },
          transaction
        });
        
        // Create new template-food associations
        for (const food of templateData.foods) {
          await TemplateFood.create({
            template_id: templateId,
            food_id: food.food_id,
            serving_qty: food.serving_qty || food.serving_size,
            serving_unit: food.serving_unit || 'g',
            calories: food.calories
          }, { transaction });
        }
      } else {
        await template.update({
          name: templateData.name !== undefined ? templateData.name : template.name,
          meal_type: mealType, // Use validated meal type
          meal_time: templateData.meal_time !== undefined ? templateData.meal_time : template.meal_time,
          notes: templateData.notes !== undefined ? templateData.notes : template.notes
        }, { transaction });
      }
      
      await transaction.commit();
      return this.getMealTemplateById(templateId, userId);
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error updating meal template: ${error.message}`);
    }
  }

  async deleteMealTemplate(templateId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Delete associated template foods first
      await TemplateFood.destroy({
        where: { template_id: templateId },
        transaction
      });
      
      // Delete the template
      const deleted = await MealTemplate.destroy({
        where: {
          template_id: templateId,
          user_id: userId
        },
        transaction
      });
      
      await transaction.commit();
      return deleted > 0;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error deleting meal template: ${error.message}`);
    }
  }

  async createMealFromTemplate(templateId, userId, additionalData = {}) {
    const transaction = await sequelize.transaction();

    try {
      // First get the template
      const template = await MealTemplate.findOne({
        where: { template_id: templateId, user_id: userId },
        include: [
          {
            model: Food,
            through: {
              attributes: ['serving_qty', 'serving_unit']
            },
            as: 'foods'
          }
        ]
      });

      if (!template) {
        throw new Error('Meal template not found');
      }

      // Prepare meal data from template
      const mealData = {
        name: template.name,
        type: template.meal_type, // Use the template's existing meal type
        log_date: additionalData.meal_date || new Date(),
        meal_time: additionalData.meal_time || template.meal_time,
        notes: additionalData.notes || template.notes,
        foods: template.foods.map(food => ({
          food_id: food.id,
          serving_qty: food.TemplateFood.serving_qty,
          serving_unit: food.TemplateFood.serving_unit
        }))
      };

      // Create meal using the template data
      const meal = await this.createMeal(userId, mealData);
      
      return meal;
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error creating meal from template: ${error.message}`);
    }
  }
}

export default new MealService();