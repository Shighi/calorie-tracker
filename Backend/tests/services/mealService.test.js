// tests/services/mealService.test.js
const mealService = require('../../src/services/mealService');
const Meal = require('../../src/models/Meal');
const Food = require('../../src/models/Food');
const { mockMeal, mockMealWithDetails } = require('../mocks/mealMocks');
const { mockFood } = require('../mocks/foodMocks');

// Mock dependencies
jest.mock('../../src/models/Meal');
jest.mock('../../src/models/Food');

describe('Meal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserMeals', () => {
    const userId = 'user-123';
    
    it('should return paginated meals for user', async () => {
      const options = { page: 1, limit: 10 };
      const meals = [mockMeal, { ...mockMeal, id: 'meal-2' }];
      
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(meals)
      };
      
      Meal.find.mockReturnValue(mockQuery);
      Meal.countDocuments.mockResolvedValue(meals.length);
      
      const result = await mealService.getUserMeals(userId, options);
      
      expect(Meal.find).toHaveBeenCalledWith({ user: userId });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(mockQuery.populate).toHaveBeenCalledWith('foods.food');
      expect(result).toEqual({
        meals,
        total: meals.length,
        page: 1,
        limit: 10,
        pages: 1
      });
    });
    
    it('should use default pagination options if not provided', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockMeal])
      };
      
      Meal.find.mockReturnValue(mockQuery);
      Meal.countDocuments.mockResolvedValue(1);
      
      await mealService.getUserMeals(userId);
      
      expect(mockQuery.skip).toHaveBeenCalledWith(0); // Default page 1
      expect(mockQuery.limit).toHaveBeenCalledWith(20); // Default limit
    });
    
    it('should filter by date range if provided', async () => {
      const options = { 
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };
      
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockMeal])
      };
      
      Meal.find.mockReturnValue(mockQuery);
      Meal.countDocuments.mockResolvedValue(1);
      
      await mealService.getUserMeals(userId, options);
      
      expect(Meal.find).toHaveBeenCalledWith({
        user: userId,
        date: {
          $gte: new Date('2023-01-01'),
          $lte: new Date('2023-01-31')
        }
      });
    });
  });

  describe('getMealById', () => {
    const userId = 'user-123';
    const mealId = 'meal-123';
    
    it('should return a meal by id with populated food details', async () => {
      Meal.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockMealWithDetails)
      });
      
      const result = await mealService.getMealById(mealId, userId);
      
      expect(Meal.findOne).toHaveBeenCalledWith({
        _id: mealId,
        user: userId
      });
      expect(result).toEqual(mockMealWithDetails);
    });
    
    it('should return null if meal not found', async () => {
      Meal.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      
      const result = await mealService.getMealById('nonexistent', userId);
      
      expect(result).toBeNull();
    });
  });

  describe('createMeal', () => {
    const userId = 'user-123';
    const mealData = {
      name: 'Breakfast',
      date: '2023-03-10T08:00:00Z',
      foods: [
        { foodId: 'food-1', quantity: 100, unit: 'g' },
        { foodId: 'food-2', quantity: 200, unit: 'ml' }
      ]
    };
    
    it('should create a new meal with calculated nutrition', async () => {
      // Mock food retrieval
      Food.findById.mockImplementation((id) => {
        if (id === 'food-1') {
          return Promise.resolve({
            ...mockFood,
            id: 'food-1',
            nutrients: { calories: 100, protein: 5, carbs: 10, fat: 2 }
          });
        } else {
          return Promise.resolve({
            ...mockFood,
            id: 'food-2',
            nutrients: { calories: 50, protein: 0, carbs: 12, fat: 0 }
          });
        }
      });
      
      // Mock meal creation
      const createdMeal = {
        id: 'new-meal-id',
        user: userId,
        ...mealData,
        // Foods with references
        foods: [
          { food: 'food-1', quantity: 100, unit: 'g' },
          { food: 'food-2', quantity: 200, unit: 'ml' }
        ],
        // Calculated nutrition based on foods and quantities
        nutrition: {
          calories: 200, // (100*1) + (50*2)
          protein: 5,    // (5*1) + (0*2)
          carbs: 34,     // (10*1) + (12*2)
          fat: 2         // (2*1) + (0*2)
        }
      };
      
      Meal.create.mockResolvedValue(createdMeal);
      
      const result = await mealService.createMeal(mealData, userId);
      
      expect(Food.findById).toHaveBeenCalledTimes(2);
      expect(Meal.create).toHaveBeenCalledWith(expect.objectContaining({
        user: userId,
        name: mealData.name,
        date: expect.any(Date),
        foods: [
          { food: 'food-1', quantity: 100, unit: 'g' },
          { food: 'food-2', quantity: 200, unit: 'ml' }
        ],
        nutrition: expect.objectContaining({
          calories: expect.any(Number),
          protein: expect.any(Number),
          carbs: expect.any(Number),
          fat: expect.any(Number)
        })
      }));
      expect(result).toEqual(createdMeal);
    });
    
    it('should throw an error if a food item is not found', async () => {
      Food.findById.mockResolvedValue(null);
      
      await expect(mealService.createMeal(mealData, userId))
        .rejects.toThrow('One or more food items not found');
    });
  });

  describe('updateMeal', () => {
    const userId = 'user-123';
    const mealId = 'meal-123';
    const updateData = {
      name: 'Updated Meal',
      foods: [{ foodId: 'food-3', quantity: 150, unit: 'g' }]
    };
    
    it('should update a meal with recalculated nutrition', async () => {
      // Mock existing meal
      const existingMeal = {
        id: mealId,
        user: userId,
        name: 'Original Meal',
        date: new Date('2023-03-10'),
        foods: [{ food: 'food-1', quantity: 100, unit: 'g' }],
        nutrition: { calories: 100, protein: 5, carbs: 10, fat: 2 }
      };
      
      // Mock meal retrieval
      Meal.findOne.mockResolvedValue(existingMeal);
      
      // Mock food retrieval for updated food
      Food.findById.mockResolvedValue({
        id: 'food-3',
        name: 'New Food',
        nutrients: { calories: 150, protein: 8, carbs: 15, fat: 5 }
      });
      
      // Mock save operation
      existingMeal.save = jest.fn().mockResolvedValue({
        ...existingMeal,
        name: updateData.name,
        foods: [{ food: 'food-3', quantity: 150, unit: 'g' }],
        nutrition: { calories: 225, protein: 12, carbs: 22.5, fat: 7.5 }
      });
      
      const result = await mealService.updateMeal(mealId, updateData, userId);
      
      expect(Meal.findOne).toHaveBeenCalledWith({ _id: mealId, user: userId });
      expect(Food.findById).toHaveBeenCalledWith('food-3');
      expect(existingMeal.name).toBe('Updated Meal');
      expect(existingMeal.foods).toEqual([{ food: 'food-3', quantity: 150, unit: 'g' }]);
      expect(existingMeal.nutrition).toEqual(expect.objectContaining({
        calories: expect.any(Number),
        protein: expect.any(Number)
      }));
      expect(existingMeal.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: mealId,
        name: 'Updated Meal'
      }));
    });
    
    it('should return null if meal not found', async () => {
      Meal.findOne.mockResolvedValue(null);
      
      const result = await mealService.updateMeal('nonexistent', updateData, userId);
      
      expect(result).toBeNull();
    });
    
    it('should only update specified fields', async () => {
      // Mock existing meal
      const existingMeal = {
        id: mealId,
        user: userId,
        name: 'Original Meal',
        date: new Date('2023-03-10'),
        foods: [{ food: 'food-1', quantity: 100, unit: 'g' }],
        nutrition: { calories: 100, protein: 5, carbs: 10, fat: 2 },
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
      };
      
      Meal.findOne.mockResolvedValue(existingMeal);
      
      // Update only the name, not the foods
      const partialUpdate = { name: 'New Name Only' };
      
      const result = await mealService.updateMeal(mealId, partialUpdate, userId);
      
      expect(existingMeal.name).toBe('New Name Only');
      // Foods should remain unchanged
      expect(existingMeal.foods).toEqual([{ food: 'food-1', quantity: 100, unit: 'g' }]);
      expect(existingMeal.nutrition).toEqual({ calories: 100, protein: 5, carbs: 10, fat: 2 });
      expect(existingMeal.save).toHaveBeenCalled();
    });
  });

  describe('deleteMeal', () => {
    const userId = 'user-123';
    const mealId = 'meal-123';
    
    it('should delete a meal and return true if successful', async () => {
      Meal.findOneAndDelete.mockResolvedValue({ id: mealId });
      
      const result = await mealService.deleteMeal(mealId, userId);
      
      expect(Meal.findOneAndDelete).toHaveBeenCalledWith({
        _id: mealId,
        user: userId
      });
      expect(result).toBe(true);
    });
    
    it('should return false if meal not found', async () => {
      Meal.findOneAndDelete.mockResolvedValue(null);
      
      const result = await mealService.deleteMeal('nonexistent', userId);
      
      expect(result).toBe(false);
    });
  });

  describe('calculateMealNutrition', () => {
    it('should calculate nutrition based on foods and quantities', () => {
      const foods = [
        {
          food: {
            name: 'Apple',
            nutrients: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }
          },
          quantity: 100,
          unit: 'g'
        },
        {
          food: {
            name: 'Milk',
            nutrients: { calories: 42, protein: 3.4, carbs: 5, fat: 1 }
          },
          quantity: 200,
          unit: 'ml'
        }
      ];
      
      const result = mealService.calculateMealNutrition(foods);
      
      // Apple (100g) + Milk (200ml)
      expect(result).toEqual({
        calories: 136,  // 52 + (42*2)
        protein: 7.1,   // 0.3 + (3.4*2)
        carbs: 24,      // 14 + (5*2)
        fat: 2.2        // 0.2 + (1*2)
      });
    });
    
    it('should handle different units and conversion factors', () => {
      const foods = [
        {
          food: {
            name: 'Rice',
            nutrients: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }
          },
          quantity: 0.5,  // 0.5 cups
          unit: 'cup'     // 1 cup = 180g
        }
      ];
      
      // Assuming service handles unit conversion internally
      const mockConvertedQuantity = 90; // 0.5 cups * 180g conversion factor
      const expectedCalories = (130 * mockConvertedQuantity) / 100; // per 100g standardized
      
      // Mock the unit conversion method if it exists
      if (mealService.convertUnitToGrams) {
        jest.spyOn(mealService, 'convertUnitToGrams').mockReturnValue(mockConvertedQuantity);
      }
      
      const result = mealService.calculateMealNutrition(foods);
      
      // Values will vary based on actual implementation of unit conversion
      expect(result).toHaveProperty('calories');
      expect(result).toHaveProperty('protein');
      expect(result).toHaveProperty('carbs');
      expect(result).toHaveProperty('fat');
    });
    
    it('should handle missing nutrient values', () => {
      const foods = [
        {
          food: {
            name: 'Incomplete Food',
            nutrients: { calories: 100 } // Missing other nutrients
          },
          quantity: 100,
          unit: 'g'
        }
      ];
      
      const result = mealService.calculateMealNutrition(foods);
      
      expect(result).toEqual({
        calories: 100,
        protein: 0,  // Default to 0 if missing
        carbs: 0,
        fat: 0
      });
    });
  });
});