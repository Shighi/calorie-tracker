const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Food = require('../../src/models/Food');
const User = require('../../src/models/User');
const Meal = require('../../src/models/Meal');
const { connectDB, closeDB, clearDB } = require('../testUtils/dbHandler');
const { generateAuthToken } = require('../testUtils/authHelper');
const { seedTestData } = require('../testUtils/seedHelper');

let userToken;
let adminToken;

// Performance timing helper
const measureQueryTime = async (queryFn) => {
  const start = process.hrtime();
  const result = await queryFn();
  const diff = process.hrtime(start);
  const time = diff[0] * 1e3 + diff[1] / 1e6; // Convert to milliseconds
  return { result, time };
};

describe('Database Query Optimization Tests', () => {
  beforeAll(async () => {
    await connectDB();
    
    // Generate tokens
    userToken = await generateAuthToken('user');
    adminToken = await generateAuthToken('admin');
    
    // Seed test data
    await seedTestData({
      foodCount: 1000,
      userCount: 50,
      mealLogsPerUser: 30
    });
  });

  afterAll(async () => {
    await clearDB();
    await closeDB();
  });

  describe('Index Performance Tests', () => {
    it('should efficiently query foods by name using text index', async () => {
      // First query (cold)
      const { result: foods, time: coldTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods/search')
          .query({ name: 'apple' })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      expect(foods.body.data.length).toBeGreaterThan(0);
      
      // Second query (warm, should be faster with index)
      const { time: warmTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods/search')
          .query({ name: 'apple' })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Warm query should be significantly faster than cold query
      // This is just a general guideline - actual numbers would depend on your system
      expect(warmTime).toBeLessThan(coldTime * 0.8);
    });

    it('should efficiently query foods by nutrient values', async () => {
      const { result: foods, time } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods')
          .query({ 
            minCalories: 100,
            maxCalories: 300,
            minProtein: 5
          })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      expect(foods.body.data.length).toBeGreaterThan(0);
      expect(time).toBeLessThan(100); // Example threshold in ms
    });

    it('should efficiently query user meal logs with date range', async () => {
      const { result: mealLogs, time } = await measureQueryTime(() => 
        request(app)
          .get('/api/meals')
          .query({ 
            startDate: '2025-01-01',
            endDate: '2025-03-10'
          })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      expect(mealLogs.body.data.length).toBeGreaterThan(0);
      expect(time).toBeLessThan(100); // Example threshold in ms
    });
  });

  describe('Query Optimization Tests', () => {
    it('should use projection to limit returned fields for better performance', async () => {
      const { result: foodsWithProjection, time: projectionTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods')
          .query({ 
            fields: 'name,nutrients.calories,nutrients.protein'
          })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Check that only requested fields are returned
      expect(foodsWithProjection.body.data[0]).toHaveProperty('name');
      expect(foodsWithProjection.body.data[0].nutrients).toHaveProperty('calories');
      expect(foodsWithProjection.body.data[0].nutrients).toHaveProperty('protein');
      expect(foodsWithProjection.body.data[0].nutrients).not.toHaveProperty('fat');
      
      // Now perform query without projection
      const { time: fullTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Projection query should be faster
      expect(projectionTime).toBeLessThan(fullTime);
    });

    it('should implement pagination correctly for large result sets', async () => {
      // Get first page
      const page1 = await request(app)
        .get('/api/foods')
        .query({ 
          page: 1,
          limit: 20
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Get second page
      const page2 = await request(app)
        .get('/api/foods')
        .query({ 
          page: 2,
          limit: 20
        })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Pages should have correct number of items
      expect(page1.body.data.length).toBe(20);
      expect(page2.body.data.length).toBe(20);
      
      // Pages should have different items
      const page1Ids = page1.body.data.map(food => food._id);
      const page2Ids = page2.body.data.map(food => food._id);
      
      // No ID should be in both pages
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
      
      // Should include metadata for pagination
      expect(page1.body).toHaveProperty('totalCount');
      expect(page1.body).toHaveProperty('totalPages');
      expect(page1.body).toHaveProperty('currentPage', 1);
    });
  });

  describe('Caching Tests', () => {
    it('should cache frequently accessed food data', async () => {
      // First request to popular food item (cold cache)
      const { time: coldTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods/popular')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Second request (should be served from cache)
      const { time: cachedTime } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods/popular')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Cached response should be significantly faster
      expect(cachedTime).toBeLessThan(coldTime * 0.5);
      
      // Headers should indicate cache hit
      const response = await request(app)
        .get('/api/foods/popular')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.headers).toHaveProperty('x-cache-status', 'HIT');
    });

    it('should invalidate cache when data is updated', async () => {
      // Get a popular food to update
      const popularFoods = await request(app)
        .get('/api/foods/popular')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      const foodToUpdate = popularFoods.body.data[0];
      
      // Update the food
      await request(app)
        .put(`/api/foods/${foodToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `${foodToUpdate.name} - Updated`,
          nutrients: foodToUpdate.nutrients
        })
        .expect(200);
      
      // Get popular foods again - should be cache miss after update
      const response = await request(app)
        .get('/api/foods/popular')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.headers).toHaveProperty('x-cache-status', 'MISS');
      
      // Should include the updated food name
      const updatedFood = response.body.data.find(food => food._id === foodToUpdate._id);
      expect(updatedFood.name).toBe(`${foodToUpdate.name} - Updated`);
    });
  });

  describe('Complex Query Performance', () => {
    it('should efficiently execute complex aggregation for nutrition reports', async () => {
      const { time } = await measureQueryTime(() => 
        request(app)
          .get('/api/nutrition/weekly')
          .query({ 
            startDate: '2025-03-01',
            endDate: '2025-03-07'
          })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Complex aggregation should complete within reasonable time
      expect(time).toBeLessThan(300); // Example threshold in ms
    });

    it('should handle complex filtering combinations efficiently', async () => {
      const { time } = await measureQueryTime(() => 
        request(app)
          .get('/api/foods')
          .query({ 
            category: 'fruits',
            minCalories: 50,
            maxCalories: 150,
            minProtein: 0,
            maxProtein: 5,
            minCarbs: 10,
            locale: 'en-US',
            sort: 'calories',
            order: 'asc',
            page: 1,
            limit: 20
          })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Complex filtering should complete within reasonable time
      expect(time).toBeLessThan(200); // Example threshold in ms
    });
  });

  describe('Connection Pooling Tests', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      // Make 10 concurrent requests
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/foods')
            .query({ page: i + 1, limit: 10 })
            .set('Authorization', `Bearer ${userToken}`)
        );
      }
      
      const { time } = await measureQueryTime(async () => {
        return Promise.all(requests);
      });
      
      // Average time per request should be reasonable
      const avgTime = time / 10;
      expect(avgTime).toBeLessThan(50); // Example threshold in ms
    });
  });

  describe('Lazy Loading Tests', () => {
    it('should implement lazy loading for nested resources', async () => {
      // Get a meal with lazy loaded food details
      const { result: meal } = await measureQueryTime(() => 
        request(app)
          .get('/api/meals/latest')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Should have food IDs but not full food details initially
      expect(meal.body.data).toHaveProperty('foodItems');
      expect(meal.body.data.foodItems[0]).toHaveProperty('foodId');
      expect(meal.body.data.foodItems[0]).not.toHaveProperty('food');
      
      // Now request with expanded food details
      const { result: mealWithFoods } = await measureQueryTime(() => 
        request(app)
          .get('/api/meals/latest')
          .query({ expand: 'foodItems.food' })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
      );
      
      // Should have full food details now
      expect(mealWithFoods.body.data.foodItems[0]).toHaveProperty('food');
      expect(mealWithFoods.body.data.foodItems[0].food).toHaveProperty('name');
      expect(mealWithFoods.body.data.foodItems[0].food).toHaveProperty('nutrients');
    });
  });
});