const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const mealRoutes = require('./routes/mealRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const localeRoutes = require('./routes/localeRoutes');

// Initialize app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(compression()); // Response compression
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting to sensitive routes
app.use('/api/auth', rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/locales', localeRoutes);

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
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

module.exports = app;