import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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

export default (app) => {
  // Swagger UI route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Swagger JSON route
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};