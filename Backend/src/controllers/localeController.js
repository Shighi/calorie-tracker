import LocaleService from '../services/localeService';
import { successResponse, errorResponse } from '../utils/apiResponse';

class LocaleController {
  async getAllLocales(req, res) {
    try {
      const locales = await LocaleService.getAllLocales();
      return successResponse(res, 'Locales retrieved successfully', locales);
    } catch (error) {
      return errorResponse(res, 'Error retrieving locales', error, 500);
    }
  }

  async getFoodsByLocale(req, res) {
    try {
      const { id } = req.params;
      const { 
        page, 
        limit, 
        category, 
        sortBy, 
        sortOrder 
      } = req.query;

      const result = await LocaleService.getFoodsByLocale(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        sortBy,
        sortOrder
      });

      return successResponse(res, 'Foods by locale retrieved successfully', result);
    } catch (error) {
      return errorResponse(res, 'Error retrieving foods by locale', error, 500);
    }
  }

  async createLocale(req, res) {
    try {
      const localeData = req.body;
      const newLocale = await LocaleService.createLocale(localeData);
      return successResponse(res, 'Locale created successfully', newLocale, 201);
    } catch (error) {
      return errorResponse(res, 'Error creating locale', error, 400);
    }
  }

  async updateLocale(req, res) {
    try {
      const { id } = req.params;
      const localeData = req.body;
      const updatedLocale = await LocaleService.updateLocale(id, localeData);
      return successResponse(res, 'Locale updated successfully', updatedLocale);
    } catch (error) {
      return errorResponse(res, 'Error updating locale', error, 400);
    }
  }

  async getLocaleById(req, res) {
    try {
      const { id } = req.params;
      const locale = await LocaleService.getLocaleById(id);
      return successResponse(res, 'Locale retrieved successfully', locale);
    } catch (error) {
      return errorResponse(res, 'Error retrieving locale', error, 404);
    }
  }
}

export default new LocaleController();