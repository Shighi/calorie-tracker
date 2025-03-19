import axios from 'axios';
import cacheService from './cacheService.js';

class ExternalApiService {
  constructor() {
    this.usdaApiBaseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.openFoodFactsBaseUrl = 'https://world.openfoodfacts.org/api/v0';
  }

  async fetchUsdaFoodDetails(fdcId) {
    // Generate cache key
    const cacheKey = `external:usda:food:${fdcId}`;

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.usdaApiBaseUrl}/food/${fdcId}`, {
        params: { api_key: process.env.USDA_API_KEY }
      });

      // Cache the response for 24 hours
      await cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      console.error('USDA API Error:', error);
      throw new Error('Failed to fetch food details from USDA');
    }
  }

  async searchUsdaFoods(query, options = {}) {
    // Generate cache key based on query and pagination
    const cacheKey = `external:usda:search:${query}:page${options.page || 1}:limit${options.limit || 10}`;

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.usdaApiBaseUrl}/foods/search`, {
        params: {
          api_key: process.env.USDA_API_KEY,
          query,
          pageSize: options.limit || 10,
          pageNumber: options.page || 1
        }
      });

      // Cache the response for 1 hour
      await cacheService.set(cacheKey, response.data, 3600);

      return response.data;
    } catch (error) {
      console.error('USDA Search Error:', error);
      throw new Error('Failed to search foods in USDA database');
    }
  }

  async fetchOpenFoodFactsProduct(barcode) {
    // Generate cache key
    const cacheKey = `external:off:product:${barcode}`;

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.openFoodFactsBaseUrl}/product/${barcode}.json`);

      // Cache the response for 24 hours
      await cacheService.set(cacheKey, response.data, 86400);

      return response.data;
    } catch (error) {
      console.error('Open Food Facts API Error:', error);
      throw new Error('Failed to fetch product details');
    }
  }

  async fetchUsdaFoods(query) {
    // Generate cache key
    const cacheKey = `external:usda:foods:${query}`;

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const searchResults = await this.searchUsdaFoods(query, { limit: 10 });
      const foods = searchResults.foods || [];

      // Cache the response for 6 hours
      await cacheService.set(cacheKey, foods, 21600);

      return foods;
    } catch (error) {
      console.error('USDA Foods Error:', error);
      throw new Error('Failed to fetch foods from USDA');
    }
  }

  async fetchOpenFoodFactsFoods(query) {
    // Generate cache key
    const cacheKey = `external:off:foods:${query}`;

    // Try to get from cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await axios.get(`${this.openFoodFactsBaseUrl}/search`, {
        params: {
          search_terms: query,
          page_size: 10,
          json: 1
        }
      });

      const products = response.data.products || [];

      // Cache the response for 6 hours
      await cacheService.set(cacheKey, products, 21600);

      return products;
    } catch (error) {
      console.error('Open Food Facts Search Error:', error);
      throw new Error('Failed to search foods in Open Food Facts database');
    }
  }

  async normalizeExternalFoodData(externalFood) {
    return {
      name: externalFood.description || externalFood.product_name,
      calories: externalFood.calories || 0,
      proteins: externalFood.protein || 0,
      carbs: externalFood.carbohydrates || 0,
      fats: externalFood.fat || 0
    };
  }
}

export default new ExternalApiService();