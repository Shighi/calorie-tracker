// tests/controllers/mealController.test.js
const request = require('supertest');
const app = require('../../src/app');
const mealService = require('../../src/services/mealService');
const { generateAuthToken } = require('../../src/services/authService');
const { mockMeal, mockMealWithDetails } = require('../mocks/mealMocks');

// Mock mealService
jest.mock('../../src/services/mealService');

describe('Meal Controller', () => {
  let token;
  const userId = '123456789';

  beforeEach(() => {
    token = generateAuthToken({ id: userId, email: 'test@example.com' });
    jest.clearAllMocks();
  });

  describe('GET /api/meals', () => {
    it('should return all meals for the user', async () => {
      const meals = [mockMeal, { ...mockMeal, id: '2' }];
      mealService.getUserMeals.mockResolvedValue(meals);

      const response = await request(app)
        .get('/api/meals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(mealService.getUserMeals).toHaveBeenCalledWith(userId, expect.any(Object));
    });

    it('should handle pagination parameters', async () => {
      mealService.getUserMeals.mockResolvedValue([mockMeal]);

      await request(app)
        .get('/api/meals?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(mealService.getUserMeals).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          page: '2',
          limit: '10'
        })
      );
    });
  });

  describe('GET /api/meals/:id', () => {
    it('should return a specific meal', async () => {
      mealService.getMealById.mockResolvedValue(mockMealWithDetails);

      const response = await request(app)
        .get(`/api/meals/${mockMeal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mockMeal.id);
      expect(mealService.getMealById).toHaveBeenCalledWith(mockMeal.id, userId);
    });

    it('should return 404 if meal not found', async () => {
      mealService.getMealById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/meals/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/meals', () => {
    it('should create a new meal', async () => {
      const mealData = {
        name: 'Lunch',
        date: '2023-03-10T12:00:00Z',
        foods: [
          { foodId: '123', quantity: 100, unit: 'g' },
          { foodId: '456', quantity: 200, unit: 'ml' }
        ]
      };

      mealService.createMeal.mockResolvedValue({ id: 'new-meal-id', ...mealData });

      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${token}`)
        .send(mealData);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('new-meal-id');
      expect(mealService.createMeal).toHaveBeenCalledWith(mealData, userId);
    });

    it('should return 400 for invalid meal data', async () => {
      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Invalid Meal' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/meals/:id', () => {
    it('should update an existing meal', async () => {
      const mealData = {
        name: 'Updated Lunch',
        foods: [{ foodId: '789', quantity: 150, unit: 'g' }]
      };

      mealService.updateMeal.mockResolvedValue({ ...mockMeal, ...mealData });

      const response = await request(app)
        .put(`/api/meals/${mockMeal.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(mealData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Lunch');
      expect(mealService.updateMeal).toHaveBeenCalledWith(mockMeal.id, mealData, userId);
    });

    it('should return 404 if meal not found for update', async () => {
      mealService.updateMeal.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/meals/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Meal' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/meals/:id', () => {
    it('should delete a meal', async () => {
      mealService.deleteMeal.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/meals/${mockMeal.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(mealService.deleteMeal).toHaveBeenCalledWith(mockMeal.id, userId);
    });

    it('should return 404 if meal not found for deletion', async () => {
      mealService.deleteMeal.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/meals/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});