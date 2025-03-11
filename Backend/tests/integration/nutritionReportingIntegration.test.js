const request = require('supertest');
const app = require('../../src/app');
const { connectDB, closeDB, clearDB } = require('../testUtils/dbHandler');
const User = require('../../src/models/User');
const Food = require('../../src/models/Food');
const Meal = require('../../src/models/Meal');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { config } = require('../../src/config/env');

describe('Nutrition Reporting API Integration Tests', () => {
  let authToken;
  let userId;
  let testFoods = [];
  let today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  let lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  beforeAll(async () => {
    await connectDB();
    
    // Create test user
    const testUser = new User({
      email: 'nutrition_test@example.com',
      password: '$2b$10$XpC5oQQW1SjvhxUQ.oiIOeiZwsQ4Mf.F.NQNFpOuFkPf1KOI5hhyG', // hashed 'testpassword'
      name: 'Nutrition Tester'
    });
    
    const savedUser = await testUser.save();
    userId = savedUser._id;
    
    // Generate JWT token
    authToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '1d' });
    
    // Create test foods
    const foodData = [
      {
        name: 'Apple',
        calories: 95,
        servingSize: 100,
        servingUnit: 'g',
        nutrients: {
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.0
        }
      },
      {
        name: 'Chicken Breast',
        calories: 165,
        servingSize: 100,
        servingUnit: 'g',
        nutrients: {
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        }
      },
      {
        name: 'Brown Rice',
        calories: 112,
        servingSize: 100,
        servingUnit: 'g',
        nutrients: {
          protein: 2.6,
          carbs: 23.5,
          fat: 0.9,
          fiber: 1.8
        }
      }
    ];
    
    for (const food of foodData) {
      const newFood = new Food({
        ...food,
        locale: 'en-US',
        category: 'test'
      });
      const savedFood = await newFood.save();
      testFoods.push(savedFood);
    }
    
    // Create meal logs across different dates
    const mealTimestamps = [
      { date: today, name: 'Today Breakfast' },
      { date: today, name: 'Today Lunch' },
      { date: yesterday, name: 'Yesterday Dinner' },
      { date: lastWeek, name: 'Last Week Lunch' },
      { date: lastMonth, name: 'Last Month Dinner' }
    ];
    
    for (const mealData of mealTimestamps) {
      // Create a meal with random foods
      await Meal.create({
        userId: userId,
        name: mealData.name,
        timestamp: mealData.date,
        foods: [
          {
            foodId: testFoods[0]._id,
            servingQty: 1,
            servingSize: testFoods[0].servingSize,
            servingUnit: testFoods[0].servingUnit
          },
          {
            foodId: testFoods[1]._id,
            servingQty: 0.5,
            servingSize: testFoods[1].servingSize,
            servingUnit: testFoods[1].servingUnit
          }
        ]
      });
    }
  });
  
  afterAll(async () => {
    await clearDB();
    await closeDB();
  });
  
  describe('GET /api/nutrition/daily', () => {
    it('should return daily nutritional summary', async () => {
      const res = await request(app)
        .get('/api/nutrition/daily')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data.summary).toHaveProperty('totalCalories');
      expect(res.body.data.summary).toHaveProperty('nutrients');
      expect(res.body.data.summary.nutrients).toHaveProperty('protein');
      expect(res.body.data.summary.nutrients).toHaveProperty('carbs');
      expect(res.body.data.summary.nutrients).toHaveProperty('fat');
    });
    
    it('should return nutritional summary for a specific date', async () => {
      const dateStr = yesterday.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const res = await request(app)
        .get(`/api/nutrition/daily?date=${dateStr}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data.date).toContain(dateStr);
    });
    
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/nutrition/daily');
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  describe('GET /api/nutrition/weekly', () => {
    it('should return weekly nutritional summary', async () => {
      const res = await request(app)
        .get('/api/nutrition/weekly')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('startDate');
      expect(res.body.data).toHaveProperty('endDate');
      expect(res.body.data).toHaveProperty('dailyBreakdown');
      expect(Array.isArray(res.body.data.dailyBreakdown)).toBe(true);
    });
    
    it('should return nutritional summary for a specific week', async () => {
      const startDate = new Date(lastWeek);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(lastWeek);
      endDate.setDate(endDate.getDate() + 3);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const res = await request(app)
        .get(`/api/nutrition/weekly?startDate=${startDateStr}&endDate=${endDateStr}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.startDate).toContain(startDateStr);
      expect(res.body.data.endDate).toContain(endDateStr);
    });
    
    it('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .get('/api/nutrition/weekly?startDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('GET /api/nutrition/monthly', () => {
    it('should return monthly nutritional summary', async () => {
      const res = await request(app)
        .get('/api/nutrition/monthly')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('month');
      expect(res.body.data).toHaveProperty('year');
      expect(res.body.data).toHaveProperty('weeklyBreakdown');
      expect(Array.isArray(res.body.data.weeklyBreakdown)).toBe(true);
    });
    
    it('should return nutritional summary for a specific month and year', async () => {
      const month = lastMonth.getMonth() + 1; // JavaScript months are 0-based
      const year = lastMonth.getFullYear();
      
      const res = await request(app)
        .get(`/api/nutrition/monthly?month=${month}&year=${year}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.month).toEqual(month);
      expect(res.body.data.year).toEqual(year);
    });
    
    it('should return 400 for invalid month parameter', async () => {
      const res = await request(app)
        .get('/api/nutrition/monthly?month=13')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('GET /api/nutrition/comparison', () => {
    it('should compare nutritional data between two date ranges', async () => {
      const startDate1 = lastMonth.toISOString().split('T')[0];
      const endDate1 = yesterday.toISOString().split('T')[0];
      const startDate2 = new Date(lastMonth);
      startDate2.setMonth(startDate2.getMonth() - 1);
      const endDate2 = new Date(lastMonth);
      endDate2.setDate(endDate2.getDate() - 1);
      
      const startDate2Str = startDate2.toISOString().split('T')[0];
      const endDate2Str = endDate2.toISOString().split('T')[0];
      
      const res = await request(app)
        .get(`/api/nutrition/comparison?startDate1=${startDate1}&endDate1=${endDate1}&startDate2=${startDate2Str}&endDate2=${endDate2Str}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('period1');
      expect(res.body.data).toHaveProperty('period2');
      expect(res.body.data).toHaveProperty('difference');
      expect(res.body.data).toHaveProperty('percentageChange');
    });
    
    it('should return 400 if required parameters are missing', async () => {
      const res = await request(app)
        .get('/api/nutrition/comparison?startDate1=2023-01-01&endDate1=2023-01-31')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('GET /api/nutrition/trends', () => {
    it('should return nutritional trends over time', async () => {
      const startDate = lastMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      const metric = 'calories';
      
      const res = await request(app)
        .get(`/api/nutrition/trends?startDate=${startDate}&endDate=${endDate}&metric=${metric}&interval=day`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('metric');
      expect(res.body.data).toHaveProperty('interval');
      expect(res.body.data).toHaveProperty('dataPoints');
      expect(Array.isArray(res.body.data.dataPoints)).toBe(true);
    });
    
    it('should support different time intervals (day, week, month)', async () => {
      const startDate = lastMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      const metric = 'protein';
      
      const res = await request(app)
        .get(`/api/nutrition/trends?startDate=${startDate}&endDate=${endDate}&metric=${metric}&interval=week`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.interval).toEqual('week');
    });
    
    it('should return 400 for invalid metric parameter', async () => {
      const startDate = lastMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const res = await request(app)
        .get(`/api/nutrition/trends?startDate=${startDate}&endDate=${endDate}&metric=invalidMetric&interval=day`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });
});