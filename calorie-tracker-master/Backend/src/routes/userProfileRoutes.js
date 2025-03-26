// userProfileRoutes.js
import express from 'express';
import userProfileController from '../controllers/userProfileController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', 
  authMiddleware.authenticate, 
  userProfileController.getUserProfile // Directly pass the method, not wrapping in async function
);

// Create or update user profile with validation
router.post('/profile', 
  authMiddleware.authenticate, 
  validate('userProfile'), 
  userProfileController.createOrUpdateProfile
);

export default router;