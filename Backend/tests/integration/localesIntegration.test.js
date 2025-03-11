const request = require('supertest');
const app = require('../../src/app');
const { connectDB, closeDB, clearDB } = require('../testUtils/dbHandler');
const User = require('../../src/models/User');
const Food = require('../../src/models/Food');
const Locale = require('../../src/models/Locale');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { config } = require('../../src/config/env');

describe('Locales API Integration Tests', () => {
  let authToken;
  let adminAuthToken;
  let userId;
  let adminUserId;
  let testLocales = [];

  beforeAll(async () => {
    await connectDB();
    
    // Create test user
    const testUser = new User({
      email: 'locale_test@example.com',
      password: '$2b$10$XpC5oQQW1SjvhxUQ.oiIOeiZwsQ4Mf.F.NQNFpOuFkPf1KOI5hhyG', // hashed 'testpassword'
      name: 'Locale Tester',
      role: 'user'
    });
    
    const savedUser = await testUser.save();
    userId = savedUser._id;
    
    // Create admin user
    const adminUser = new User({
      email: 'locale_admin@example.com',
      password: '$2b$10$XpC5oQQW1SjvhxUQ.oiIOeiZwsQ4Mf.F.NQNFpOuFkPf1KOI5hhyG', // hashed 'testpassword'
      name: 'Locale Admin',
      role: 'admin'
    });
    
    const savedAdmin = await adminUser.save();
    adminUserId = savedAdmin._id;
    
    // Generate JWT tokens
    authToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '1d' });
    adminAuthToken = jwt.sign({ id: adminUserId }, config.JWT_SECRET, { expiresIn: '1d' });
    
    // Create test locales
    const localeData = [
      {
        code: 'en-US',
        name: 'English (United States)',
        description: 'US-based food database',
        isActive: true,
        measurementSystem: 'imperial'
      },
      {
        code: 'en-GB',
        name: 'English (United Kingdom)',
        description: 'UK-based food database',
        isActive: true,
        measurementSystem: 'metric'
      },
      {
        code: 'es-ES',
        name: 'Spanish (Spain)',
        description: 'Spain-based food database',
        isActive: true,
        measurementSystem: 'metric'
      },
      {
        code: 'fr-FR',
        name: 'French (France)',
        description: 'France-based food database',
        isActive: false,
        measurementSystem: 'metric'
      }
    ];
    
    for (const locale of localeData) {
      const newLocale = new Locale(locale);
      const savedLocale = await newLocale.save();
      testLocales.push(savedLocale);
    }
    
    // Create foods with different locales
    const foodData = [
      {
        name: 'Apple',
        locale: 'en-US',
        calories: 95,
        servingSize: 100,
        servingUnit: 'g',
        category: 'fruits',
        nutrients: {
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.0
        }
      },
      {
        name: 'Apple',
        locale: 'en-GB',
        calories: 95,
        servingSize: 100,
        servingUnit: 'g',
        category: 'fruits',
        nutrients: {
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.0
        }
      },
      {
        name: 'Manzana',
        locale: 'es-ES',
        calories: 95,
        servingSize: 100,
        servingUnit: 'g',
        category: 'frutas',
        nutrients: {
          protein: 0.5,
          carbs: 25,
          fat: 0.3,
          fiber: 4.0
        }
      },
      {
        name: 'Chicken Breast',
        locale: 'en-US',
        calories: 165,
        servingSize: 100,
        servingUnit: 'g',
        category: 'meats',
        nutrients: {
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        }
      },
      {
        name: 'Pechuga de Pollo',
        locale: 'es-ES',
        calories: 165,
        servingSize: 100,
        servingUnit: 'g',
        category: 'carnes',
        nutrients: {
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        }
      }
    ];
    
    for (const food of foodData) {
      await Food.create(food);
    }
  });
  
  afterAll(async () => {
    await clearDB();
    await closeDB();
  });
  
  describe('GET /api/locales', () => {
    it('should return list of all active locales', async () => {
      const res = await request(app)
        .get('/api/locales')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      
      // Should only return active locales
      const inactiveLocales = res.body.data.filter(locale => !locale.isActive);
      expect(inactiveLocales.length).toBe(0);
      
      // Check structure of returned locale objects
      const locale = res.body.data[0];
      expect(locale).toHaveProperty('code');
      expect(locale).toHaveProperty('name');
      expect(locale).toHaveProperty('description');
      expect(locale).toHaveProperty('measurementSystem');
    });
    
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/locales');
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  describe('GET /api/locales/all', () => {
    it('should return all locales (including inactive) for admin', async () => {
      const res = await request(app)
        .get('/api/locales/all')
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      
      // Should include inactive locales
      const inactiveLocales = res.body.data.filter(locale => !locale.isActive);
      expect(inactiveLocales.length).toBeGreaterThan(0);
    });
    
    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/locales/all')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
    });
  });
  
  describe('GET /api/locales/:id', () => {
    it('should return a specific locale by ID', async () => {
      const localeId = testLocales[0]._id;
      
      const res = await request(app)
        .get(`/api/locales/${localeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', localeId.toString());
      expect(res.body.data).toHaveProperty('code');
      expect(res.body.data).toHaveProperty('name');
    });
    
    it('should return 404 for non-existent locale ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/locales/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });
  
  describe('GET /api/locales/:code/foods', () => {
    it('should return foods filtered by locale code', async () => {
      const localeCode = 'es-ES';
      
      const res = await request(app)
        .get(`/api/locales/${localeCode}/foods`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // All returned foods should have the specified locale
      for (const food of res.body.data) {
        expect(food.locale).toEqual(localeCode);
      }
      
      // Should include Spanish foods
      const spanishFoodNames = res.body.data.map(food => food.name);
      expect(spanishFoodNames).toContain('Manzana');
      expect(spanishFoodNames).toContain('Pechuga de Pollo');
    });
    
    it('should support pagination', async () => {
      const localeCode = 'en-US';
      
      const res = await request(app)
        .get(`/api/locales/${localeCode}/foods?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('totalItems');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(res.body.pagination).toHaveProperty('currentPage', 1);
      expect(res.body.pagination).toHaveProperty('pageSize', 1);
    });
    
    it('should support category filtering', async () => {
      const localeCode = 'en-US';
      const category = 'fruits';
      
      const res = await request(app)
        .get(`/api/locales/${localeCode}/foods?category=${category}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // All returned foods should have the specified locale and category
      for (const food of res.body.data) {
        expect(food.locale).toEqual(localeCode);
        expect(food.category).toEqual(category);
      }
    });
    
    it('should return 404 for invalid locale code', async () => {
      const invalidCode = 'xx-XX';
      
      const res = await request(app)
        .get(`/api/locales/${invalidCode}/foods`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });
  
  describe('POST /api/locales', () => {
    it('should create a new locale when requested by admin', async () => {
      const newLocale = {
        code: 'de-DE',
        name: 'German (Germany)',
        description: 'German food database',
        isActive: true,
        measurementSystem: 'metric'
      };
      
      const res = await request(app)
        .post('/api/locales')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(newLocale);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('code', newLocale.code);
      expect(res.body.data).toHaveProperty('name', newLocale.name);
      
      // Verify locale was actually created in the database
      const createdLocale = await Locale.findOne({ code: newLocale.code });
      expect(createdLocale).not.toBeNull();
    });
    
    it('should return 403 for non-admin users', async () => {
      const newLocale = {
        code: 'it-IT',
        name: 'Italian (Italy)',
        description: 'Italian food database',
        isActive: true,
        measurementSystem: 'metric'
      };
      
      const res = await request(app)
        .post('/api/locales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newLocale);
      
      expect(res.statusCode).toEqual(403);
    });
    
    it('should return 400 for invalid locale data', async () => {
      const invalidLocale = {
        // Missing required code
        name: 'Invalid Locale',
        description: 'This locale is invalid',
        isActive: true
      };
      
      const res = await request(app)
        .post('/api/locales')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(invalidLocale);
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('PUT /api/locales/:id', () => {
    it('should update an existing locale when requested by admin', async () => {
      const localeId = testLocales[0]._id;
      const updateData = {
        description: 'Updated description for US locale',
        isActive: true
      };
      
      const res = await request(app)
        .put(`/api/locales/${localeId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', localeId.toString());
      expect(res.body.data).toHaveProperty('description', updateData.description);
      
      // Verify locale was actually updated in the database
      const updatedLocale = await Locale.findById(localeId);
      expect(updatedLocale.description).toEqual(updateData.description);
    });
    
    it('should return 403 for non-admin users', async () => {
      const localeId = testLocales[0]._id;
      const updateData = {
        description: 'This update should fail',
        isActive: false
      };
      
      const res = await request(app)
        .put(`/api/locales/${localeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(403);
    });
    
    it('should return 404 for non-existent locale ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        description: 'Updated description',
        isActive: true
      };
      
      const res = await request(app)
        .put(`/api/locales/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(404);
    });
  });
  
  describe('DELETE /api/locales/:id', () => {
    it('should delete a locale when requested by admin', async () => {
      // Create a temporary locale to delete
      const tempLocale = await Locale.create({
        code: 'temp-LOCALE',
        name: 'Temporary Locale',
        description: 'This locale will be deleted',
        isActive: true,
        measurementSystem: 'metric'
      });
      
      const res = await request(app)
        .delete(`/api/locales/${tempLocale._id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify locale was actually deleted from the database
      const deletedLocale = await Locale.findById(tempLocale._id);
      expect(deletedLocale).toBeNull();
    });
    
    it('should return 403 for non-admin users', async () => {
      const localeId = testLocales[0]._id;
      
      const res = await request(app)
        .delete(`/api/locales/${localeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
    });
    
    it('should return 404 for non-existent locale ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/locales/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.statusCode).toEqual(404);
    });
  });
  
  describe('GET /api/locales/stats', () => {
    it('should return statistics about locales (admin only)', async () => {
      const res = await request(app)
        .get('/api/locales/stats')
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalLocales');
      expect(res.body.data).toHaveProperty('activeLocales');
      expect(res.body.data).toHaveProperty('foodCountByLocale');
      expect(typeof res.body.data.totalLocales).toBe('number');
      expect(Array.isArray(res.body.data.foodCountByLocale)).toBe(true);
    });
    
    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/locales/stats')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
    });
  });
  
  describe('POST /api/locales/:id/toggle', () => {
    it('should toggle locale active status when requested by admin', async () => {
      const localeId = testLocales[3]._id; // Using fr-FR which was set as inactive
      const initialState = await Locale.findById(localeId);
      
      const res = await request(app)
        .post(`/api/locales/${localeId}/toggle`)
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isActive', !initialState.isActive);
      
      // Verify the status was actually toggled in the database
      const updatedLocale = await Locale.findById(localeId);
      expect(updatedLocale.isActive).toEqual(!initialState.isActive);
    });
    
    it('should return 403 for non-admin users', async () => {
      const localeId = testLocales[0]._id;
      
      const res = await request(app)
        .post(`/api/locales/${localeId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(403);
    });
  });
});