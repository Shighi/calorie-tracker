// tests/controllers/authController.test.js
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockUser, mockUserWithProfile } = require('../mocks/userMocks');

jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      };

      // Mock functions
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue(mockUser);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      // Mock data
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User'
      };

      // Mock function to return existing user
      User.findOne.mockResolvedValue({ email: userData.email });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    it('should return 400 if validation fails', async () => {
      // Invalid data
      const userData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: ''  // Empty
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully and return JWT token', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      // Mock functions
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mocked-jwt-token');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mocked-jwt-token');
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });

    it('should return 401 if user does not exist', async () => {
      // Mock data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      // Mock function to return null (user not found)
      User.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      // Mock data
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      };

      // Mock functions
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile successfully', async () => {
      // Mock authorized user
      const mockReq = {
        user: { id: mockUser.id }
      };

      // Mock function
      User.findById.mockResolvedValue(mockUserWithProfile);
      
      const token = 'Bearer valid-token';
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(mockUserWithProfile.email);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token, authorization denied');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      // Mock data
      const updateData = {
        name: 'Updated Name',
        height: 175,
        weight: 70,
        activityLevel: 'moderate'
      };

      // Mock authorized user
      const token = 'Bearer valid-token';
      
      // Mock functions
      User.findById.mockResolvedValue(mockUserWithProfile);
      User.findByIdAndUpdate.mockResolvedValue({
        ...mockUserWithProfile,
        ...updateData
      });
      
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', token)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const updateData = {
        name: 'Updated Name'
      };
      
      const response = await request(app)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No token, authorization denied');
    });
  });
});