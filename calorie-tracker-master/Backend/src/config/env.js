// src/config/env.js

import dotenv from 'dotenv';
import path from 'path';

// Determine the environment
const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment-specific .env file
const envFile = nodeEnv === 'development' ? '.env' : `.env.${nodeEnv}`;
dotenv.config({ 
  path: path.resolve(process.cwd(), envFile) 
});

// Validate required environment variables
const requiredEnvs = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'PORT'
];

requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    console.error(`FATAL ERROR: ${env} is not defined`);
    process.exit(1);
  }
});

const config = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'postgres',
  },
  server: {
    port: process.env.PORT || 3000,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  },
  externalApis: {
    usdaApiKey: process.env.USDA_API_KEY,
    openFoodFactsUrl: process.env.OPEN_FOOD_FACTS_API_KEY,
  },
  // Added these direct properties to match what authService.js expects
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
};

export default config;