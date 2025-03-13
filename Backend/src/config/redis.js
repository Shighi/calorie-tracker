// src/config/redis.js
import Redis from 'ioredis';
import env from './env.js';

// Redis connection setup
const redis = new Redis({
  host: env.REDIS_HOST || '127.0.0.1',
  port: env.REDIS_PORT || 6379,
  password: env.REDIS_PASSWORD || undefined,
  db: 0
});

// Test Redis connection
redis.ping()
  .then(() => console.log('Redis connected successfully'))
  .catch((err) => console.error('Redis connection error:', err));

export default redis;