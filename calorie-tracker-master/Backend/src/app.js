// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import redis from './config/redis.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import localeRoutes from './routes/localeRoutes.js';
import testRoutes from './routes/testRoutes.js';

// Initialize app
const app = express();

// Set up Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Calorie Tracker API',
    version: '1.0.0',
    description: 'API documentation for Calorie Tracker Backend',
    contact: {
      name: 'API Support',
      email: 'support@calorietracker.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local development server'
    },
    {
      url: 'https://api.calorietracker.com/v1',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(compression()); // Response compression
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set up Swagger UI before other routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Apply rate limiting to sensitive routes
app.use('/api/auth', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/locales', localeRoutes);
app.use('/api', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    redis: redis.status === 'ready' ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Endpoint not found' 
  });
});

// Global error handler
app.use(errorHandler);

// Export the app
export default app;