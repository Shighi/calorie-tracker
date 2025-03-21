import LocaleService from '../services/localeService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

class LocaleController {
  async getAllLocales(req, res) {
    try {
      const locales = await LocaleService.getAllLocales();
      return successResponse(res, 'Locales retrieved successfully', locales);
    } catch (error) {
      console.error('Error retrieving locales:', error);
      return errorResponse(res, 'Error retrieving locales', error.message, 500);
    }
  }

  async getFoodsByLocale(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, category = '', sort = 'name', order = 'ASC' } = req.query;

      if (!id) {
        return errorResponse(res, 'Locale ID is required', null, 400);
      }

      const result = await LocaleService.getFoodsByLocale(id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        category,
        sort,
        order
      });

      return successResponse(res, 'Foods by locale retrieved successfully', {
        foods: result.items || result,
        total: result.total || result.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        locale_id: id
      });
    } catch (error) {
      console.error('Error retrieving foods by locale:', error);
      return errorResponse(res, 'Error retrieving foods by locale', error.message, 500);
    }
  }

  async createLocale(req, res) {
    try {
      const localeData = req.body;
      
      // Validate required fields
      if (!localeData.country || !localeData.region) {
        return errorResponse(res, 'Country and region are required', null, 400);
      }
      
      const newLocale = await LocaleService.createLocale(localeData);
      return successResponse(res, 'Locale created successfully', newLocale, 201);
    } catch (error) {
      console.error('Error creating locale:', error);
      return errorResponse(res, 'Error creating locale', error.message, 400);
    }
  }

  async updateLocale(req, res) {
    try {
      const { id } = req.params;
      const localeData = req.body;

      if (!id) {
        return errorResponse(res, 'Locale ID is required', null, 400);
      }

      const updatedLocale = await LocaleService.updateLocale(id, localeData);
      if (!updatedLocale) {
        return errorResponse(res, 'Locale not found', null, 404);
      }

      return successResponse(res, 'Locale updated successfully', updatedLocale);
    } catch (error) {
      console.error('Error updating locale:', error);
      return errorResponse(res, 'Error updating locale', error.message, 400);
    }
  }

  async getLocaleById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Locale ID is required', null, 400);
      }

      const locale = await LocaleService.getLocaleById(id);
      if (!locale) {
        return errorResponse(res, 'Locale not found', null, 404);
      }

      return successResponse(res, 'Locale retrieved successfully', locale);
    } catch (error) {
      console.error('Error retrieving locale:', error);
      return errorResponse(res, 'Error retrieving locale', error.message, 500);
    }
  }

  async deleteLocale(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return errorResponse(res, 'Locale ID is required', null, 400);
      }

      const deleted = await LocaleService.deleteLocale(id);
      if (!deleted) {
        return errorResponse(res, 'Locale not found', null, 404);
      }

      return successResponse(res, 'Locale deleted successfully', null, 204);
    } catch (error) {
      console.error('Error deleting locale:', error);
      return errorResponse(res, 'Error deleting locale', error.message, 400);
    }
  }
}

export default new LocaleController();