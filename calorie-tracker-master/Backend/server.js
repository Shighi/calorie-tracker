// server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';  // <-- Import cors
import helmet from 'helmet';
import compression from 'compression';

// Database Connection
import sequelize from './src/config/database.js';

// Redis Connection
import redis from './src/config/redis.js';

// Middleware
import errorHandler from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import foodRoutes from './src/routes/foodRoutes.js';
import mealRoutes from './src/routes/mealRoutes.js';
import nutritionRoutes from './src/routes/nutritionRoutes.js';
import localeRoutes from './src/routes/localeRoutes.js';
import testRoutes from './src/routes/testRoutes.js';

// Logging
import logger from './src/utils/logger.js';

// Import app
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

// Database Connection
const startServer = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Check Redis connection
    await redis.ping();
    logger.info('Redis connection established successfully');

    // Use CORS middleware to allow frontend to access backend
    app.use(cors());  // <-- Enable CORS for all routes (or configure if needed)

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  
  // Close server
  app.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      
      // Close Redis connection
      redis.quit().then(() => {
        logger.info('Redis connection closed');
        process.exit(0);
      });
    });
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

export default app;
