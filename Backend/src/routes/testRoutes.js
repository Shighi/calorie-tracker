// src/routes/testRoutes.js
import express from 'express';
import cacheService from '../services/cacheService.js';

const router = express.Router();

router.get('/redis-test', async (req, res) => {
  try {
    // Set a value in Redis
    await cacheService.set('test:key', { message: 'Redis is working!' });
    
    // Get the value from Redis
    const result = await cacheService.get('test:key');
    
    res.json({ 
      success: true,
      message: 'Redis test',
      cachedValue: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Redis test failed',
      error: error.message
    });
  }
});

export default router;