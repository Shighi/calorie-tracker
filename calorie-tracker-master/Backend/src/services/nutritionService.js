// services/nutritionService.js
import { Op, fn, col } from 'sequelize';
import { Meal } from '../models/Meal.js';
import { User } from '../models/User.js';
import sequelize from '../config/database.js';
import cacheService from './cacheService.js';

class NutritionService {
  async getDailyNutrition(userId, date) {
    // Normalize date for consistent cache keys
    const normalizedDate = date || new Date().toISOString().split('T')[0];
    
    // Generate cache key
    const cacheKey = `nutrition:daily:${userId}:${normalizedDate}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      const dailyMeals = await Meal.findAll({
        where: {
          user_id: userId,
          meal_date: normalizedDate
        }
      });

      const dailyNutrition = dailyMeals.reduce((acc, meal) => ({
        total_calories: acc.total_calories + (meal.calories || 0)
      }), {
        total_calories: 0
      });

      const userProfile = await User.findOne({
        where: { id: userId },
        include: ['profile']
      });

      const result = {
        ...dailyNutrition,
        daily_goal: userProfile?.profile?.dailyCalorieGoal || null
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new Error(`Error fetching daily nutrition: ${error.message}`);
    }
  }
  
  async getWeeklyNutritionSummary(userId, startDate, endDate) {
    // Generate cache key based on date range
    const cacheKey = `nutrition:weekly:${userId}:${startDate}:${endDate}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      const weeklyMeals = await Meal.findAll({
        where: {
          user_id: userId,
          meal_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [fn('date', col('meal_date')), 'date'],
          [fn('sum', col('calories')), 'total_calories']
        ],
        group: [fn('date', col('meal_date'))],
        order: [[col('date'), 'ASC']]
      });
      
      const userProfile = await User.findOne({
        where: { id: userId },
        include: ['profile']
      });
      
      const dailyGoal = userProfile?.profile?.dailyCalorieGoal || null;
      
      const result = {
        summary: weeklyMeals,
        daily_goal: dailyGoal
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result);
      
      return result;
    } catch (error) {
      throw new Error(`Error fetching weekly nutrition: ${error.message}`);
    }
  }
  
  async invalidateUserNutritionCache(userId, date) {
    try {
      // Invalidate daily nutrition cache for the specific date
      if (date) {
        const normalizedDate = new Date(date).toISOString().split('T')[0];
        await cacheService.delete(`nutrition:daily:${userId}:${normalizedDate}`);
      } else {
        // If no specific date, invalidate all nutrition caches for this user
        await cacheService.deleteByPattern(`nutrition:daily:${userId}:*`);
        await cacheService.deleteByPattern(`nutrition:weekly:${userId}:*`);
      }
      return true;
    } catch (error) {
      console.error(`Error invalidating nutrition cache: ${error.message}`);
      return false;
    }
  }
}

export default new NutritionService();