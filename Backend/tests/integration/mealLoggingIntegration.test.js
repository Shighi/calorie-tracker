const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const db = require('../../src/config/database');
const User = require('../../src/models/User');
const Food = require('../../src/models/Food');
const Meal = require('../../src/models/Meal');
const MealFood = require('../../src/models/MealFood');
const Locale = require('../../src/models/Locale');

describe('Meal Logging API Integration Tests', () => {
  let userToken;
  let userId;
  let localeId;
  let foodIds = [];

  before(async () => {
    // Clear data before tests
    await MealFood.destroy({ where: {}, force: true });
    await Meal.destroy({ where: {}, force: true });
    
    // Create a locale
    const locale = await Locale.create({
      name: 'Test Locale',
      code: 'TEST',
      isActive: true
    });
    localeId = locale.id;
    
    // Create test user
    await User.destroy({ where: { email: 'meal-test@example.com' }, force: true });
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'meal-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Meal',
        lastName: 'Tester'
      });
    
    userId = registerResponse.body.data.id;
    
    // Login and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'meal-test@example.com',
        password: 'SecurePassword123!'
      });
    
    userToken = loginResponse.body.data.token;
    
    // Create test foods
    await Food.destroy({ where: {}, force: true });
    
    const foods = await Food.bulkCreate([
      {
        name: 'Oatmeal',
        description: 'Plain cooked oatmeal',
        calories: 150,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Breakfast',
        nutrients: JSON.stringify({
          protein: 5,
          fat: 3,
          carbohydrates: 27,
          sugar: 1,
          fiber: 4
        })
      },
      {
        name: 'Egg',
        description: 'Medium boiled egg',
        calories: 78,
        servingSize: 50,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Proteins',
        nutrients: JSON.stringify({
          protein: 6.3,
          fat: 5.3,
          carbohydrates: 0.6,
          sugar: 0.6,
          fiber: 0
        })
      },
      {
        name: 'Spinach',
        description: 'Raw spinach',
        calories: 23,
        servingSize: 100,
        servingUnit: 'g',
        localeId: localeId,
        category: 'Vegetables',
        nutrients: JSON.stringify({
          protein: 2.9,
          fat: 0.4,
          carbohydrates: 3.6,
          sugar: 0.4,
          fiber: 2.2
        })
      }
    ]);
    
    foodIds = foods.map(food => food.id);
  });

  after(async () => {
    // Clean up after tests
    await MealFood.destroy({ where: {}, force: true });
    await Meal.destroy({ where: {}, force: true });
    await Food.destroy({ where: {}, force: true });
    await User.destroy({ where: { email: 'meal-test@example.com' }, force: true });
    await Locale.destroy({ where: { id: localeId }, force: true });
  });

  describe('POST /api/meals', () => {
    it('should create a new meal log successfully', async () => {
      const mealData = {
        name: 'Breakfast',
        date: '2023-04-15T08:00:00.000Z',
        notes: 'Morning breakfast',
        foods: [
          {
            foodId: foodIds[0], // Oatmeal
            servingQty: 1.5
          },
          {
            foodId: foodIds[1], // Egg
            servingQty: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mealData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Meal logged successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('name', 'Breakfast');
      expect(response.body.data).to.have.property('totalCalories');
      expect(response.body.data).to.have.property('foods');
      expect(response.body.data.foods).to.be.an('array');
      expect(response.body.data.foods.length).to.equal(2);
    });

    it('should validate meal data requirements', async () => {
      const invalidMeal = {
        // Missing name and date
        foods: [
          {
            foodId: foodIds[0],
            servingQty: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidMeal)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('required');
    });

    it('should validate food existence', async () => {
      const mealWithNonexistentFood = {
        name: 'Invalid Meal',
        date: '2023-04-15T12:00:00.000Z',
        foods: [
          {
            foodId: 9999, // Non-existent food
            servingQty: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(mealWithNonexistentFood)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('food');
    });
  });

  describe('GET /api/meals', () => {
    before(async () => {
      // Create additional test meals
      await Meal.create({
        name: 'Lunch',
        date: '2023-04-15T12:30:00.000Z',
        notes: 'Quick lunch',
        userId: userId,
        totalCalories: 350,
        totalProtein: 15,
        totalFat: 12,
        totalCarbs: 45
      });

      await Meal.create({
        name: 'Dinner',
        date: '2023-04-15T19:00:00.000Z',
        notes: 'Healthy dinner',
        userId: userId,
        totalCalories: 450,
        totalProtein: 30,
        totalFat: 15,
        totalCarbs: 40
      });
    });

    it('should retrieve all meals for the user', async () => {
      const response = await request(app)
        .get('/api/meals')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(3);
      expect(response.body.data[0]).to.have.property('name');
      expect(response.body.data[0]).to.have.property('totalCalories');
    });

    it('should filter meals by date range', async () => {
      const response = await request(app)
        .get('/api/meals?startDate=2023-04-15&endDate=2023-04-15')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/meals?page=1&limit=2')
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

  describe('GET /api/meals/:id', () => {
    let mealId;

    before(async () => {
      // Create a meal with food items
      const meal = await Meal.create({
        name: 'Detailed Meal',
        date: '2023-04-16T08:00:00.000Z',
        notes: 'For detailed testing',
        userId: userId,
        totalCalories: 300,
        totalProtein: 20,
        totalFat: 10,
        totalCarbs: 30
      });
      
      mealId = meal.id;
      
      // Add food items to the meal
      await MealFood.bulkCreate([
        {
          mealId: mealId,
          foodId: foodIds[0],
          servingQty: 1,
          calories: 150,
          protein: 5,
          fat: 3,
          carbs: 27
        },
        {
          mealId: mealId,
          foodId: foodIds[2],
          servingQty: 2,
          calories: 46,
          protein: 5.8,
          fat: 0.8,
          carbs: 7.2
        }
      ]);
    });

    it('should retrieve detailed meal information', async () => {
      const response = await request(app)
        .get(`/api/meals/${mealId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', mealId);
      expect(response.body.data).to.have.property('name', 'Detailed Meal');
      expect(response.body.data).to.have.property('totalCalories');
      expect(response.body.data).to.have.property('foods');
      expect(response.body.data.foods).to.be.an('array');
      expect(response.body.data.foods.length).to.equal(2);
      expect(response.body.data.foods[0]).to.have.property('foodId');
      expect(response.body.data.foods[0]).to.have.property('servingQty');
      expect(response.body.data.foods[0]).to.have.property('food');
      expect(response.body.data.foods[0].food).to.have.property('name');
    });

    it('should return 404 for non-existent meal ID', async () => {
      const response = await request(app)
        .get('/api/meals/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('not found');
    });

    it('should prevent accessing another user\'s meal', async () => {
      // Create another user
      await User.destroy({ where: { email: 'another-user@example.com' }, force: true });
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another-user@example.com',
          password: 'SecurePassword123!',
          firstName: 'Another',
          lastName: 'User'
        });
      
      const anotherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another-user@example.com',
          password: 'SecurePassword123!'
        });
      
      const anotherUserToken = anotherLoginResponse.body.data.token;
      
      const response = await request(app)
        .get(`/api/meals/${mealId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('permission');
      
      // Clean up the other user
      await User.destroy({ where: { email: 'another-user@example.com' }, force: true });
    });
  });

  describe('PUT /api/meals/:id', () => {
    let mealId;

    before(async () => {
      // Create a meal to update
      const meal = await Meal.create({
        name: 'Meal to Update',
        date: '2023-04-16T12:00:00.000Z',
        notes: 'Before update',
        userId: userId,
        totalCalories: 200,
        totalProtein: 10,
        totalFat: 8,
        totalCarbs: 20
      });
      
      mealId = meal.id;
      
      // Add initial food item
      await MealFood.create({
        mealId: mealId,
        foodId: foodIds[1], // Egg
        servingQty: 1,
        calories: 78,
        protein: 6.3,
        fat: 5.3,
        carbs: 0.6
      });
    });

    it('should update an existing meal', async () => {
      const updateData = {
        name: 'Updated Meal Name',
        notes: 'After update',
        foods: [
          {
            foodId: foodIds[1], // Egg
            servingQty: 2
          },
          {
            foodId: foodIds[2], // Spinach
            servingQty: 1
          }
        ]
      };

      const response = await request(app)
        .put(`/api/meals/${mealId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Meal updated successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('name', 'Updated Meal Name');
      expect(response.body.data).to.have.property('notes', 'After update');
      expect(response.body.data).to.have.property('foods');
      expect(response.body.data.foods).to.be.an('array');
      expect(response.body.data.foods.length).to.equal(2);
    });

    it('should return 404 for updating non-existent meal', async () => {
      const updateData = {
        name: 'This should fail',
        foods: []
      };

      const response = await request(app)
        .put('/api/meals/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('not found');
    });
  });

  describe('DELETE /api/meals/:id', () => {
    let mealIdToDelete;

    before(async () => {
      // Create a meal to delete
      const meal = await Meal.create({
        name: 'Meal to Delete',
        date: '2023-04-16T18:00:00.000Z',
        notes: 'Will be deleted',
        userId: userId,
        totalCalories: 250,
        totalProtein: 15,
        totalFat: 10,
        totalCarbs: 25
      });
      
      mealIdToDelete = meal.id;
    });

    it('should delete a meal', async () => {
      const response = await request(app)
        .delete(`/api/meals/${mealIdToDelete}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Meal deleted successfully');
    });

    it('should return 404 for deleting non-existent meal', async () => {
      const response = await request(app)
        .delete(`/api/meals/${mealIdToDelete}`) // Try to delete the same meal again
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('not found');
    });
  });
});