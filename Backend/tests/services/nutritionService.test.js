const { expect } = require('chai');
const sinon = require('sinon');
const nutritionService = require('../../src/services/nutritionService');
const Meal = require('../../src/models/Meal');
const Food = require('../../src/models/Food');
const Nutrient = require('../../src/models/Nutrient');
const { Op } = require('sequelize');

describe('Nutrition Service', () => {
  let mealFindStub;
  let foodFindStub;
  let nutrientFindStub;

  beforeEach(() => {
    // Create stubs for model methods
    mealFindStub = sinon.stub(Meal, 'findAll');
    foodFindStub = sinon.stub(Food, 'findAll');
    nutrientFindStub = sinon.stub(Nutrient, 'findAll');
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getDailyNutrition', () => {
    it('should return daily nutrition summary for a user', async () => {
      const userId = 1;
      const date = '2025-03-10';
      
      const meals = [
        {
          id: 1,
          name: 'Breakfast',
          userId: 1,
          Foods: [
            { id: 1, name: 'Eggs', servingSize: 100, calories: 155, protein: 13, carbs: 1, fat: 11 },
            { id: 2, name: 'Toast', servingSize: 30, calories: 75, protein: 3, carbs: 15, fat: 1 }
          ],
          createdAt: new Date(`${date}T08:00:00`)
        }
      ];
      
      mealFindStub.resolves(meals);
      
      const result = await nutritionService.getDailyNutrition(userId, date);
      
      expect(result).to.have.property('totalCalories', 230);
      expect(result).to.have.property('totalProtein', 16);
      expect(result).to.have.property('totalCarbs', 16);
      expect(result).to.have.property('totalFat', 12);
      expect(result).to.have.property('meals').that.is.an('array');
      expect(mealFindStub.calledOnce).to.be.true;
    });
    
    it('should return empty summary when no meals found', async () => {
      mealFindStub.resolves([]);
      
      const result = await nutritionService.getDailyNutrition(1, '2025-03-10');
      
      expect(result).to.have.property('totalCalories', 0);
      expect(result).to.have.property('totalProtein', 0);
      expect(result).to.have.property('totalCarbs', 0);
      expect(result).to.have.property('totalFat', 0);
      expect(result).to.have.property('meals').that.is.an('array').that.is.empty;
    });
  });

  describe('getWeeklyNutrition', () => {
    it('should return weekly nutrition summary', async () => {
      const userId = 1;
      const startDate = '2025-03-03';
      const endDate = '2025-03-09';
      
      // Mock meals for different days of the week
      const meals = [
        {
          id: 1,
          name: 'Monday Breakfast',
          userId: 1,
          Foods: [{ id: 1, calories: 300, protein: 20, carbs: 30, fat: 10 }],
          createdAt: new Date(`${startDate}T08:00:00`)
        },
        {
          id: 2,
          name: 'Wednesday Lunch',
          userId: 1,
          Foods: [{ id: 2, calories: 500, protein: 25, carbs: 50, fat: 20 }],
          createdAt: new Date('2025-03-05T12:00:00')
        }
      ];
      
      mealFindStub.resolves(meals);
      
      const result = await nutritionService.getWeeklyNutrition(userId, startDate, endDate);
      
      expect(result).to.have.property('dailySummaries').that.is.an('array');
      expect(result.dailySummaries).to.have.length(7); // One entry per day of the week
      expect(result).to.have.property('totalCalories', 800);
      expect(result).to.have.property('averageDailyCalories', 800/7);
      expect(mealFindStub.calledOnce).to.be.true;
    });
  });

  describe('getMonthlyNutrition', () => {
    it('should return monthly nutrition summary', async () => {
      const userId = 1;
      const year = 2025;
      const month = 3; // March
      
      // Mock some sample meals throughout the month
      const meals = [
        {
          id: 1,
          name: 'Early Month Meal',
          userId: 1,
          Foods: [{ id: 1, calories: 300, protein: 20, carbs: 30, fat: 10 }],
          createdAt: new Date(`${year}-${month.toString().padStart(2, '0')}-01T08:00:00`)
        },
        {
          id: 2,
          name: 'Mid Month Meal',
          userId: 1,
          Foods: [{ id: 2, calories: 500, protein: 25, carbs: 50, fat: 20 }],
          createdAt: new Date(`${year}-${month.toString().padStart(2, '0')}-15T12:00:00`)
        }
      ];
      
      mealFindStub.resolves(meals);
      
      const result = await nutritionService.getMonthlyNutrition(userId, year, month);
      
      expect(result).to.have.property('weeklySummaries').that.is.an('array');
      expect(result).to.have.property('totalCalories', 800);
      expect(result).to.have.property('dailyAverageCalories');
      expect(mealFindStub.calledOnce).to.be.true;
    });
  });

  describe('getNutrientBreakdown', () => {
    it('should return detailed nutrient breakdown for a meal', async () => {
      const mealId = 1;
      
      const nutrients = [
        { id: 1, name: 'Vitamin A', unit: 'IU' },
        { id: 2, name: 'Vitamin C', unit: 'mg' }
      ];
      
      const foodNutrients = [
        { foodId: 1, nutrientId: 1, amount: 100 },
        { foodId: 1, nutrientId: 2, amount: 10 },
        { foodId: 2, nutrientId: 1, amount: 50 },
        { foodId: 2, nutrientId: 2, amount: 30 }
      ];
      
      const meal = {
        id: 1,
        name: 'Breakfast',
        Foods: [
          { id: 1, name: 'Eggs', FoodNutrients: [foodNutrients[0], foodNutrients[1]] },
          { id: 2, name: 'Orange', FoodNutrients: [foodNutrients[2], foodNutrients[3]] }
        ]
      };
      
      const findOneMealStub = sinon.stub(Meal, 'findOne').resolves(meal);
      nutrientFindStub.resolves(nutrients);
      
      const result = await nutritionService.getNutrientBreakdown(mealId);
      
      expect(result).to.have.property('mealName', 'Breakfast');
      expect(result).to.have.property('nutrients').that.is.an('array');
      expect(result.nutrients).to.have.length(2); // Two nutrients
      expect(findOneMealStub.calledOnce).to.be.true;
    });
    
    it('should return null if meal not found', async () => {
      const findOneMealStub = sinon.stub(Meal, 'findOne').resolves(null);
      
      const result = await nutritionService.getNutrientBreakdown(999);
      
      expect(result).to.be.null;
      expect(findOneMealStub.calledOnce).to.be.true;
    });
  });

  describe('getUserNutritionGoals', () => {
    it('should return user nutrition goals', async () => {
      const userId = 1;
      
      const user = {
        id: 1,
        UserProfile: {
          dailyCalorieGoal: 2000,
          dailyProteinGoal: 150,
          dailyCarbGoal: 200,
          dailyFatGoal: 70
        }
      };
      
      const findOneUserStub = sinon.stub(require('../../src/models/User'), 'findOne').resolves(user);
      
      const result = await nutritionService.getUserNutritionGoals(userId);
      
      expect(result).to.have.property('calorieGoal', 2000);
      expect(result).to.have.property('proteinGoal', 150);
      expect(result).to.have.property('carbGoal', 200);
      expect(result).to.have.property('fatGoal', 70);
      expect(findOneUserStub.calledOnce).to.be.true;
    });
  });

  describe('compareWithGoals', () => {
    it('should compare nutrition with user goals', async () => {
      const userId = 1;
      const nutritionData = {
        totalCalories: 1800,
        totalProtein: 120,
        totalCarbs: 180,
        totalFat: 60
      };
      
      const goals = {
        calorieGoal: 2000,
        proteinGoal: 150,
        carbGoal: 200,
        fatGoal: 70
      };
      
      const getUserNutritionGoalsStub = sinon.stub(nutritionService, 'getUserNutritionGoals').resolves(goals);
      
      const result = await nutritionService.compareWithGoals(userId, nutritionData);
      
      expect(result).to.have.property('caloriePercentage', 90);
      expect(result).to.have.property('proteinPercentage', 80);
      expect(result).to.have.property('carbPercentage', 90);
      expect(result).to.have.property('fatPercentage', 85.71428571428571);
      expect(getUserNutritionGoalsStub.calledOnce).to.be.true;
    });
  });
});