const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const externalApiService = require('../../src/services/externalApiService');
const cache = require('../../src/utils/cache'); // Assuming you have a cache utility

describe('External API Service', () => {
  let axiosGetStub;
  let cacheGetStub;
  let cacheSetStub;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, 'get');
    cacheGetStub = sinon.stub(cache, 'get');
    cacheSetStub = sinon.stub(cache, 'set');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('searchUSDAFoodData', () => {
    it('should return food data from USDA API', async () => {
      const query = 'apple';
      const mockResponse = {
        data: {
          foods: [
            { fdcId: 1, description: 'Apple, raw', foodNutrients: [] }
          ]
        }
      };
      
      cacheGetStub.returns(null); // No cache hit
      axiosGetStub.resolves(mockResponse);
      
      const result = await externalApiService.searchUSDAFoodData(query);
      
      expect(result).to.deep.equal(mockResponse.data.foods);
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(cacheSetStub.calledOnce).to.be.true;
    });
    
    it('should return cached data if available', async () => {
      const query = 'apple';
      const cachedData = [
        { fdcId: 1, description: 'Apple, raw', foodNutrients: [] }
      ];
      
      cacheGetStub.returns(cachedData);
      
      const result = await externalApiService.searchUSDAFoodData(query);
      
      expect(result).to.deep.equal(cachedData);
      expect(axiosGetStub.called).to.be.false;
    });
    
    it('should handle API errors gracefully', async () => {
      cacheGetStub.returns(null);
      axiosGetStub.rejects(new Error('API Error'));
      
      try {
        await externalApiService.searchUSDAFoodData('apple');
        expect.fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).to.include('Error fetching from USDA API');
      }
    });
  });

  describe('getUSDAFoodDetails', () => {
    it('should return detailed food information from USDA API', async () => {
      const fdcId = '123456';
      const mockResponse = {
        data: {
          fdcId: 123456,
          description: 'Apple, raw',
          foodNutrients: [
            { nutrient: { id: 1, name: 'Protein' }, amount: 0.3 }
          ]
        }
      };
      
      cacheGetStub.returns(null);
      axiosGetStub.resolves(mockResponse);
      
      const result = await externalApiService.getUSDAFoodDetails(fdcId);
      
      expect(result).to.deep.equal(mockResponse.data);
      expect(axiosGetStub.calledOnce).to.be.true;
    });
  });

  describe('searchOpenFoodFacts', () => {
    it('should return food data from Open Food Facts API', async () => {
      const query = 'chocolate';
      const mockResponse = {
        data: {
          products: [
            { 
              code: '123456789', 
              product_name: 'Dark Chocolate',
              nutriments: {
                energy: 500,
                proteins: 5,
                carbohydrates: 30,
                fat: 30
              }
            }
          ]
        }
      };
      
      cacheGetStub.returns(null);
      axiosGetStub.resolves(mockResponse);
      
      const result = await externalApiService.searchOpenFoodFacts(query);
      
      expect(result).to.deep.equal(mockResponse.data.products);
      expect(axiosGetStub.calledOnce).to.be.true;
    });
  });

  describe('getOpenFoodFactsProduct', () => {
    it('should return detailed product information from Open Food Facts', async () => {
      const barcode = '123456789';
      const mockResponse = {
        data: {
          product: {
            code: '123456789',
            product_name: 'Dark Chocolate',
            nutriments: {
              energy: 500,
              proteins: 5,
              carbohydrates: 30,
              fat: 30
            }
          }
        }
      };
      
      cacheGetStub.returns(null);
      axiosGetStub.resolves(mockResponse);
      
      const result = await externalApiService.getOpenFoodFactsProduct(barcode);
      
      expect(result).to.deep.equal(mockResponse.data.product);
      expect(axiosGetStub.calledOnce).to.be.true;
    });
  });

  describe('normalizeExternalFoodData', () => {
    it('should normalize USDA food data to application format', async () => {
      const usdaData = {
        fdcId: 123456,
        description: 'Apple, raw',
        foodNutrients: [
          { nutrient: { id: 1003, name: 'Protein' }, amount: 0.3 },
          { nutrient: { id: 1004, name: 'Total lipid (fat)' }, amount: 0.2 },
          { nutrient: { id: 1005, name: 'Carbohydrate, by difference' }, amount: 14 },
          { nutrient: { id: 1008, name: 'Energy' }, amount: 52 }
        ]
      };
      
      const result = await externalApiService.normalizeExternalFoodData(usdaData, 'usda');
      
      expect(result).to.have.property('name', 'Apple, raw');
      expect(result).to.have.property('calories', 52);
      expect(result).to.have.property('protein', 0.3);
      expect(result).to.have.property('fat', 0.2);
      expect(result).to.have.property('carbs', 14);
      expect(result).to.have.property('externalId', '123456');
      expect(result).to.have.property('dataSource', 'usda');
    });
    
    it('should normalize Open Food Facts data to application format', async () => {
      const openFoodFactsData = {
        code: '123456789',
        product_name: 'Dark Chocolate',
        nutriments: {
          energy: 500,
          proteins: 5,
          carbohydrates: 30,
          fat: 30
        }
      };
      
      const result = await externalApiService.normalizeExternalFoodData(openFoodFactsData, 'off');
      
      expect(result).to.have.property('name', 'Dark Chocolate');
      expect(result).to.have.property('calories', 500);
      expect(result).to.have.property('protein', 5);
      expect(result).to.have.property('fat', 30);
      expect(result).to.have.property('carbs', 30);
      expect(result).to.have.property('externalId', '123456789');
      expect(result).to.have.property('dataSource', 'off');
    });
    
    it('should handle missing nutritional data', async () => {
      const incompleteData = {
        fdcId: 123456,
        description: 'Apple, raw',
        foodNutrients: []
      };
      
      const result = await externalApiService.normalizeExternalFoodData(incompleteData, 'usda');
      
      expect(result).to.have.property('name', 'Apple, raw');
      expect(result).to.have.property('calories', 0);
      expect(result).to.have.property('protein', 0);
      expect(result).to.have.property('fat', 0);
      expect(result).to.have.property('carbs', 0);
    });
  });

  describe('importExternalFood', () => {
    it('should import and save external food data to database', async () => {
      const foodData = {
        name: 'Apple, raw',
        calories: 52,
        protein: 0.3,
        fat: 0.2,
        carbs: 14,
        externalId: '123456',
        dataSource: 'usda'
      };
      
      const createFoodStub = sinon.stub(require('../../src/models/Food'), 'create').resolves({
        id: 1,
        ...foodData
      });
      
      const result = await externalApiService.importExternalFood(foodData);
      
      expect(result).to.have.property('id', 1);
      expect(result).to.have.property('name', 'Apple, raw');
      expect(createFoodStub.calledOnce).to.be.true;
    });
  });
});