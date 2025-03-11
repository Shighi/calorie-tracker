import express from 'express';
import LocaleController from '../controllers/localeController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import validate from '../middleware/validationMiddleware';

const router = express.Router();

// Public routes
router.get('/', LocaleController.getAllLocales);
router.get('/:id/foods', LocaleController.getFoodsByLocale);
router.get('/:id', LocaleController.getLocaleById);

// Admin routes
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  validate('createLocale'), 
  LocaleController.createLocale
);

router.put('/:id', 
  authenticate, 
  authorize(['admin']), 
  validate('updateLocale'), 
  LocaleController.updateLocale
);

export default router;