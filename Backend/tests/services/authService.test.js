// tests/services/authService.test.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authService = require('../../src/services/authService');
const User = require('../../src/models/User');
const config = require('../../src/config/env');

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');
jest.mock('../../src/config/env', () => ({
  JWT_SECRET: 'test-secret',
  JWT_EXPIRY: '1h'
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    it('should hash password and create a new user', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      User.create.mockResolvedValue({
        id: '123',
        email: userData.email,
        name: userData.name,
        password: 'hashed_password'
      });

      const result = await authService.registerUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, expect.any(Number));
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        password: 'hashed_password',
        name: userData.name
      });
      expect(result).toHaveProperty('id', '123');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw an error if user creation fails', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      User.create.mockRejectedValue(new Error('Email already exists'));

      await expect(authService.registerUser(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('loginUser', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should return user and token for valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: credentials.email,
        password: 'hashed_password',
        role: 'user',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          email: credentials.email,
          role: 'user'
        })
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_token');

      const result = await authService.loginUser(credentials);

      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, 'hashed_password');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: '123', email: credentials.email, role: 'user' },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );
      expect(result).toEqual({
        user: mockUser.toJSON(),
        token: 'mock_token'
      });
    });

    it('should throw an error for invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.loginUser(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for invalid password', async () => {
      User.findOne.mockResolvedValue({
        id: '123',
        email: credentials.email,
        password: 'hashed_password'
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          name: 'Test User'
        })
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await authService.getUserProfile('123');

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockUser.toJSON());
    });

    it('should return null if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const result = await authService.getUserProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    const userId = '123';
    const updateData = {
      name: 'Updated Name',
      preferences: { theme: 'dark' }
    };

    it('should update and return user profile', async () => {
      const mockUser = {
        id: userId,
        name: 'Original Name',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue({
          id: userId,
          name: 'Updated Name',
          email: 'test@example.com',
          preferences: { theme: 'dark' },
          toJSON: jest.fn().mockReturnValue({
            id: userId,
            name: 'Updated Name',
            email: 'test@example.com',
            preferences: { theme: 'dark' }
          })
        }),
        toJSON: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await authService.updateUserProfile(userId, updateData);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.name).toBe('Updated Name');
      expect(mockUser.preferences).toEqual({ theme: 'dark' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: userId,
        name: 'Updated Name',
        email: 'test@example.com',
        preferences: { theme: 'dark' }
      });
    });

    it('should hash password if included in update', async () => {
      const updateWithPassword = {
        ...updateData,
        password: 'NewPassword123!'
      };

      const mockUser = {
        id: userId,
        name: 'Original Name',
        email: 'test@example.com',
        password: 'old_hashed_password',
        save: jest.fn().mockResolvedValue({
          id: userId,
          name: 'Updated Name',
          email: 'test@example.com',
          password: 'new_hashed_password',
          toJSON: jest.fn().mockReturnValue({
            id: userId,
            name: 'Updated Name',
            email: 'test@example.com'
          })
        }),
        toJSON: jest.fn()
      };

      User.findById.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('new_hashed_password');

      await authService.updateUserProfile(userId, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', expect.any(Number));
      expect(mockUser.password).toBe('new_hashed_password');
    });

    it('should return null if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const result = await authService.updateUserProfile('nonexistent', updateData);

      expect(result).toBeNull();
    });
  });

  describe('generateAuthToken', () => {
    it('should generate a JWT token with user data', () => {
      const userData = { id: '123', email: 'test@example.com', role: 'user' };
      jwt.sign.mockReturnValue('generated_token');

      const token = authService.generateAuthToken(userData);

      expect(jwt.sign).toHaveBeenCalledWith(
        userData,
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRY }
      );
      expect(token).toBe('generated_token');
    });
  });

  describe('verifyAuthToken', () => {
    it('should verify and decode a valid token', () => {
      const decodedToken = { id: '123', email: 'test@example.com' };
      jwt.verify.mockReturnValue(decodedToken);

      const result = authService.verifyAuthToken('valid_token');

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', config.JWT_SECRET);
      expect(result).toEqual(decodedToken);
    });

    it('should return null for an invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyAuthToken('invalid_token');

      expect(result).toBeNull();
    });
  });
});