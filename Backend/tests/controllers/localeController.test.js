// tests/controllers/localeController.test.js
const request = require('supertest');
const app = require('../../src/app');
const localeService = require('../../src/services/localeService');
const { generateAuthToken } = require('../../src/services/authService');
const { mockLocale, mockLocaleList } = require('../mocks/localeMocks');

// Mock localeService
jest.mock('../../src/services/localeService');

describe('Locale Controller', () => {
  let token;
  const userId = '123456789';

  beforeEach(() => {
    token = generateAuthToken({ id: userId, email: 'test@example.com', role: 'user' });
    jest.clearAllMocks();
  });

  describe('GET /api/locales', () => {
    it('should return all available locales', async () => {
      localeService.getAllLocales.mockResolvedValue(mockLocaleList);

      const response = await request(app)
        .get('/api/locales')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(mockLocaleList.length);
      expect(localeService.getAllLocales).toHaveBeenCalled();
    });
  });

  describe('GET /api/locales/:id', () => {
    it('should return a specific locale', async () => {
      localeService.getLocaleById.mockResolvedValue(mockLocale);

      const response = await request(app)
        .get(`/api/locales/${mockLocale.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(mockLocale.id);
      expect(response.body.data.name).toBe(mockLocale.name);
      expect(localeService.getLocaleById).toHaveBeenCalledWith(mockLocale.id);
    });

    it('should return 404 if locale not found', async () => {
      localeService.getLocaleById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/locales/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/locales/:id/foods', () => {
    it('should return all foods for a specific locale', async () => {
      const localeFoods = [{ id: '1', name: 'Food 1' }, { id: '2', name: 'Food 2' }];
      localeService.getLocaleFoods.mockResolvedValue(localeFoods);

      const response = await request(app)
        .get(`/api/locales/${mockLocale.id}/foods`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(localeService.getLocaleFoods).toHaveBeenCalledWith(
        mockLocale.id,
        expect.any(Object)
      );
    });

    it('should handle pagination parameters', async () => {
      localeService.getLocaleFoods.mockResolvedValue([{ id: '1', name: 'Food 1' }]);

      await request(app)
        .get(`/api/locales/${mockLocale.id}/foods?page=2&limit=10`)
        .set('Authorization', `Bearer ${token}`);

      expect(localeService.getLocaleFoods).toHaveBeenCalledWith(
        mockLocale.id,
        expect.objectContaining({
          page: '2',
          limit: '10'
        })
      );
    });

    it('should return empty array if locale has no foods', async () => {
      localeService.getLocaleFoods.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/locales/${mockLocale.id}/foods`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });
});