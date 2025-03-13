// src/services/foodService.js
import { Op } from 'sequelize';
import Food from '../models/Food.js';
import Nutrient from '../models/Nutrient.js';
import Locale from '../models/Locale.js';
import { ApiError } from '../utils/apiResponse.js';
import externalApiService from './externalApiService.js';
import cacheService from './cacheService.js';

class FoodService {
  async listFoods(filters = {}, pagination = { page: 1, limit: 20 }) {
    const { page, limit } = pagination;
    
    // Generate cache key based on filters and pagination
    const cacheKey = `foods:list:${JSON.stringify(filters)}:page${page}:limit${limit}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    const offset = (page - 1) * limit;
    
    const where = {};
    if (filters.name) where.name = { [Op.iLike]: `%${filters.name}%` };
    if (filters.category) where.category = filters.category;
    if (filters.localeId) where.localeId = filters.localeId;
    if (filters.minCalories) where['$nutrients.calories$'] = { [Op.gte]: filters.minCalories };
    if (filters.maxCalories) where['$nutrients.calories$'] = { ...where['$nutrients.calories$'] || {}, [Op.lte]: filters.maxCalories };
    
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
    
    const result = {
      foods: rows,
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) }
    };
    
    // Cache the result
    await cacheService.set(cacheKey, result);
    
    return result;
  }

  async getFoodById(id) {
    // Generate cache key
    const cacheKey = `food:${id}`;
    
    // Try to get from cache first
    const cachedFood = await cacheService.get(cacheKey);
    if (cachedFood) {
      return cachedFood;
    }
    
    const food = await Food.findByPk(id, {
      include: [{ model: Nutrient, as: 'nutrients' }, { model: Locale, as: 'locale' }]
    });
    
    if (!food) throw new ApiError('Food not found', 404);
    
    // Cache the result
    await cacheService.set(cacheKey, food);
    
    return food;
  }

  async createFood(foodData) {
    const food = await Food.create({
      name: foodData.name,
      description: foodData.description,
      category: foodData.category,
      servingSize: foodData.servingSize,
      servingUnit: foodData.servingUnit,
      localeId: foodData.localeId,
      externalId: foodData.externalId
    });
    
    if (foodData.nutrients) await food.createNutrients(foodData.nutrients);
    
    // Invalidate list cache
    await cacheService.deleteByPattern('foods:list:*');
    
    return this.getFoodById(food.id);
  }

  async updateFood(id, foodData) {
    const food = await Food.findByPk(id);
    if (!food) throw new ApiError('Food not found', 404);
    
    await food.update(foodData);
    
    if (foodData.nutrients) {
      const nutrients = await food.getNutrients();
      if (nutrients) await nutrients.update(foodData.nutrients);
      else await food.createNutrients(foodData.nutrients);
    }
    
    // Invalidate caches
    await cacheService.delete(`food:${id}`);
    await cacheService.deleteByPattern('foods:list:*');
    
    return this.getFoodById(id);
  }

  async deleteFood(id) {
    const food = await Food.findByPk(id);
    if (!food) throw new ApiError('Food not found', 404);
    
    await food.destroy();
    
    // Invalidate caches
    await cacheService.delete(`food:${id}`);
    await cacheService.deleteByPattern('foods:list:*');
    
    return true;
  }

  async searchFoods(query, pagination = { page: 1, limit: 20 }) {
    // Generate cache key
    const cacheKey = `foods:search:${query}:page${pagination.page}:limit${pagination.limit}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = await this.listFoods({ name: query }, pagination);
    
    // Cache the result
    await cacheService.set(cacheKey, result);
    
    return result;
  }

  async getFoodsByCategory(category, pagination = { page: 1, limit: 20 }) {
    // Generate cache key
    const cacheKey = `foods:category:${category}:page${pagination.page}:limit${pagination.limit}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = await this.listFoods({ category }, pagination);
    
    // Cache the result
    await cacheService.set(cacheKey, result);
    
    return result;
  }

  async getFoodsByLocale(localeId, pagination = { page: 1, limit: 20 }) {
    // Generate cache key
    const cacheKey = `foods:locale:${localeId}:page${pagination.page}:limit${pagination.limit}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = await this.listFoods({ localeId }, pagination);
    
    // Cache the result
    await cacheService.set(cacheKey, result);
    
    return result;
  }

  async importFromExternalApi(source, query) {
    let externalFoods;
    if (source === 'usda') externalFoods = await externalApiService.fetchUsdaFoods(query);
    else if (source === 'off') externalFoods = await externalApiService.fetchOpenFoodFactsFoods(query);
    else throw new ApiError('Invalid external API source', 400);

    const importedFoods = [];
    for (const externalFood of externalFoods) {
      const transformedFood = this.transformExternalFood(externalFood, source);
      const existingFood = await Food.findOne({
        where: { externalId: transformedFood.externalId, localeId: transformedFood.localeId }
      });
      let food;
      if (existingFood) food = await this.updateFood(existingFood.id, transformedFood);
      else food = await this.createFood(transformedFood);
      importedFoods.push(food);
    }
    
    // Invalidate all food caches after bulk import
    await cacheService.deleteByPattern('foods:*');
    
    return importedFoods;
  }

  transformExternalFood(externalFood, source) {
    if (source === 'usda') {
      return {
        name: externalFood.description,
        description: externalFood.additionalDescriptions || '',
        category: this.mapUsdaCategory(externalFood.foodCategory?.description),
        servingSize: externalFood.servingSize || 100,
        servingUnit: externalFood.servingSizeUnit || 'g',
        localeId: 1,
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
  
  findUsdaNutrient(externalFood, nutrientName) {
    const nutrient = externalFood.foodNutrients?.find(n => 
      n.nutrient?.name === nutrientName
    );
    return nutrient ? nutrient.amount : 0;
  }
  
  mapUsdaCategory(category) {
    if (!category) return 'uncategorized';
    const categoryMap = {
      'Vegetables and Vegetable Products': 'vegetables',
      'Fruits and Fruit Juices': 'fruits',
      'Dairy and Egg Products': 'dairy',
      'Meat, Poultry, Fish and Seafood': 'protein',
      'Legumes and Legume Products': 'legumes',
      'Grain Products': 'grains',
      'Nuts and Seeds': 'nuts_seeds',
      'Sweets': 'sweets',
      'Beverages': 'beverages'
    };
    return categoryMap[category] || 'other';
  }
  
  mapOffCategory(categories) {
    if (!categories) return 'uncategorized';
    
    const categoriesLower = categories.toLowerCase();
    if (categoriesLower.includes('vegetable')) return 'vegetables';
    if (categoriesLower.includes('fruit')) return 'fruits';
    if (categoriesLower.includes('dairy') || categoriesLower.includes('milk') || categoriesLower.includes('cheese')) return 'dairy';
    if (categoriesLower.includes('meat') || categoriesLower.includes('poultry') || categoriesLower.includes('fish') || categoriesLower.includes('seafood')) return 'protein';
    if (categoriesLower.includes('legume') || categoriesLower.includes('bean') || categoriesLower.includes('pea')) return 'legumes';
    if (categoriesLower.includes('grain') || categoriesLower.includes('bread') || categoriesLower.includes('cereal') || categoriesLower.includes('pasta')) return 'grains';
    if (categoriesLower.includes('nut') || categoriesLower.includes('seed')) return 'nuts_seeds';
    if (categoriesLower.includes('sweet') || categoriesLower.includes('candy') || categoriesLower.includes('chocolate')) return 'sweets';
    if (categoriesLower.includes('beverage') || categoriesLower.includes('drink')) return 'beverages';
    
    return 'other';
  }
  
  getLocaleIdFromOffCountry(countries) {
    if (!countries) return 1; // Default to US
    
    const countriesLower = countries.toLowerCase();
    const countryLocaleMap = {
      'united states': 1,
      'france': 2,
      'italy': 3,
      'spain': 4,
      'japan': 5,
      'mexico': 6,
      'india': 7,
      'china': 8,
      'united kingdom': 9
    };
    
    for (const [country, localeId] of Object.entries(countryLocaleMap)) {
      if (countriesLower.includes(country)) return localeId;
    }
    
    return 1; // Default to US if no match
  }
}

export default new FoodService();