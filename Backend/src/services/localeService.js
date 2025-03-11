import { Op } from 'sequelize';
import Locale from '../models/Locale';
import Food from '../models/Food';

class LocaleService {
  async getAllLocales(options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      search 
    } = options;

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
        attributes: ['location_id', 'country', 'region', 'language_code', 'currency_code'],
        order: [['country', 'ASC'], ['region', 'ASC']],
        limit,
        offset: (page - 1) * limit
      });

      return {
        locales: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      throw new Error(`Error fetching locales: ${error.message}`);
    }
  }

  async getLocaleById(localeId) {
    try {
      const locale = await Locale.findByPk(localeId, {
        attributes: ['location_id', 'country', 'region', 'language_code', 'currency_code']
      });

      if (!locale) {
        throw new Error('Locale not found');
      }

      return locale;
    } catch (error) {
      throw new Error(`Error fetching locale: ${error.message}`);
    }
  }

  async getFoodsByLocale(localeId, options = {}) {
    const { 
      page = 1, 
      limit = 50, 
      category,
      search 
    } = options;

    const whereClause = { location_id: localeId };

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

      return {
        foods: result.rows,
        totalCount: result.count,
        page,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      throw new Error(`Error fetching foods by locale: ${error.message}`);
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
        throw new Error('Locale already exists');
      }

      return await Locale.create(localeData);
    } catch (error) {
      throw new Error(`Error creating locale: ${error.message}`);
    }
  }

  async updateLocale(localeId, localeData) {
    try {
      const [updatedCount] = await Locale.update(localeData, {
        where: { location_id: localeId }
      });

      if (updatedCount === 0) {
        throw new Error('Locale not found');
      }

      return this.getLocaleById(localeId);
    } catch (error) {
      throw new Error(`Error updating locale: ${error.message}`);
    }
  }

  async deleteLocale(localeId) {
    try {
      const result = await Locale.destroy({
        where: { location_id: localeId }
      });

      if (result === 0) {
        throw new Error('Locale not found');
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting locale: ${error.message}`);
    }
  }

  async getLocaleFoodCategories(localeId) {
    try {
      const categories = await Food.findAll({
        where: { location_id: localeId },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
        raw: true
      });

      return categories.map(cat => cat.category).filter(Boolean);
    } catch (error) {
      throw new Error(`Error fetching food categories: ${error.message}`);
    }
  }
}

export default new LocaleService();