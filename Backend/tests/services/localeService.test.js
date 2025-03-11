const { expect } = require('chai');
const sinon = require('sinon');
const localeService = require('../../src/services/localeService');
const Locale = require('../../src/models/Locale');
const Food = require('../../src/models/Food');

describe('Locale Service', () => {
  let findStub;
  let createStub;
  let updateStub;
  let deleteStub;
  let foodFindStub;

  beforeEach(() => {
    // Create stubs for Locale model methods
    findStub = sinon.stub(Locale, 'findAll');
    findOneStub = sinon.stub(Locale, 'findOne');
    findByPkStub = sinon.stub(Locale, 'findByPk');
    createStub = sinon.stub(Locale, 'create');
    updateStub = sinon.stub(Locale, 'update');
    deleteStub = sinon.stub(Locale, 'destroy');
    
    // Create stubs for Food model methods
    foodFindStub = sinon.stub(Food, 'findAll');
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('getAllLocales', () => {
    it('should return all locales', async () => {
      const locales = [
        { id: 1, name: 'United States', code: 'US' },
        { id: 2, name: 'United Kingdom', code: 'UK' }
      ];
      
      findStub.resolves(locales);
      
      const result = await localeService.getAllLocales();
      
      expect(result).to.deep.equal(locales);
      expect(findStub.calledOnce).to.be.true;
    });
    
    it('should handle errors when retrieving locales', async () => {
      findStub.rejects(new Error('Database error'));
      
      try {
        await localeService.getAllLocales();
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('getLocaleById', () => {
    it('should return a locale by id', async () => {
      const locale = { id: 1, name: 'United States', code: 'US' };
      
      findByPkStub.resolves(locale);
      
      const result = await localeService.getLocaleById(1);
      
      expect(result).to.deep.equal(locale);
      expect(findByPkStub.calledWith(1)).to.be.true;
    });
    
    it('should return null if locale not found', async () => {
      findByPkStub.resolves(null);
      
      const result = await localeService.getLocaleById(999);
      
      expect(result).to.be.null;
      expect(findByPkStub.calledWith(999)).to.be.true;
    });
  });

  describe('getFoodsByLocale', () => {
    it('should return foods for a specific locale', async () => {
      const localeId = 1;
      const foods = [
        { id: 1, name: 'Apple', localeId: 1 },
        { id: 2, name: 'Banana', localeId: 1 }
      ];
      
      foodFindStub.resolves(foods);
      
      const result = await localeService.getFoodsByLocale(localeId);
      
      expect(result).to.deep.equal(foods);
      expect(foodFindStub.calledWith({ where: { localeId } })).to.be.true;
    });
    
    it('should return empty array if no foods found for locale', async () => {
      foodFindStub.resolves([]);
      
      const result = await localeService.getFoodsByLocale(999);
      
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('createLocale', () => {
    it('should create a new locale', async () => {
      const localeData = { name: 'Canada', code: 'CA' };
      const createdLocale = { id: 3, ...localeData };
      
      createStub.resolves(createdLocale);
      
      const result = await localeService.createLocale(localeData);
      
      expect(result).to.deep.equal(createdLocale);
      expect(createStub.calledWith(localeData)).to.be.true;
    });
    
    it('should handle duplicate locale error', async () => {
      const localeData = { name: 'United States', code: 'US' };
      
      createStub.rejects({ name: 'SequelizeUniqueConstraintError' });
      
      try {
        await localeService.createLocale(localeData);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).to.include('Locale already exists');
      }
    });
  });

  describe('updateLocale', () => {
    it('should update an existing locale', async () => {
      const localeId = 1;
      const updateData = { name: 'USA' };
      const updatedLocale = { id: 1, name: 'USA', code: 'US' };
      
      updateStub.resolves([1]);
      findByPkStub.resolves(updatedLocale);
      
      const result = await localeService.updateLocale(localeId, updateData);
      
      expect(result).to.deep.equal(updatedLocale);
      expect(updateStub.calledWith(updateData, { where: { id: localeId } })).to.be.true;
    });
    
    it('should return null if locale not found for update', async () => {
      updateStub.resolves([0]);
      
      const result = await localeService.updateLocale(999, { name: 'Test' });
      
      expect(result).to.be.null;
    });
  });

  describe('deleteLocale', () => {
    it('should delete a locale', async () => {
      deleteStub.resolves(1);
      
      const result = await localeService.deleteLocale(1);
      
      expect(result).to.be.true;
      expect(deleteStub.calledWith({ where: { id: 1 } })).to.be.true;
    });
    
    it('should return false if locale not found for deletion', async () => {
      deleteStub.resolves(0);
      
      const result = await localeService.deleteLocale(999);
      
      expect(result).to.be.false;
    });
  });
});