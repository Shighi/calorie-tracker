const request = require('supertest');
const mongoose = require('mongoose');
const nock = require('nock');
const app = require('../../src/app');
const Food = require('../../src/models/Food');
const { connectDB, closeDB, clearDB } = require('../testUtils/dbHandler');
const { generateAuthToken } = require('../testUtils/authHelper');

let adminToken;
let userToken;

// Mock data
const mockUSDAResponse = {
  foods: [
    {
      fdcId: 123456,
      description: 'Apple, raw',
      foodNutrients: [
        { nutrientId: 1003, nutrientName: 'Protein', value: 0.3 },
        { nutrientId: 1004, nutrientName: 'Fat', value: 0.2 },
        { nutrientId: 1005, nutrientName: 'Carbohydrates', value: 13.8 },
        { nutrientId: 1008, nutrientName: 'Energy', value: 52 }
      ]
    }
  ]
};

const mockOpenFoodFactsResponse = {
  product: {
    product_name: 'Organic Apple Juice',
    nutriments: {
      'energy-kcal_100g': 45,
      proteins_100g: 0.1,
      fat_100g: 0.1,
      carbohydrates_100g: 11.2
    }
  },
  status: 1
};

describe('External API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
    
    // Create tokens for testing
    adminToken = await generateAuthToken('admin');
    userToken = await generateAuthToken('user');
  });

  afterAll(async () => {
    await clearDB();
    await closeDB();
  });

  beforeEach(async () => {
    // Clear foods collection before each test
    await Food.deleteMany({});
    
    // Set up mocks for external APIs
    nock('https://api.nal.usda.gov')
      .get('/fdc/v1/foods/search')
      .query(true)
      .reply(200, mockUSDAResponse);
      
    nock('https://world.openfoodfacts.org')
      .get('/api/v0/product/3175680011480.json')
      .reply(200, mockOpenFoodFactsResponse);
  });

  afterEach(() => {
    // Clean up all mocks
    nock.cleanAll();
  });

  describe('USDA API Integration', () => {
    it('should fetch and normalize data from USDA API', async () => {
      const response = await request(app)
        .get('/api/external/usda/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('name', 'Apple, raw');
      expect(response.body.data[0]).toHaveProperty('nutrients');
      expect(response.body.data[0].nutrients).toHaveProperty('calories', 52);
    });

    it('should handle USDA API errors gracefully', async () => {
      // Override the mock to simulate an error
      nock.cleanAll();
      nock('https://api.nal.usda.gov')
        .get('/fdc/v1/foods/search')
        .query(true)
        .reply(500, { error: 'Internal server error' });
      
      const response = await request(app)
        .get('/api/external/usda/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(502);
      
      expect(response.body).toHaveProperty('message', 'Error fetching data from USDA API');
    });

    it('should cache USDA API responses', async () => {
      // First request
      await request(app)
        .get('/api/external/usda/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Clear nock to ensure second request doesn't hit actual API
      nock.cleanAll();
      
      // Second request should use cached data
      const response = await request(app)
        .get('/api/external/usda/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('source', 'cache');
    });
  });

  describe('Open Food Facts API Integration', () => {
    it('should fetch and normalize data from Open Food Facts API', async () => {
      const response = await request(app)
        .get('/api/external/openfoodfacts/product/3175680011480')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Organic Apple Juice');
      expect(response.body.data).toHaveProperty('nutrients');
      expect(response.body.data.nutrients).toHaveProperty('calories', 45);
    });

    it('should handle Open Food Facts API errors gracefully', async () => {
      // Override the mock to simulate an error
      nock.cleanAll();
      nock('https://world.openfoodfacts.org')
        .get('/api/v0/product/3175680011480.json')
        .reply(404, { status: 0, status_verbose: 'product not found' });
      
      const response = await request(app)
        .get('/api/external/openfoodfacts/product/3175680011480')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'Product not found in Open Food Facts database');
    });
  });

  describe('Food Import from External APIs', () => {
    it('should import a food item from USDA database', async () => {
      const response = await request(app)
        .post('/api/external/import/usda')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fdcId: 123456 })
        .expect(201);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Apple, raw');
      
      // Verify it was saved to our database
      const savedFood = await Food.findOne({ name: 'Apple, raw' });
      expect(savedFood).toBeTruthy();
      expect(savedFood.nutrients.calories).toBe(52);
    });

    it('should import a food item from Open Food Facts database', async () => {
      const response = await request(app)
        .post('/api/external/import/openfoodfacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ barcode: '3175680011480' })
        .expect(201);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Organic Apple Juice');
      
      // Verify it was saved to our database
      const savedFood = await Food.findOne({ name: 'Organic Apple Juice' });
      expect(savedFood).toBeTruthy();
      expect(savedFood.nutrients.calories).toBe(45);
    });

    it('should prevent non-admin users from importing foods', async () => {
      await request(app)
        .post('/api/external/import/usda')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fdcId: 123456 })
        .expect(403);
    });
  });

  describe('External API Fallback Mechanism', () => {
    it('should try alternate API when primary API fails', async () => {
      // Mock primary API (USDA) failure
      nock.cleanAll();
      nock('https://api.nal.usda.gov')
        .get('/fdc/v1/foods/search')
        .query(true)
        .reply(500, { error: 'Internal server error' });
      
      // Mock secondary API (Open Food Facts) success
      nock('https://world.openfoodfacts.org')
        .get('/api/v0/search')
        .query(true)
        .reply(200, {
          products: [mockOpenFoodFactsResponse.product],
          count: 1
        });
      
      const response = await request(app)
        .get('/api/external/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('source', 'openfoodfacts');
      expect(response.body.data[0]).toHaveProperty('name', 'Organic Apple Juice');
    });

    it('should return proper error when all external APIs fail', async () => {
      // Mock all APIs to fail
      nock.cleanAll();
      nock('https://api.nal.usda.gov')
        .get('/fdc/v1/foods/search')
        .query(true)
        .reply(500, { error: 'Internal server error' });
      
      nock('https://world.openfoodfacts.org')
        .get('/api/v0/search')
        .query(true)
        .reply(500, { error: 'Service unavailable' });
      
      const response = await request(app)
        .get('/api/external/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(502);
      
      expect(response.body).toHaveProperty('message', 'All external APIs are currently unavailable');
    });
  });

  describe('API Response Normalization', () => {
    it('should normalize different API formats to consistent structure', async () => {
      // First get USDA data
      const usdaResponse = await request(app)
        .get('/api/external/usda/search')
        .query({ query: 'apple' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Then get Open Food Facts data
      const offResponse = await request(app)
        .get('/api/external/openfoodfacts/product/3175680011480')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      // Both should have same structure
      expect(usdaResponse.body.data[0]).toHaveProperty('name');
      expect(usdaResponse.body.data[0]).toHaveProperty('nutrients');
      expect(usdaResponse.body.data[0].nutrients).toHaveProperty('calories');
      expect(usdaResponse.body.data[0].nutrients).toHaveProperty('protein');
      expect(usdaResponse.body.data[0].nutrients).toHaveProperty('fat');
      expect(usdaResponse.body.data[0].nutrients).toHaveProperty('carbohydrates');
      
      expect(offResponse.body.data).toHaveProperty('name');
      expect(offResponse.body.data).toHaveProperty('nutrients');
      expect(offResponse.body.data.nutrients).toHaveProperty('calories');
      expect(offResponse.body.data.nutrients).toHaveProperty('protein');
      expect(offResponse.body.data.nutrients).toHaveProperty('fat');
      expect(offResponse.body.data.nutrients).toHaveProperty('carbohydrates');
    });
  });
});