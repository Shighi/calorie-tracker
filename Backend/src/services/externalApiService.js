import axios from 'axios';
import redis from 'redis';
import { promisify } from 'util';

class ExternalApiService {
  constructor() {
    this.usdaApiBaseUrl = 'https://api.nal.usda.gov/fdc/v1';
    this.openFoodFactsBaseUrl = 'https://world.openfoodfacts.org/api/v0';
    
    // Redis setup for caching
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    this.getAsync = promisify(this.redisClient.get).bind(this.redisClient);
    this.setAsync = promisify(this.redisClient.set).bind(this.redisClient);
  }

  async fetchUsdaFoodDetails(fdcId) {
    const cacheKey = `usda_food_${fdcId}`;
    
    // Check cache first
    const cachedData = await this.getAsync(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    try {
      const response = await axios.get(`${this.usdaApiBaseUrl}/food/${fdcId}`, {
        params: { api_key: process.env.USDA_API_KEY }
      });

      // Cache the response
      await this.setAsync(cacheKey, JSON.stringify(response.data), 'EX', 86400); // 24-hour cache

      return response.data;
    } catch (error) {
      console.error('USDA API Error:', error);
      throw new Error('Failed to fetch food details from USDA');
    }
  }

  async searchUsdaFoods(query, options = {}) {
    try {
      const response = await axios.get(`${this.usdaApiBaseUrl}/foods/search`, {
        params: {
          api_key: process.env.USDA_API_KEY,
          query,
          pageSize: options.limit || 10,
          pageNumber: options.page || 1
        }
      });

      return response.data;
    } catch (error) {
      console.error('USDA Search Error:', error);
      throw new Error('Failed to search foods in USDA database');
    }
  }

  async fetchOpenFoodFactsProduct(barcode) {
    const cacheKey = `off_product_${barcode}`;
    
    // Check cache first
    const cachedData = await this.getAsync(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    try {
      const response = await axios.get(`${this.openFoodFactsBaseUrl}/product/${barcode}.json`);

      // Cache the response
      await this.setAsync(cacheKey, JSON.stringify(response.data), 'EX', 86400); // 24-hour cache

      return response.data;
    } catch (error) {
      console.error('Open Food Facts API Error:', error);
      throw new Error('Failed to fetch product details');
    }
  }

  async normalizeExternalFoodData(externalFood) {
    // Implement data normalization logic
    // This would transform USDA or Open Food Facts data into your internal Food model structure
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