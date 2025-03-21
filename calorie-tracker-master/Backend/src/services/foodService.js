import { Op } from 'sequelize';
import Food from '../models/Food.js';
import cacheService from './cacheService.js';

class FoodService {
  async createFood(foodData, userId) {
    try {
      // Check if food already exists with the same name for this user
      const existingFood = await Food.findOne({
        where: {
          name: foodData.name,
          [Op.or]: [
            { user_id: userId },
            { is_public: true }
          ]
        }
      });

      if (existingFood) {
        return existingFood;
      }

      // Include new fields
      const food = await Food.create({
        ...foodData,
        user_id: userId,
        description: foodData.description || null,
        external_id: foodData.external_id || null
      });

      // Invalidate cache
      await cacheService.deleteByPattern(`foods:user:${userId}:*`);

      return food;
    } catch (error) {
      throw new Error(`Error creating food: ${error.message}`);
    }
  }

  async getUserFoods(userId, options = {}) {
    const { page = 1, limit = 20, query = '', category = '', sort = 'name', order = 'ASC' } = options;

    // Generate cache key
    const cacheKey = `foods:user:${userId || 'public'}:page${page}:limit${limit}:query${query}:category${category}:sort${sort}:order${order}`;

    // Try to get from cache
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const whereClause = {};

      if (userId) {
        whereClause[Op.or] = [
          { user_id: userId },
          { is_public: true }
        ];
      } else {
        whereClause.is_public = true;
      }

      if (query) {
        whereClause.name = {
          [Op.iLike]: `%${query}%`
        };
      }

      if (category) {
        whereClause.category = category;
      }

      const result = await Food.findAndCountAll({
        where: whereClause,
        order: [[sort, order]],
        limit,
        offset: (page - 1) * limit
      });

      const response = {
        foods: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };

      // Cache the result
      await cacheService.set(cacheKey, response);

      return response;
    } catch (error) {
      throw new Error(`Error fetching foods: ${error.message}`);
    }
  }

  async getFoodById(foodId, userId) {
    // Generate cache key
    const cacheKey = `food:${foodId}:user:${userId || 'public'}`;

    // Try to get from cache
    const cachedFood = await cacheService.get(cacheKey);
    if (cachedFood) {
      return cachedFood;
    }

    try {
      const whereClause = {
        id: foodId // Changed from food_id to id
      };

      if (userId) {
        whereClause[Op.or] = [
          { user_id: userId },
          { is_public: true }
        ];
      } else {
        whereClause.is_public = true;
      }

      const food = await Food.findOne({
        where: whereClause
      });

      if (!food) {
        throw new Error('Food not found');
      }

      // Cache the result
      await cacheService.set(cacheKey, food);

      return food;
    } catch (error) {
      throw new Error(`Error fetching food: ${error.message}`);
    }
  }

  async getFoodsByLocale(localeId, options = {}) {
    const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = options;

    // Generate cache key
    const cacheKey = `foods:locale:${localeId}:page${page}:limit${limit}:sort${sort}:order${order}`;

    // Try to get from cache
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const result = await Food.findAndCountAll({
        where: {
          locale_id: localeId,
          is_public: true
        },
        order: [[sort, order]],
        limit,
        offset: (page - 1) * limit
      });

      const response = {
        foods: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };

      // Cache the result
      await cacheService.set(cacheKey, response);

      return response;
    } catch (error) {
      throw new Error(`Error fetching foods by locale: ${error.message}`);
    }
  }

  async updateFood(foodId, userId, foodData) {
    try {
      const food = await Food.findOne({
        where: { 
          id: foodId, // Changed from food_id to id
          user_id: userId 
        }
      });

      if (!food) {
        throw new Error('Food not found or you do not have permission to edit it');
      }

      await food.update(foodData);

      // Invalidate cache
      await cacheService.delete(`food:${foodId}:user:${userId}`);
      await cacheService.deleteByPattern(`foods:user:${userId}:*`);

      return food;
    } catch (error) {
      throw new Error(`Error updating food: ${error.message}`);
    }
  }

  async deleteFood(foodId, userId) {
    try {
      const result = await Food.destroy({
        where: {
          id: foodId, // Changed from food_id to id
          user_id: userId
        }
      });

      if (result === 0) {
        throw new Error('Food not found or you do not have permission to delete it');
      }

      // Invalidate cache
      await cacheService.delete(`food:${foodId}:user:${userId}`);
      await cacheService.deleteByPattern(`foods:user:${userId}:*`);

      return true;
    } catch (error) {
      throw new Error(`Error deleting food: ${error.message}`);
    }
  }
}

export default new FoodService();