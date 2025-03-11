// tests/controllers/foodController.test.js
const request = require('supertest');
const app = require('../../src/app');
const { Food } = require('../../src/models/Food');
const { mockFoods, mockFood } = require('../mocks/foodMocks');
const authMiddleware = require('../../src/middleware/authMiddleware');

jest.mock('../../src/models/Food');
jest.mock('../../src/middleware/authMiddleware');

describe('Food Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock authentication middleware to simulate authenticated requests
    authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123', isAdmin: false };
      next();
    });
    
    authMiddleware.isAdmin.mockImplementation((req, res, next) => {
      if (req.user && req.user.isAdmin) {
        next();
      } else {
        res.status(403).json({ success: false, message: 'Admin access required' });
      }
    });
  });

  describe('GET /api/foods', () => {
    it('should return list of foods with pagination', async () => {
      // Mock pagination function
      Food.paginate.mockResolvedValue({
        docs: mockFoods,
        totalDocs: 100,
        limit: 10,
        page: 1,
        totalPages: 10,
        hasNextPage: true,
        nextPage: 2,
        hasPrevPage: false,
        prevPage: null
      });
      
      const response = await request(app)
        .get('/api/foods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.foods).toBeDefined();
      expect(response.body.data.foods.length).toBe(mockFoods.length);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter foods by query parameters', async () => {
      // Setup query parameters
      const query = {
        name: 'apple',
        category: 'fruits',
        locale: 'en-US'
      };
      
      // Mock pagination function
      Food.paginate.mockResolvedValue({
        docs: mockFoods.filter(food => food.name.includes('apple')),
        totalDocs: 3,
        limit: 10,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        nextPage: null,
        hasPrevPage: false,
        prevPage: null
      });
      
      const response = await request(app)
        .get('/api/foods')
        .query(query)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Food.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(Object),
          category: query.category,
          locale: query.locale
        }),
        expect.any(Object)
      );
    });
  });

  describe('GET /api/foods/:id', () => {
    it('should return a specific food by ID', async () => {
      const foodId = 'food123';
      
      // Mock findById function
      Food.findById.mockResolvedValue(mockFood);
      
      const response = await request(app)
        .get(`/api/foods/${foodId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(mockFood.name);
      expect(Food.findById).toHaveBeenCalledWith(foodId);
    });

    it('should return 404 if food not found', async () => {
      const foodId = 'nonexistent';
      
      // Mock findById function to return null
      Food.findById.mockResolvedValue(null);
      
      const response = await request(app)
        .get(`/api/foods/${foodId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Food not found');
    });
  });

  describe('POST /api/foods', () => {
    beforeEach(() => {
      // Mock admin authentication for these tests
      authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin123', isAdmin: true };
        next();
      });
    });

    it('should create a new food item if user is admin', async () => {
      const newFoodData = {
        name: 'New Test Food',
        category: 'test-category',
        calories: 150,
        nutrients: {
          protein: 5,
          carbs: 20,
          fat: 3
        },
        locale: 'en-US'
      };
      
      // Mock create function
      Food.create.mockResolvedValue({ _id: 'newfood123', ...newFoodData });
      
      const response = await request(app)
        .post('/api/foods')
        .send(newFoodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBe('Food created successfully');
      expect(Food.create).toHaveBeenCalledWith(expect.objectContaining(newFoodData));
    });

    it('should return 403 if user is not admin', async () => {
      // Override mock to simulate non-admin user
      authMiddleware.authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'user123', isAdmin: false };
        next();
      });
      
      const newFoodData = {
        name: 'New Test Food',
        category: 'test-category',
        calories: 150
      };
      
      const response = await request(app)
        .post('/api/foods')
        .send(newFoodData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
      expect(Food.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/foods/:id', () => {
    beforeEach(() => {
      // Mock admin authentication for these tests
      authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin123', isAdmin: true };
        next();
      });
    });

    it('should update a food item if user is admin', async () => {
      const foodId = 'food123';
      const updateData = {
        name: 'Updated Food Name',
        calories: 180
      };
      
      // Mock findById and findByIdAndUpdate functions
      Food.findById.mockResolvedValue(mockFood);
      Food.findByIdAndUpdate.mockResolvedValue({ 
        ...mockFood, 
        ...updateData 
      });
      
      const response = await request(app)
        .put(`/api/foods/${foodId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBe('Food updated successfully');
      expect(Food.findByIdAndUpdate).toHaveBeenCalledWith(
        foodId,
        expect.objectContaining(updateData),
        { new: true }
      );
    });

    it('should return 404 if food not found', async () => {
      const foodId = 'nonexistent';
      const updateData = {
        name: 'Updated Food Name'
      };
      
      // Mock findById function to return null
      Food.findById.mockResolvedValue(null);
      
      const response = await request(app)
        .put(`/api/foods/${foodId}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Food not found');
      expect(Food.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/foods/:id', () => {
    beforeEach(() => {
      // Mock admin authentication for these tests
      authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'admin123', isAdmin: true };
        next();
      });
    });

    it('should delete a food item if user is admin', async () => {
      const foodId = 'food123';
      
      // Mock findById and findByIdAndDelete functions
      Food.findById.mockResolvedValue(mockFood);
      Food.findByIdAndDelete.mockResolvedValue(mockFood);
      
      const response = await request(app)
        .delete(`/api/foods/${foodId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Food deleted successfully');
      expect(Food.findByIdAndDelete).toHaveBeenCalledWith(foodId);
    });

    it('should return 404 if food not found', async () => {
      const foodId = 'nonexistent';
      
      // Mock findById function to return null
      Food.findById.mockResolvedValue(null);
      
      const response = await request(app)
        .delete(`/api/foods/${foodId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Food not found');
      expect(Food.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });
});