import express from 'express';
import LocaleController from '../controllers/localeController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkValidation } from '../utils/validation.js';

const { authenticate, authorize } = authMiddleware;
const router = express.Router();

// Public routes
router.get('/', LocaleController.getAllLocales);
router.get('/:id/foods', LocaleController.getFoodsByLocale);
router.get('/:id', LocaleController.getLocaleById);

// Admin routes
router.post('/', 
  authenticate, 
  authorize(['admin']), 
  // Since there's no createLocale validation in your validation middleware,
  // you'll need to create it or remove this line
  LocaleController.createLocale
);

router.put('/:id', 
  authenticate, 
  authorize(['admin']), 
  // Since there's no updateLocale validation in your validation middleware,
  // you'll need to create it or remove this line
  LocaleController.updateLocale
);

export default router;