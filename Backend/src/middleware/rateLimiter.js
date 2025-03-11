import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs, // Time window in milliseconds
    max: maxRequests, // Limit each IP to X requests per windowMs
    message: message || 'Too many requests, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      return req.ip; // Limit based on IP address
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        status: 429
      });
    }
  });
};

// Different rate limiters for different routes/endpoints
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per 15 minutes
  'Too many login attempts, please try again later'
);

export const apiLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  500 // 500 requests per hour
);

export const strictLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  50 // More strict limit
);

export default createLimiter;