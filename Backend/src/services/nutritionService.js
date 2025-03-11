import { Op } from 'sequelize';
import Meal from '../models/Meal';
import User from '../models/User';

class NutritionService {
  async getDailyNutrition(userId, date) {
    try {
      const dailyMeals = await Meal.findAll({
        where: {
          user_id: userId,
          log_date: date || new Date().toISOString().split('T')[0]
        }
      });

      const dailyNutrition = dailyMeals.reduce((acc, meal) => ({
        total_calories: acc.total_calories + meal.total_calories,
        total_proteins: acc.total_proteins + meal.total_proteins,
        total_carbs: acc.total_carbs + meal.total_carbs,
        total_fats: acc.total_fats + meal.total_fats
      }), {
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0
      });

      const userProfile = await User.findOne({
        where: { user_id: userId },
        include: ['profile']
      });

      return {
        ...dailyNutrition,
        daily_goal: userProfile.profile.daily_calorie_goal || null
      };
    } catch (error) {
      throw new Error(`Error fetching daily nutrition: ${error.message}`);
    }
  }

  async getWeeklyNutrition(userId) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);

      const weeklyMeals = await Meal.findAll({
        where: {
          user_id: userId,
          log_date: {
            [Op.between]: [
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            ]
          }
        },
        group: ['log_date'],
        attributes: [
          'log_date',
          [sequelize.fn('SUM', sequelize.col('total_calories')), 'total_calories'],
          [sequelize.fn('SUM', sequelize.col('total_proteins')), 'total_proteins'],
          [sequelize.fn('SUM', sequelize.col('total_carbs')), 'total_carbs'],
          [sequelize.fn('SUM', sequelize.col('total_fats')), 'total_fats']
        ]
      });

      return {
        weekly_nutrition: weeklyMeals,
        average_daily_calories: weeklyMeals.reduce((sum, day) => sum + day.total_calories, 0) / 7
      };
    } catch (error) {
      throw new Error(`Error fetching weekly nutrition: ${error.message}`);
    }
  }

  async getMonthlyNutrition(userId) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);

      const monthlyMeals = await Meal.findAll({
        where: {
          user_id: userId,
          log_date: {
            [Op.between]: [
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            ]
          }
        },
        attributes: [
          [sequelize.fn('date_trunc', 'week', sequelize.col('log_date')), 'week'],
          [sequelize.fn('SUM', sequelize.col('total_calories')), 'total_calories'],
          [sequelize.fn('SUM', sequelize.col('total_proteins')), 'total_proteins'],
          [sequelize.fn('SUM', sequelize.col('total_carbs')), 'total_carbs'],
          [sequelize.fn('SUM', sequelize.col('total_fats')), 'total_fats']
        ],
        group: [sequelize.fn('date_trunc', 'week', sequelize.col('log_date'))]
      });

      return {
        monthly_nutrition: monthlyMeals,
        total_monthly_calories: monthlyMeals.reduce((sum, week) => sum + week.total_calories, 0)
      };
    } catch (error) {
      throw new Error(`Error fetching monthly nutrition: ${error.message}`);
    }
  }
}

export default new NutritionService();