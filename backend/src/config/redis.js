import Redis from 'ioredis';

let redisClient = null;
let isRedisAvailable = false;

export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;

  if (!redisUrl) {
    console.warn('Redis URL not configured, rate limiting will use in-memory store (not suitable for multi-instance deployments)');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('Redis connected for rate limiting');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      console.error('Redis connection error:', err.message);
    });

    redisClient.on('close', () => {
      isRedisAvailable = false;
      console.warn('Redis connection closed');
    });

    return redisClient;
  } catch (err) {
    console.error('Failed to initialize Redis client:', err.message);
    return null;
  }
}

export function isRedisReady() {
  return isRedisAvailable && redisClient?.status === 'ready';
}

export async function connectRedis() {
  const client = getRedisClient();
  if (client && !isRedisAvailable) {
    try {
      await client.connect();
      return true;
    } catch (err) {
      console.error('Failed to connect to Redis:', err.message);
      return false;
    }
  }
  return isRedisAvailable;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}

export { redisClient as default };