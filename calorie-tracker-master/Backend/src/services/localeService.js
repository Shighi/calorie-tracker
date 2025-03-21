import { Op, fn, col } from 'sequelize';
import Locale from '../models/Locale.js';
import Food from '../models/Food.js';
import cacheService from './cacheService.js';
import { ApiError } from '../utils/apiResponse.js';

class LocaleService {
  async getAllLocales(options = {}) {
    const { page = 1, limit = 50, search } = options;

    // Generate cache key based on options
    const cacheKey = `locales:all:${search || 'all'}:page${page}:limit${limit}`;

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { country: { [Op.iLike]: `%${search}%` } },
        { region: { [Op.iLike]: `%${search}%` } }
      ];
    }

    try {
      const result = await Locale.findAndCountAll({
        where: whereClause,
        attributes: ['locale_id', 'country', 'region', 'language_code', 'currency_code'],
        order: [['country', 'ASC'], ['region', 'ASC']],
        limit,
        offset: (page - 1) * limit
      });

      const localesResult = {
        locales: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, localesResult, 3600);

      return localesResult;
    } catch (error) {
      throw new ApiError(`Error fetching locales: ${error.message}`, 500);
    }
  }

  async getLocaleById(localeId) {
    // Generate cache key
    const cacheKey = `locale:${localeId}`;

    // Try to get from cache first
    const cachedLocale = await cacheService.get(cacheKey);
    if (cachedLocale) {
      return cachedLocale;
    }

    try {
      const locale = await Locale.findByPk(localeId, {
        attributes: ['locale_id', 'country', 'region', 'language_code', 'currency_code']
      });

      if (!locale) {
        throw new ApiError('Locale not found', 404);
      }

      // Cache the result for 1 day
      await cacheService.set(cacheKey, locale, 86400);

      return locale;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error fetching locale: ${error.message}`, 500);
    }
  }

  async getFoodsByLocale(localeId, options = {}) {
    const { page = 1, limit = 50, category, search } = options;

    // Generate cache key based on localeId and options
    const cacheKey = `locale:${localeId}:foods:${category || 'all'}:${search || 'all'}:page${page}:limit${limit}`;

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const whereClause = { locale_id: localeId };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    try {
      const result = await Food.findAndCountAll({
        where: whereClause,
        include: [{
          model: Locale,
          as: 'locale',
          attributes: ['country', 'region']
        }],
        order: [['name', 'ASC']],
        limit,
        offset: (page - 1) * limit
      });

      const foodsResult = {
        foods: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };

      // Cache the result for 1 hour
      await cacheService.set(cacheKey, foodsResult, 3600);

      return foodsResult;
    } catch (error) {
      throw new ApiError(`Error fetching foods by locale: ${error.message}`, 500);
    }
  }

  async createLocale(localeData) {
    try {
      const existingLocale = await Locale.findOne({
        where: {
          country: localeData.country,
          region: localeData.region
        }
      });

      if (existingLocale) {
        throw new ApiError('Locale already exists', 400);
      }

      const newLocale = await Locale.create(localeData);

      // Invalidate locales list cache
      await cacheService.deleteByPattern('locales:all:*');

      return newLocale;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error creating locale: ${error.message}`, 500);
    }
  }

  async updateLocale(localeId, localeData) {
    try {
      const [updatedCount] = await Locale.update(localeData, {
        where: { locale_id: localeId }
      });

      if (updatedCount === 0) {
        throw new ApiError('Locale not found', 404);
      }

      // Invalidate caches
      await cacheService.delete(`locale:${localeId}`);
      await cacheService.deleteByPattern(`locale:${localeId}:*`);
      await cacheService.deleteByPattern('locales:all:*');

      return this.getLocaleById(localeId);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error updating locale: ${error.message}`, 500);
    }
  }

  async deleteLocale(localeId) {
    try {
      const result = await Locale.destroy({
        where: { locale_id: localeId }
      });

      if (result === 0) {
        throw new ApiError('Locale not found', 404);
      }

      // Invalidate caches
      await cacheService.delete(`locale:${localeId}`);
      await cacheService.deleteByPattern(`locale:${localeId}:*`);
      await cacheService.deleteByPattern('locales:all:*');

      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Error deleting locale: ${error.message}`, 500);
    }
  }

  async getLocaleFoodCategories(localeId) {
    // Generate cache key
    const cacheKey = `locale:${localeId}:categories`;

    // Try to get from cache first
    const cachedCategories = await cacheService.get(cacheKey);
    if (cachedCategories) {
      return cachedCategories;
    }

    try {
      const categories = await Food.findAll({
        where: { locale_id: localeId },
        attributes: [[fn('DISTINCT', col('category')), 'category']],
        raw: true
      });

      const categoriesList = categories.map(cat => cat.category).filter(Boolean);

      // Cache the result for 6 hours
      await cacheService.set(cacheKey, categoriesList, 21600);

      return categoriesList;
    } catch (error) {
      throw new ApiError(`Error fetching food categories: ${error.message}`, 500);
    }
  }
}

export default new LocaleService();