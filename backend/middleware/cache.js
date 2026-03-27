import NodeCache from 'node-cache';

// Create cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Middleware to check cache
export const cacheMiddleware = (keyGenerator) => {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body);
      return originalJson(body);
    };
    
    next();
  };
};

// Clear cache by key pattern
export const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
};

// Cache specific endpoints
export const leaderboardCache = cacheMiddleware(() => 'leaderboard');
export const rewardsCache = cacheMiddleware(() => 'rewards');
export const badgesCache = cacheMiddleware(() => 'badges');
