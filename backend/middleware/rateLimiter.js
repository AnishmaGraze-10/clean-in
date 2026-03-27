import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// General API rate limiter - 1000 requests per 15 minutes per IP (increased for dev)
export const apiLimiter = isDev 
  ? (req, res, next) => next() // Skip rate limiting in development
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many requests from this IP, please try again after 15 minutes'
        });
      }
    });

// Stricter limiter for auth endpoints - 20 requests per 15 minutes per IP
export const authLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // limit each IP to 20 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many login attempts from this IP, please try again after 15 minutes'
        });
      }
    });

// Limiter for report submissions - 50 reports per hour per IP
export const reportLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // limit each IP to 50 reports per hour
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many reports submitted from this IP, please try again later'
        });
      }
    });
