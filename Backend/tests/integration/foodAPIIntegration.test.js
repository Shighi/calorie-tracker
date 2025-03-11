const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const db = require('../../src/config/database');
const Food = require('../../src/models/Food');
const User = require('../../src/models/User');
const Locale = require('../../src/models/Locale');

describe('Foods API Integration Tests', () => {
  let adminToken;
  let userToken;
  let localeId;

  before(async () => {
    // Clear data before tests
    await Food.destroy({ where: {}, force: true });
    
    // Create a locale
    const locale = await Locale.create({
      name: 'Test Locale',
      code: 'TEST',
      isActive: true
    });
    localeId = locale.id;
    
    // Create admin user
    await User.destroy({ where: { email: 'admin-test@example.com' }, force: true });
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
      });
    
    // Create regular user
    await User.destroy({ where: { email: 'regular-test@example.com' }, force: true });
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'regular-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Regular',
        lastName: 'User'
      });
    
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-test@example.com',
        password: 'SecurePassword123!'
      });
    
    adminToken = adminLogin.body.data.token;
    
    // Login as regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'regular-test@example.com',
        password: 'SecurePassword123!'
      });
    
    userToken = userLogin.body.data.token;
    
    // Create some test foods
    await Food.bulkCreate([
      {
        name: 'Apple',
        description: 'Fresh red apple',
        calories: 52,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Fruits',
        nutrients: JSON.stringify({
          protein: 0.3,
          fat: 0.2,
          carbohydrates: 13.8,
          sugar: 10.4,
          fiber: 2.4
        })
      },
      {
        name: 'Banana',
        description: 'Yellow banana',
        calories: 89,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Fruits',
        nutrients: JSON.stringify({
          protein: 1.1,
          fat: 0.3,
          carbohydrates: 22.8,
          sugar: 12.2,
          fiber: 2.6
        })
      },
      {
        name: 'Chicken Breast',
        description: 'Skinless chicken breast',
        calories: 165,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Proteins',
        nutrients: JSON.stringify({
          protein: 31,
          fat: 3.6,
          carbohydrates: 0,
          sugar: 0,
          fiber: 0
        })
      }
    ]);
  });

  after(async () => {
    // Clean up after tests
    await Food.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: 'admin-test@example.com' }, force: true });
    await User.destroy({ where: { email: 'regular-test@example.com' }, force: true });
    await Locale.destroy({ where: { id: localeId }, force: true });
  });

  describe('GET /api/foods', () => {
    it('should retrieve all foods', async () => {
      const response = await request(app)
        .get('/api/foods')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(3);
      expect(response.body.data[0]).to.have.property('name');
      expect(response.body.data[0]).to.have.property('calories');
    });

    it('should filter foods by category', async () => {
      const response = await request(app)
        .get('/api/foods?category=Fruits')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(2);
      expect(response.body.data[0].category).to.equal('Fruits');
    });

    it('should filter foods by locale', async () => {
      const response = await request(app)
        .get(`/api/foods?localeId=${localeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(3);
    });

    it('should search foods by name', async () => {
      const response = await request(app)
        .get('/api/foods?search=Apple')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(1);
      expect(response.body.data[0].name).to.equal('Apple');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/foods?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.equal(2);
      expect(response.body).to.have.property('pagination');
      expect(response.body.pagination).to.have.property('totalItems');
      expect(response.body.pagination).to.have.property('totalPages');
      expect(response.body.pagination).to.have.property('currentPage', 1);
      expect(response.body.pagination).to.have.property('itemsPerPage', 2);
    });
  });

  describe('GET /api/foods/:id', () => {
    let foodId;

    before(async () => {
      const food = await Food.findOne({ where: { name: 'Apple' } });
      foodId = food.id;
    });

    it('should retrieve a specific food by ID', async () => {
      const response = await request(app)
        .get(`/api/foods/${foodId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', foodId);
      expect(response.body.data).to.have.property('name', 'Apple');
      expect(response.body.data).to.have.property('nutrients');
      expect(response.body.data.nutrients).to.have.property('protein');
      expect(response.body.data.nutrients).to.have.property('carbohydrates');
    });

    it('should return 404 for non-existent food ID', async () => {
      const response = await request(app)
        .get('/api/foods/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('not found');
    });
  });

  describe('POST /api/foods', () => {
    it('should allow admins to create new food', async () => {
      const newFood = {
        name: 'Salmon',
        description: 'Wild caught salmon',
        calories: 208,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Seafood',
        nutrients: {
          protein: 20,
          fat: 13,
          carbohydrates: 0,
          sugar: 0,
          fiber: 0
        }
      };

      const response = await request(app)
        .post('/api/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newFood)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Food created successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('name', 'Salmon');
    });

    it('should prevent regular users from creating foods', async () => {
      const newFood = {
        name: 'Avocado',
        description: 'Fresh avocado',
        calories: 160,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Fruits'
      };

      const response = await request(app)
        .post('/api/foods')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newFood)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('permission');
    });

    it('should validate required fields', async () => {
      const invalidFood = {
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidFood)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('required');
    });
  });

  describe('PUT /api/foods/:id', () => {
    let foodId;

    before(async () => {
      const food = await Food.findOne({ where: { name: 'Banana' } });
      foodId = food.id;
    });

    it('should allow admins to update food', async () => {
      const updateData = {
        description: 'Updated banana description',
        calories: 90
      };

      const response = await request(app)
        .put(`/api/foods/${foodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Food updated successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('description', 'Updated banana description');
      expect(response.body.data).to.have.property('calories', 90);
    });

    it('should prevent regular users from updating foods', async () => {
      const updateData = {
        description: 'This should not work'
      };

      const response = await request(app)
        .put(`/api/foods/${foodId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('permission');
    });
  });

  describe('DELETE /api/foods/:id', () => {
    let foodIdToDelete;

    before(async () => {
      // Create a food specifically for deletion
      const food = await Food.create({
        name: 'Food To Delete',
        description: 'This food will be deleted',
        calories: 100,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Test'
      });
      
      foodIdToDelete = food.id;
    });

    it('should prevent regular users from deleting foods', async () => {
      const response = await request(app)
        .delete(`/api/foods/${foodIdToDelete}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('permission');
    });

    it('should allow admins to delete food', async () => {
      const response = await request(app)
        .delete(`/api/foods/${foodIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Food deleted successfully');
    });

    it('should return 404 when deleting non-existent food', async () => {
      const response = await request(app)
        .delete(`/api/foods/${foodIdToDelete}`) // Try to delete the same food again
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('not found');
    });
  });
});