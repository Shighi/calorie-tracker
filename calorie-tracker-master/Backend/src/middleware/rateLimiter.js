import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, maxRequests, message) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        status: 429
      });
    }
  });
};

// Export named limiters with clear purposes
export const strictLimiter = createLimiter(15 * 60 * 1000, 50); // 50 requests/15min
export const standardLimiter = createLimiter(15 * 60 * 1000, 100); // 100 requests/15min
export const authLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many login attempts, please try again later');
export const apiLimiter = createLimiter(60 * 60 * 1000, 500); // 500 requests/hour

// Remove default export to avoid confusion - keeping this as a comment as reminder
export default createLimiter;