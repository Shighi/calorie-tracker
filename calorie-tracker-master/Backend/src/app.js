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
import userProfileRoutes from './routes/userProfileRoutes.js';

// Environment configuration
import dotenv from 'dotenv';
dotenv.config();

// Initialize app
const app = express();

// Swagger configuration
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
      url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api`,
      description: 'Development server'
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

const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:3000', 
      'http://127.0.0.1:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
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

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS support
app.use(compression()); // Response compression
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Set up Swagger UI before other routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Performance and security middleware
app.use((req, res, next) => {
  res.locals.startTime = Date.now();
  
  const oldJson = res.json;
  res.json = function(body) {
    res.locals.responseBody = body;
    return oldJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - res.locals.startTime;
    logger.info(`Response time: ${duration}ms for ${req.method} ${req.originalUrl}`);
  });

  next();
});

// Apply rate limiting to sensitive routes
app.use('/api/auth', apiLimiter);
app.use('/api/user', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/locales', localeRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    redis: redis.status === 'ready' ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 'error', 
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Export the app
export default app;