const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const db = require('../../src/config/database');
const User = require('../../src/models/User');

describe('Authentication API Integration Tests', () => {
  before(async () => {
    // Clear users before tests
    await User.destroy({ where: {}, force: true });
  });

  after(async () => {
    // Clean up after tests
    await User.destroy({ where: {}, force: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'integration-test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User registered successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('email', userData.email);
      expect(response.body.data).to.not.have.property('password');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'integration-test@example.com',
        password: 'AnotherPassword123!',
        firstName: 'Another',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('already exists');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'another-test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('password');
    });
  });

  describe('POST /api/auth/login', () => {
    before(async () => {
      // Ensure test user exists
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Login',
          lastName: 'Test'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Login successful');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('token');
      expect(response.body.data).to.have.property('user');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    before(async () => {
      // Create user and get token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile-test@example.com',
          password: 'SecurePassword123!',
          firstName: 'Profile',
          lastName: 'Test'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile-test@example.com',
          password: 'SecurePassword123!'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should retrieve user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('email', 'profile-test@example.com');
      expect(response.body.data).to.have.property('firstName', 'Profile');
      expect(response.body.data).to.not.have.property('password');
    });

    it('should reject profile access without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('No token provided');
    });

    it('should reject profile access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    before(async () => {
      // Create user and get token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile-update@example.com',
          password: 'SecurePassword123!',
          firstName: 'Before',
          lastName: 'Update'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile-update@example.com',
          password: 'SecurePassword123!'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'After',
        lastName: 'Update',
        height: 180,
        weight: 75,
        birthDate: '1990-01-01'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Profile updated successfully');
      expect(response.body.data).to.have.property('firstName', 'After');
      expect(response.body.data).to.have.property('lastName', 'Update');
      expect(response.body.data).to.have.property('height', 180);
      expect(response.body.data).to.have.property('weight', 75);
    });

    it('should not allow updating email through profile update', async () => {
      const updateData = {
        email: 'new-email@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.message).to.include('cannot be updated');
    });
  });
});