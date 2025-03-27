import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Database Connection
import sequelize from './src/config/database.js';

// Redis Connection
import redis from './src/config/redis.js';

// Import all models to ensure they are loaded and associations are set up
import './src/models/index.js';

// Models (to ensure specific order of import and sync)
import User from './src/models/User.js';
import UserProfile from './src/models/UserProfile.js';

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
import userProfileRoutes from './src/routes/userProfileRoutes.js';

// Logging
import logger from './src/utils/logger.js';

// Import app
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

// Parse CORS origins from environment variable
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim());

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // or origin in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS before routes
app.use(cors(corsOptions));

// Middleware Configuration
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Route Configuration
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/locales', localeRoutes);
app.use('/api/test', testRoutes);
app.use('/api/user-profile', userProfileRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Database Connection and Server Startup
const startServer = async () => {
  try {
    // Configure table names to be lowercase
    sequelize.options.define = {
      ...sequelize.options.define,
      freezeTableName: true,
      underscored: true,
      timestamps: true
    };

    // Sync User model first to ensure it's created before UserProfile
    await User.sync({ 
      alter: process.env.NODE_ENV === 'development',
      tableName: 'users'  // Explicitly set table name to lowercase
    });
    logger.info('Users table synchronized successfully');

    // Then sync UserProfile
    await UserProfile.sync({ 
      alter: process.env.NODE_ENV === 'development',
      tableName: 'user_profiles'  // Explicitly set table name to lowercase
    });
    logger.info('User Profiles table synchronized successfully');
    
    // Sync all other models
    await sequelize.sync({ 
      // Use alter: true for development to automatically add/change columns 
      // Be cautious in production as it can lead to data loss
      alter: process.env.NODE_ENV === 'development' 
    });
    logger.info('Additional database models synchronized successfully');
    
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Check Redis connection
    await redis.ping();
    logger.info('Redis connection established successfully');
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    });

    // Add server to global for graceful shutdown
    global.httpServer = server;
  } catch (error) {
    logger.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful Shutdown process
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  
  if (global.httpServer) {
    global.httpServer.close(() => {
      logger.info('HTTP server closed');
      
      sequelize.close().then(() => {
        logger.info('Database connection closed');
        
        redis.quit().then(() => {
          logger.info('Redis connection closed');
          process.exit(0);
        }).catch(err => {
          logger.error('Error closing Redis:', err);
          process.exit(1);
        });
      }).catch(err => {
        logger.error('Error closing database:', err);
        process.exit(1);
      });
    });
  }
});

export default app;