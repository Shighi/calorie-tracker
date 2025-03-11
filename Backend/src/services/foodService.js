const { Op } = require('sequelize');
const Food = require('../models/Food');
const Nutrient = require('../models/Nutrient');
const Locale = require('../models/Locale');
const { ApiError } = require('../utils/apiResponse');
const externalApiService = require('./externalApiService');

class FoodService {
  /**
   * Get list of foods with filtering and pagination
   * @param {Object} filters - Filter parameters
   * @param {Object} pagination - Pagination options
   * @returns {Object} Foods list and pagination metadata
   */
  async listFoods(filters = {}, pagination = { page: 1, limit: 20 }) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const where = {};
    
    if (filters.name) {
      where.name = { [Op.iLike]: `%${filters.name}%` };
    }
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.localeId) {
      where.localeId = filters.localeId;
    }
    
    // Add nutritional value filters if provided
    if (filters.minCalories) {
      where['$nutrients.calories$'] = { [Op.gte]: filters.minCalories };
    }
    
    if (filters.maxCalories) {
      where['$nutrients.calories$'] = { 
        ...(where['$nutrients.calories$'] || {}),
        [Op.lte]: filters.maxCalories 
      };
    }
    
    // Query foods with pagination
    const { rows, count } = await Food.findAndCountAll({
      where,
      include: [
        { model: Nutrient, as: 'nutrients' },
        { model: Locale, as: 'locale' }
      ],
      limit,
      offset,
      order: [['name', 'ASC']]
    });
    
    return {
      foods: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get food by ID
   * @param {number} id - Food ID
   * @returns {Object} Food details
   */
  async getFoodById(id) {
    const food = await Food.findByPk(id, {
      include: [
        { model: Nutrient, as: 'nutrients' },
        { model: Locale, as: 'locale' }
      ]
    });
    
    if (!food) {
      throw new ApiError('Food not found', 404);
    }
    
    return food;
  }

  /**
   * Create new food item
   * @param {Object} foodData - Food data
   * @returns {Object} Created food
   */
  async createFood(foodData) {
    // Create food record
    const food = await Food.create({
      name: foodData.name,
      description: foodData.description,
      category: foodData.category,
      servingSize: foodData.servingSize,
      servingUnit: foodData.servingUnit,
      localeId: foodData.localeId,
      externalId: foodData.externalId
    });
    
    // Create associated nutrients
    if (foodData.nutrients) {
      await food.createNutrients(foodData.nutrients);
    }
    
    // Return created food with its nutrients
    return this.getFoodById(food.id);
  }

  /**
   * Update food item
   * @param {number} id - Food ID
   * @param {Object} foodData - Updated food data
   * @returns {Object} Updated food
   */
  async updateFood(id, foodData) {
    const food = await Food.findByPk(id);
    
    if (!food) {
      throw new ApiError('Food not found', 404);
    }
    
    // Update food properties
    await food.update(foodData);
    
    // Update nutrients if provided
    if (foodData.nutrients) {
      const nutrients = await food.getNutrients();
      
      if (nutrients) {
        await nutrients.update(foodData.nutrients);
      } else {
        await food.createNutrients(foodData.nutrients);
      }
    }
    
    // Return updated food with its nutrients
    return this.getFoodById(id);
  }

  /**
   * Delete food item
   * @param {number} id - Food ID
   * @returns {boolean} Success status
   */
  async deleteFood(id) {
    const food = await Food.findByPk(id);
    
    if (!food) {
      throw new ApiError('Food not found', 404);
    }
    
    await food.destroy();
    return true;
  }

  /**
   * Search foods by name or description
   * @param {string} query - Search query
   * @param {Object} pagination - Pagination options
   * @returns {Object} Foods list and pagination metadata
   */
  async searchFoods(query, pagination = { page: 1, limit: 20 }) {
    return this.listFoods(
      {
        name: query,
        // Add additional search conditions if needed
      },
      pagination
    );
  }

  /**
   * Get foods by category
   * @param {string} category - Food category
   * @param {Object} pagination - Pagination options
   * @returns {Object} Foods list and pagination metadata
   */
  async getFoodsByCategory(category, pagination = { page: 1, limit: 20 }) {
    return this.listFoods({ category }, pagination);
  }

  /**
   * Get foods by locale
   * @param {number} localeId - Locale ID
   * @param {Object} pagination - Pagination options
   * @returns {Object} Foods list and pagination metadata
   */
  async getFoodsByLocale(localeId, pagination = { page: 1, limit: 20 }) {
    return this.listFoods({ localeId }, pagination);
  }

  /**
   * Import foods from external API
   * @param {string} source - External API source ('usda' or 'off')
   * @param {Object} query - Search query parameters
   * @returns {Array} Imported foods
   */
  async importFromExternalApi(source, query) {
    let externalFoods;
    
    // Fetch foods from external API
    if (source === 'usda') {
      externalFoods = await externalApiService.fetchUsdaFoods(query);
    } else if (source === 'off') {
      externalFoods = await externalApiService.fetchOpenFoodFactsFoods(query);
    } else {
      throw new ApiError('Invalid external API source', 400);
    }
    
    // Transform and save foods to our database
    const importedFoods = [];
    
    for (const externalFood of externalFoods) {
      // Convert external food data to our format
      const transformedFood = this.transformExternalFood(externalFood, source);
      
      // Check if food already exists
      const existingFood = await Food.findOne({
        where: {
          externalId: transformedFood.externalId,
          localeId: transformedFood.localeId
        }
      });
      
      let food;
      
      if (existingFood) {
        // Update existing food
        food = await this.updateFood(existingFood.id, transformedFood);
      } else {
        // Create new food
        food = await this.createFood(transformedFood);
      }
      
      importedFoods.push(food);
    }
    
    return importedFoods;
  }

  /**
   * Transform external food data to our format
   * @param {Object} externalFood - External food data
   * @param {string} source - External API source
   * @returns {Object} Transformed food data
   */
  transformExternalFood(externalFood, source) {
    if (source === 'usda') {
      return {
        name: externalFood.description,
        description: externalFood.additionalDescriptions || '',
        category: this.mapUsdaCategory(externalFood.foodCategory?.description),
        servingSize: externalFood.servingSize || 100,
        servingUnit: externalFood.servingSizeUnit || 'g',
        localeId: 1, // US locale
        externalId: `usda:${externalFood.fdcId}`,
        nutrients: {
          calories: this.findUsdaNutrient(externalFood, 'Energy'),
          protein: this.findUsdaNutrient(externalFood, 'Protein'),
          carbohydrates: this.findUsdaNutrient(externalFood, 'Carbohydrate, by difference'),
          fat: this.findUsdaNutrient(externalFood, 'Total lipid (fat)'),
          fiber: this.findUsdaNutrient(externalFood, 'Fiber, total dietary')
        }
      };
    } else if (source === 'off') {
      // Transform Open Food Facts data
      return {
        name: externalFood.product_name,
        description: externalFood.ingredients_text || '',
        category: this.mapOffCategory(externalFood.categories),
        servingSize: externalFood.serving_size ? parseFloat(externalFood.serving_size) : 100,
        servingUnit: 'g',
        localeId: this.getLocaleIdFromOffCountry(externalFood.countries),
        externalId: `off:${externalFood.code}`,
        nutrients: {
          calories: externalFood.nutriments?.['energy-kcal_100g'] || 0,
          protein: externalFood.nutriments?.proteins_100g || 0,
          carbohydrates: externalFood.nutriments?.carbohydrates_100g || 0,
          fat: externalFood.nutriments?.fat_100g || 0,
          fiber: externalFood.nutriments?.fiber_100g || 0
        }
      };
    }
    
    throw new ApiError('Unsupported external API source', 400);
  }

  /**
   * Helper method to find USDA nutrient value
   * @param {Object} food - USDA food data
   * @param {string} nutrientName - Nutrient name
   * @returns {number} Nutrient value
   */
  findUsdaNutrient(food, nutrientName) {
    const nutrient = food.foodNutrients?.find(n => 
      n.nutrient?.name === nutrientName
    );
    
    return nutrient?.amount || 0;
  }

  /**
   * Map USDA food category to our categories
   * @param {string} usdaCategory - USDA category
   * @returns {string} Mapped category
   */
  mapUsdaCategory(usdaCategory) {
    // Implement category mapping logic
    const categoryMap = {
      'Vegetables and Vegetable Products': 'vegetables',
      'Fruits and Fruit Juices': 'fruits',
      'Dairy and Egg Products': 'dairy',
      // Add more mappings as needed
    };
    
    return categoryMap[usdaCategory] || 'other';
  }

  /**
   * Map Open Food Facts category to our categories
   * @param {string} offCategories - OFF categories string
   * @returns {string} Mapped category
   */
  mapOffCategory(offCategories) {
    if (!offCategories) return 'other';
    
    // Implement category mapping logic
    if (offCategories.includes('Vegetables')) return 'vegetables';
    if (offCategories.includes('Fruits')) return 'fruits';
    if (offCategories.includes('Dairy')) return 'dairy';
    // Add more mappings as needed
    
    return 'other';
  }

  /**
   * Get locale ID from Open Food Facts country
   * @param {string} countries - OFF countries string
   * @returns {number} Locale ID
   */
  getLocaleIdFromOffCountry(countries) {
    if (!countries) return 1; // Default to US
    
    // Implement country to locale mapping
    if (countries.includes('United States')) return 1;
    if (countries.includes('France')) return 2;
    // Add more mappings as needed
    
    return 1; // Default to US
  }
}

module.exports = new FoodService();