// tests/controllers/nutritionController.test.js
const request = require('supertest');
const app = require('../../src/app');
const nutritionService = require('../../src/services/nutritionService');
const { generateAuthToken } = require('../../src/services/authService');
const { mockNutritionSummary } = require('../mocks/nutritionMocks');

// Mock nutritionService
jest.mock('../../src/services/nutritionService');

describe('Nutrition Controller', () => {
  let token;
  const userId = '123456789';

  beforeEach(() => {
    token = generateAuthToken({ id: userId, email: 'test@example.com' });
    jest.clearAllMocks();
  });

  describe('GET /api/nutrition/daily', () => {
    it('should return daily nutrition summary', async () => {
      nutritionService.getDailyNutrition.mockResolvedValue(mockNutritionSummary);

      const response = await request(app)
        .get('/api/nutrition/daily?date=2023-03-10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockNutritionSummary);
      expect(nutritionService.getDailyNutrition).toHaveBeenCalledWith(
        userId,
        '2023-03-10'
      );
    });

    it('should use current date if no date provided', async () => {
      nutritionService.getDailyNutrition.mockResolvedValue(mockNutritionSummary);

      await request(app)
        .get('/api/nutrition/daily')
        .set('Authorization', `Bearer ${token}`);

      expect(nutritionService.getDailyNutrition).toHaveBeenCalledWith(
        userId,
        expect.any(String) // Today's date in YYYY-MM-DD format
      );
    });
  });

  describe('GET /api/nutrition/weekly', () => {
    it('should return weekly nutrition summary', async () => {
      const weeklySummary = [mockNutritionSummary, mockNutritionSummary];
      nutritionService.getWeeklyNutrition.mockResolvedValue(weeklySummary);

      const response = await request(app)
        .get('/api/nutrition/weekly?startDate=2023-03-05')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(nutritionService.getWeeklyNutrition).toHaveBeenCalledWith(
        userId,
        '2023-03-05'
      );
    });

    it('should use current week if no start date provided', async () => {
      nutritionService.getWeeklyNutrition.mockResolvedValue([mockNutritionSummary]);

      await request(app)
        .get('/api/nutrition/weekly')
        .set('Authorization', `Bearer ${token}`);

      expect(nutritionService.getWeeklyNutrition).toHaveBeenCalledWith(
        userId,
        expect.any(String)
      );
    });
  });

  describe('GET /api/nutrition/monthly', () => {
    it('should return monthly nutrition summary', async () => {
      const monthlySummary = { 
        days: [mockNutritionSummary, mockNutritionSummary],
        averages: { calories: 2000, protein: 100 }
      };
      nutritionService.getMonthlyNutrition.mockResolvedValue(monthlySummary);

      const response = await request(app)
        .get('/api/nutrition/monthly?month=3&year=2023')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.days.length).toBe(2);
      expect(response.body.data.averages).toBeDefined();
      expect(nutritionService.getMonthlyNutrition).toHaveBeenCalledWith(
        userId,
        3,
        2023
      );
    });

    it('should use current month and year if not provided', async () => {
      nutritionService.getMonthlyNutrition.mockResolvedValue({
        days: [mockNutritionSummary],
        averages: { calories: 2000 }
      });

      await request(app)
        .get('/api/nutrition/monthly')
        .set('Authorization', `Bearer ${token}`);

      expect(nutritionService.getMonthlyNutrition).toHaveBeenCalledWith(
        userId,
        expect.any(Number), // Current month
        expect.any(Number)  // Current year
      );
    });
  });
});