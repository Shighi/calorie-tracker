// src/services/cacheService.js
import redis from '../config/redis.js';

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

const cacheService = {
  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached data or null
   */
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} expiration - Expiration time in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, data, expiration = DEFAULT_EXPIRATION) {
    try {
      await redis.set(key, JSON.stringify(data));
      await redis.expire(key, expiration);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete data from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Pattern to match keys
   * @returns {Promise<boolean>} - Success status
   */
  async deleteByPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete by pattern error:', error);
      return false;
    }
  }
};

export default cacheService;