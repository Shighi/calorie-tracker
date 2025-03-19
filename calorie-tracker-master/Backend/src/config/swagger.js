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
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          weight: { type: 'number', format: 'float' },
          height: { type: 'number', format: 'float' },
          age: { type: 'integer' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          activityLevel: {
            type: 'string',
            enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
          },
          dailyCalorieGoal: { type: 'integer' },
          preferredLocale: { type: 'string' }
        },
        required: ['username', 'email', 'password']
      },
      UserRegistration: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        },
        required: ['username', 'email', 'password']
      },
      UserLogin: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' }
        },
        required: ['email', 'password']
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      Food: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          localeId: { type: 'string', format: 'uuid' },
          nutrients: {
            type: 'object',
            properties: {
              calories: { type: 'number' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fat: { type: 'number' },
              fiber: { type: 'number' }
            }
          },
          servingSize: { type: 'number' },
          servingUnit: { type: 'string' },
          barcode: { type: 'string' },
          imageUrl: { type: 'string' }
        },
        required: ['name', 'category', 'nutrients', 'servingSize', 'servingUnit']
      },
      Meal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date-time' },
          mealType: { 
            type: 'string', 
            enum: ['breakfast', 'lunch', 'dinner', 'snack'] 
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                foodId: { type: 'string', format: 'uuid' },
                servings: { type: 'number' }
              }
            }
          },
          notes: { type: 'string' }
        },
        required: ['userId', 'date', 'mealType', 'items']
      },
      NutritionSummary: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          totalCalories: { type: 'number' },
          totalProtein: { type: 'number' },
          totalCarbs: { type: 'number' },
          totalFat: { type: 'number' },
          totalFiber: { type: 'number' },
          meals: {
            type: 'object',
            properties: {
              breakfast: {
                type: 'object',
                properties: {
                  calories: { type: 'number' }
                }
              },
              lunch: {
                type: 'object',
                properties: {
                  calories: { type: 'number' }
                }
              },
              dinner: {
                type: 'object',
                properties: {
                  calories: { type: 'number' }
                }
              },
              snack: {
                type: 'object',
                properties: {
                  calories: { type: 'number' }
                }
              }
            }
          },
          goalAchievement: {
            type: 'number',
            format: 'float',
            description: 'Percentage of calorie goal achieved'
          }
        }
      },
      Locale: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          countryCode: { type: 'string' },
          displayName: { type: 'string' },
          categories: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['name', 'countryCode', 'displayName']
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['error'] },
          code: { type: 'integer' },
          message: { type: 'string' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['success'] },
          data: { type: 'object' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserRegistration'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserLogin'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/auth/profile': {
      get: {
        summary: 'Get user profile',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update user profile',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  weight: { type: 'number' },
                  height: { type: 'number' },
                  age: { type: 'integer' },
                  gender: { type: 'string' },
                  activityLevel: { type: 'string' },
                  dailyCalorieGoal: { type: 'integer' },
                  preferredLocale: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/foods': {
      get: {
        summary: 'Returns a paginated list of foods',
        tags: ['Foods'],
        parameters: [
          {
            name: 'locale',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter foods by locale'
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter foods by category'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Number of items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Food list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        currentPage: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        totalItems: { type: 'integer' },
                        itemsPerPage: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new food item (Admin only)',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Food' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Food created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Food' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/foods/{id}': {
      get: {
        summary: 'Get detailed information about a specific food item',
        tags: ['Foods'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Food ID'
          }
        ],
        responses: {
          '200': {
            description: 'Food retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Food' }
              }
            }
          },
          '404': {
            description: 'Food not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update a food item (Admin only)',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Food ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Food' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Food updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Food' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Food not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Remove a food item (Admin only)',
        tags: ['Foods'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Food ID'
          }
        ],
        responses: {
          '200': {
            description: 'Food deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin only',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Food not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/meals': {
      get: {
        summary: "Get authenticated user's meal logs",
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Filter meals by date (YYYY-MM-DD)'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Number of items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Meals retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Meal' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        currentPage: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        totalItems: { type: 'integer' },
                        itemsPerPage: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new meal log',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  mealType: { 
                    type: 'string', 
                    enum: ['breakfast', 'lunch', 'dinner', 'snack'] 
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        foodId: { type: 'string', format: 'uuid' },
                        servings: { type: 'number' }
                      }
                    }
                  },
                  notes: { type: 'string' }
                },
                required: ['date', 'mealType', 'items']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Meal created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Meal' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/meals/{id}': {
      get: {
        summary: 'Get details of a specific meal log',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Meal ID'
          }
        ],
        responses: {
          '200': {
            description: 'Meal retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Meal' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Meal not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update an existing meal log',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Meal ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  mealType: { 
                    type: 'string', 
                    enum: ['breakfast', 'lunch', 'dinner', 'snack'] 
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        foodId: { type: 'string', format: 'uuid' },
                        servings: { type: 'number' }
                      }
                    }
                  },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Meal updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Meal' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Meal not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Remove a meal log',
        tags: ['Meals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Meal ID'
          }
        ],
        responses: {
          '200': {
            description: 'Meal deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '404': {
            description: 'Meal not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/nutrition/daily': {
      get: {
        summary: "Get user's nutritional totals for a specified date",
        tags: ['Nutrition'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Date (YYYY-MM-DD)',
            required: true
          }
        ],
        responses: {
          '200': {
            description: 'Daily nutrition data retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NutritionSummary' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/nutrition/weekly': {
      get: {
        summary: "Get user's nutritional summaries for a week",
        tags: ['Nutrition'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Start date (YYYY-MM-DD)',
            required: true
          }
        ],
        responses: {
          '200': {
            description: 'Weekly nutrition data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NutritionSummary' }
                    },
                    summary: {
                      type: 'object',
                      properties: {
                        averageCalories: { type: 'number' },
                        averageProtein: { type: 'number' },
                        averageCarbs: { type: 'number' },
                        averageFat: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/nutrition/monthly': {
      get: {
        summary: 'Get aggregated nutritional data over a month',
        tags: ['Nutrition'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'month',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 12
            },
            description: 'Month (1-12)',
            required: true
          },
          {
            name: 'year',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 2000
            },
            description: 'Year (e.g., 2025)',
            required: true
          }
        ],
        responses: {
          '200': {
            description: 'Monthly nutrition data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    dailyAverages: { $ref: '#/components/schemas/NutritionSummary' },
                    weeklyTrend: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          weekNumber: { type: 'integer' },
                          averageCalories: { type: 'number' }
                        }
                      }
                    },
                    goalAchievement: {
                      type: 'number',
                      description: 'Average percentage of calorie goal achieved'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/locales': {
      get: {
        summary: 'Get available locales/regions for food filtering',
        tags: ['Locales'],
        responses: {
          '200': {
            description: 'Locales retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Locale' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/locales/{id}/foods': {
      get: {
        summary: 'Get foods specific to a selected locale',
        tags: ['Locales'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Locale ID'
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by food category'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Number of items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Foods for locale retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        currentPage: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        totalItems: { type: 'integer' },
                        itemsPerPage: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Locale not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/public/foods': {
      get: {
        summary: 'Get a list of foods with nutritional information (public)',
        tags: ['Public API'],
        parameters: [
          {
            name: 'locale',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter foods by region/locale'
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by food category'
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Results per page'
          }
        ],
        responses: {
          '200': {
            description: 'Foods retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Food' }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        currentPage: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        totalItems: { type: 'integer' },
                        itemsPerPage: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/public/foods/{id}': {
      get: {
        summary: 'Get detailed information about a specific food item (public)',
        tags: ['Public API'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Food ID'
          }
        ],
        responses: {
          '200': {
            description: 'Food retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Food' }
              }
            }
          },
          '404': {
            description: 'Food not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/public/locales': {
      get: {
        summary: 'Get a list of all supported locales/regions (public)',
        tags: ['Public API'],
        responses: {
          '200': {
            description: 'Locales retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Locale' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
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