import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient, isRedisReady } from '../config/redis.js';
import { getLimitConfig, getIpLimitConfig } from '../config/rateLimits.js';

function createInMemoryStore() {
  const store = new Map();
  return {
    async increment(key) {
      const now = Date.now();
      const entry = store.get(key) || { count: 0, resetTime: new Date(now) };
      entry.count++;
      store.set(key, entry);
      return { totalHits: entry.count, resetTime: entry.resetTime };
    },
    async decrement(key) {
      const entry = store.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    },
    async resetKey(key) {
      store.delete(key);
    },
  };
}

function createStore(prefix) {
  if (isRedisReady()) {
    const client = getRedisClient();
    if (client) {
      return new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: `ratelimit:${prefix}:`,
      });
    }
  }
  return createInMemoryStore();
}

function createCombinedKeyGenerator(prefix, getAccountId) {
  return (req) => {
    const accountId = getAccountId(req);
    const ip = ipKeyGenerator(req);
    return accountId ? `${prefix}:${accountId}` : `ip:${ip}`;
  };
}

export function createRateLimiter(options = {}) {
  const {
    category = 'default',
    endpoint = 'default',
    keyPrefix,
    getAccountId,
    keyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler,
    ...restOptions
  } = options;

  const limitConfig = getLimitConfig(category, endpoint);
  const store = createStore(`${category}:${endpoint}`);

  let finalKeyGenerator = keyGenerator;
  if (!finalKeyGenerator) {
    if (keyPrefix && getAccountId) {
      finalKeyGenerator = createCombinedKeyGenerator(keyPrefix, getAccountId);
    } else if (keyPrefix) {
      finalKeyGenerator = (req) => `${keyPrefix}:${ipKeyGenerator(req)}`;
    } else {
      finalKeyGenerator = ipKeyGenerator;
    }
  }

  const defaultHandler = (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit?.resetTime ? req.rateLimit.resetTime - Date.now() : limitConfig.windowMs) / 1000);
    res.set('Retry-After', String(Math.max(1, retryAfter)));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.max(1, retryAfter),
    });
  };

  return rateLimit({
    windowMs: limitConfig.windowMs,
    max: limitConfig.max,
    keyGenerator: finalKeyGenerator,
    skipSuccessfulRequests,
    skipFailedRequests,
    store,
    handler: handler || defaultHandler,
    standardHeaders: true,
    legacyHeaders: false,
    ...restOptions,
  });
}

export function createIpRateLimiter(options = {}) {
  const {
    category = 'default',
    handler,
    ...restOptions
  } = options;

  const limitConfig = getIpLimitConfig(category);
  const store = createStore(`ip:${category}`);

  const defaultHandler = (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit?.resetTime ? req.rateLimit.resetTime - Date.now() : limitConfig.windowMs) / 1000);
    res.set('Retry-After', String(Math.max(1, retryAfter)));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP. Please try again later.',
      retryAfter: Math.max(1, retryAfter),
    });
  };

  return rateLimit({
    windowMs: limitConfig.windowMs,
    max: limitConfig.max,
    keyGenerator: ipKeyGenerator,
    store,
    handler: handler || defaultHandler,
    standardHeaders: true,
    legacyHeaders: false,
    ...restOptions,
  });
}

export function createCombinedRateLimiter(accountLimiter, ipLimiter) {
  return async (req, res, next) => {
    await new Promise((resolve, reject) => {
      accountLimiter(req, res, (err) => {
        if (err) return reject(err);
        if (res.headersSent) return resolve();
        ipLimiter(req, res, (err2) => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });
    next();
  };
}

export { createStore, ipKeyGenerator };