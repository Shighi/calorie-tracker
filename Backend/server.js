import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Database Connection
import sequelize from './src/config/database';

// Middleware
import errorHandler from './src/middleware/errorHandler';
import { apiLimiter } from './src/middleware/rateLimiter';

// Routes
import authRoutes from './src/routes/authRoutes';
import foodRoutes from './src/routes/foodRoutes';
import mealRoutes from './src/routes/mealRoutes';
import nutritionRoutes from './src/routes/nutritionRoutes';
import localeRoutes from './src/routes/localeRoutes';

// Swagger Documentation
import setupSwagger from './src/config/swagger';

// Logging
import logger from './src/utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Configuration
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use(apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/locales', localeRoutes);

// Swagger Documentation
setupSwagger(app);

// Error Handling Middleware
app.use(errorHandler);

// Database Connection
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established successfully');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  });

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  app.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;