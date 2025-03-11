// tests/services/foodService.test.js
const foodService = require('../../src/services/foodService');
const Food = require('../../src/models/Food');
const externalApiService = require('../../src/services/externalApiService');
const { mockFood, mockFoodList } = require('../mocks/foodMocks');

// Mock dependencies
jest.mock('../../src/models/Food');
jest.mock('../../src/services/externalApiService');

describe('Food Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFoods', () => {
    it('should return paginated foods with filters', async () => {
      const filters = {
        name: 'apple',
        category: 'fruits',
        locale: 'us'
      };
      const options = {
        page: 1,
        limit: 10,
        sort: { name: 1 }
      };

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFoodList)
      };

      Food.find.mockReturnValue(mockQuery);
      Food.countDocuments.mockResolvedValue(mockFoodList.length);

      const result = await foodService.getAllFoods(filters, options);

      expect(Food.find).toHaveBeenCalledWith(expect.objectContaining({
        name: expect.any(RegExp),
        category: 'fruits',
        locale: 'us'
      }));
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual({
        foods: mockFoodList,
        total: mockFoodList.length,
        page: 1,
        limit: 10,
        pages: 1
      });
    });

    it('should handle missing filters and options', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFoodList)
      };

      Food.find.mockReturnValue(mockQuery);
      Food.countDocuments.mockResolvedValue(mockFoodList.length);

      const result = await foodService.getAllFoods();

      expect(Food.find).toHaveBeenCalledWith({});
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(20); // Default limit
      expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 }); // Default sort
      expect(result.foods).toEqual(mockFoodList);
    });
  });

  describe('getFoodById', () => {
    it('should return a food by id', async () => {
      Food.findById.mockResolvedValue(mockFood);

      const result = await foodService.getFoodById(mockFood.id);

      expect(Food.findById).toHaveBeenCalledWith(mockFood.id);
      expect(result).toEqual(mockFood);
    });

    it('should return null if food not found', async () => {
      Food.findById.mockResolvedValue(null);

      const result = await foodService.getFoodById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createFood', () => {
    const foodData = {
      name: 'New Food',
      category: 'snacks',
      nutrients: { calories: 200, protein: 5 },
      locale: 'us'
    };

    it('should create and return a new food', async () => {
      Food.create.mockResolvedValue({ id: 'new-food-id', ...foodData });

      const result = await foodService.createFood(foodData);

      expect(Food.create).toHaveBeenCalledWith(foodData);
      expect(result).toEqual({ id: 'new-food-id', ...foodData });
    });

    it('should throw an error if food creation fails', async () => {
      const error = new Error('Validation failed');
      Food.create.mockRejectedValue(error);

      await expect(foodService.createFood(foodData)).rejects.toThrow('Validation failed');
    });
  });

  describe('updateFood', () => {
    const foodId = 'food-id';
    const updateData = {
      name: 'Updated Food',
      nutrients: { calories: 250 }
    };

    it('should update and return the food', async () => {
      const updatedFood = { id: foodId, ...mockFood, ...updateData };
      Food.findByIdAndUpdate.mockResolvedValue(updatedFood);

      const result = await foodService.updateFood(foodId, updateData);

      expect(Food.findByIdAndUpdate).toHaveBeenCalledWith(
        foodId,
        updateData,
        { new: true }
      );
      expect(result).toEqual(updatedFood);
    });

    it('should return null if food not found', async () => {
      Food.findByIdAndUpdate.mockResolvedValue(null);

      const result = await foodService.updateFood('nonexistent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteFood', () => {
    it('should delete a food and return true if successful', async () => {
      Food.findByIdAndDelete.mockResolvedValue(mockFood);

      const result = await foodService.deleteFood(mockFood.id);

      expect(Food.findByIdAndDelete).toHaveBeenCalledWith(mockFood.id);
      expect(result).toBe(true);
    });

    it('should return false if food not found', async () => {
      Food.findByIdAndDelete.mockResolvedValue(null);

      const result = await foodService.deleteFood('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('searchFoods', () => {
    const query = 'apple';
    
    it('should search for foods in database and external APIs', async () => {
      // Mock local database results
      const localResults = [{ id: 'local-1', name: 'Apple', source: 'local' }];
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(localResults)
      };
      Food.find.mockReturnValue(mockQuery);
      
      // Mock external API results
      const usdaResults = [{ id: 'usda-1', name: 'Red Apple', source: 'usda' }];
      const offResults = [{ id: 'off-1', name: 'Green Apple', source: 'off' }];
      externalApiService.searchUsdaFoods.mockResolvedValue(usdaResults);
      externalApiService.searchOpenFoodFacts.mockResolvedValue(offResults);
      
      const result = await foodService.searchFoods(query);
      
      expect(Food.find).toHaveBeenCalledWith({ name: expect.any(RegExp) });
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
      expect(externalApiService.searchUsdaFoods).toHaveBeenCalledWith(query);
      expect(externalApiService.searchOpenFoodFacts).toHaveBeenCalledWith(query);
      
      // Should combine all results
      expect(result).toEqual([...localResults, ...usdaResults, ...offResults]);
    });
    
    it('should handle errors from external APIs and return local results', async () => {
      // Mock local database results
      const localResults = [{ id: 'local-1', name: 'Apple', source: 'local' }];
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(localResults)
      };
      Food.find.mockReturnValue(mockQuery);
      
      // Mock external API failures
      externalApiService.searchUsdaFoods.mockRejectedValue(new Error('USDA API error'));
      externalApiService.searchOpenFoodFacts.mockRejectedValue(new Error('OFF API error'));
      
      const result = await foodService.searchFoods(query);
      
      // Should still return local results despite API failures
      expect(result).toEqual(localResults);
    });
  });

  describe('importExternalFood', () => {
    const externalFood = {
      external_id: 'ext-123',
      name: 'External Food',
      source: 'usda',
      nutrients: { calories: 150, protein: 3 }
    };
    
    it('should import external food and save to database', async () => {
      const normalizedFood = {
        name: 'External Food',
        category: 'imported',
        locale: 'us',
        nutrients: { calories: 150, protein: 3 },
        external_reference: {
          id: 'ext-123',
          source: 'usda'
        }
      };
      
      const savedFood = { id: 'db-123', ...normalizedFood };
      Food.findOne.mockResolvedValue(null); // Food doesn't exist yet
      Food.create.mockResolvedValue(savedFood);
      
      const result = await foodService.importExternalFood(externalFood);
      
      expect(Food.findOne).toHaveBeenCalledWith({
        'external_reference.id': 'ext-123',
        'external_reference.source': 'usda'
      });
      expect(Food.create).toHaveBeenCalledWith(expect.objectContaining(normalizedFood));
      expect(result).toEqual(savedFood);
    });
    
    it('should return existing food if already imported', async () => {
      const existingFood = { 
        id: 'existing-123',
        name: 'Already Imported Food'
      };
      
      Food.findOne.mockResolvedValue(existingFood);
      
      const result = await foodService.importExternalFood(externalFood);
      
      expect(Food.findOne).toHaveBeenCalled();
      expect(Food.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingFood);
    });
    
    it('should handle invalid external food data', async () => {
      const invalidFood = {
        // Missing required fields
        source: 'usda'
      };
      
      await expect(foodService.importExternalFood(invalidFood)).rejects.toThrow();
    });
  });
});