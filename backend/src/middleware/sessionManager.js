import Redis from 'ioredis';
import { getRedisClient, isRedisReady } from '../config/redis.js';

const REVOKED_TOKENS_PREFIX = 'revoked:token:';
const USER_SESSIONS_PREFIX = 'sessions:user:';
const REFRESH_TOKENS_PREFIX = 'refresh:token:';
const SESSION_METADATA_PREFIX = 'session:meta:';

const DEFAULT_MAX_SESSIONS_PER_USER = 5;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const ACCESS_TOKEN_TTL = 8 * 60 * 60; // 8 hours in seconds

let redisClient = null;
let revokedTokensStore = new Map();
let userSessionsStore = new Map();
let refreshTokensStore = new Map();
let sessionMetadataStore = new Map();

export function getRedis() {
  if (!redisClient) {
    redisClient = getRedisClient();
  }
  return redisClient;
}

async function ensureRedis() {
  const client = getRedis();
  if (client && isRedisReady()) {
    return true;
  }
  return false;
}

async function setWithTTL(key, value, ttlSeconds) {
  const useRedis = await ensureRedis();
  if (useRedis) {
    const client = getRedis();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } else {
    const store = getInMemoryStore(key);
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

async function getValue(key) {
  const useRedis = await ensureRedis();
  if (useRedis) {
    const client = getRedis();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } else {
    const store = getInMemoryStore(key);
    const entry = store.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) store.delete(key);
    return null;
  }
}

async function deleteKey(key) {
  const useRedis = await ensureRedis();
  if (useRedis) {
    const client = getRedis();
    await client.del(key);
  } else {
    const store = getInMemoryStore(key);
    store.delete(key);
  }
}

async function deletePattern(pattern) {
  const useRedis = await ensureRedis();
  if (useRedis) {
    const client = getRedis();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } else {
    for (const [storeName, store] of [
      ['revoked', revokedTokensStore],
      ['sessions', userSessionsStore],
      ['refresh', refreshTokensStore],
      ['meta', sessionMetadataStore]
    ]) {
      for (const key of store.keys()) {
        if (key.startsWith(pattern.replace('*', ''))) {
          store.delete(key);
        }
      }
    }
  }
}

function getInMemoryStore(key) {
  if (key.startsWith(REVOKED_TOKENS_PREFIX)) return revokedTokensStore;
  if (key.startsWith(USER_SESSIONS_PREFIX)) return userSessionsStore;
  if (key.startsWith(REFRESH_TOKENS_PREFIX)) return refreshTokensStore;
  if (key.startsWith(SESSION_METADATA_PREFIX)) return sessionMetadataStore;
  return new Map();
}

export async function revokeToken(tokenId, userId, reason = 'logout') {
  await setWithTTL(`${REVOKED_TOKENS_PREFIX}${tokenId}`, { userId, reason, revokedAt: Date.now() }, REFRESH_TOKEN_TTL);
  
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const userSessions = await getValue(userSessionsKey) || [];
  const updated = userSessions.filter(s => s.tokenId !== tokenId);
  await setWithTTL(userSessionsKey, updated, REFRESH_TOKEN_TTL);
  
  await deleteKey(`${REFRESH_TOKENS_PREFIX}${tokenId}`);
  await deleteKey(`${SESSION_METADATA_PREFIX}${tokenId}`);
}

export async function revokeAllUserTokens(userId, exceptTokenId = null, reason = 'revoke_all') {
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const userSessions = await getValue(userSessionsKey) || [];
  
  for (const session of userSessions) {
    if (session.tokenId !== exceptTokenId) {
      await setWithTTL(`${REVOKED_TOKENS_PREFIX}${session.tokenId}`, { userId, reason, revokedAt: Date.now() }, REFRESH_TOKEN_TTL);
      await deleteKey(`${REFRESH_TOKENS_PREFIX}${session.tokenId}`);
      await deleteKey(`${SESSION_METADATA_PREFIX}${session.tokenId}`);
    }
  }
  
  if (exceptTokenId) {
    const updated = userSessions.filter(s => s.tokenId === exceptTokenId);
    await setWithTTL(userSessionsKey, updated, REFRESH_TOKEN_TTL);
  } else {
    await deleteKey(userSessionsKey);
  }
}

export async function isTokenRevoked(tokenId) {
  const revoked = await getValue(`${REVOKED_TOKENS_PREFIX}${tokenId}`);
  return !!revoked;
}

export async function createSession(userId, tokenId, metadata = {}) {
  const session = {
    tokenId,
    userId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ip: metadata.ip || null,
    userAgent: metadata.userAgent || null,
    isCurrent: false,
    ...metadata
  };
  
  const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
  const userSessions = await getValue(userSessionsKey) || [];
  
  userSessions.push(session);
  
  if (userSessions.length > DEFAULT_MAX_SESSIONS_PER_USER) {
    const oldest = userSessions.sort((a, b) => a.lastActivity - b.lastActivity)[0];
    if (oldest.tokenId !== tokenId) {
      await revokeToken(oldest.tokenId, userId, 'max_sessions_exceeded');
    }
    const filtered = userSessions.filter(s => s.tokenId !== oldest.tokenId);
    await setWithTTL(userSessionsKey, filtered, REFRESH_TOKEN_TTL);
  } else {
    await setWithTTL(userSessionsKey, userSessions, REFRESH_TOKEN_TTL);
  }
  
  await setWithTTL(`${SESSION_METADATA_PREFIX}${tokenId}`, session, REFRESH_TOKEN_TTL);
  
  return session;
}

export async function updateSessionActivity(tokenId) {
  const session = await getValue(`${SESSION_METADATA_PREFIX}${tokenId}`);
  if (session) {
    session.lastActivity = Date.now();
    await setWithTTL(`${SESSION_METADATA_PREFIX}${tokenId}`, session, REFRESH_TOKEN_TTL);
    
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${session.userId}`;
    const userSessions = await getValue(userSessionsKey) || [];
    const idx = userSessions.findIndex(s => s.tokenId === tokenId);
    if (idx !== -1) {
      userSessions[idx].lastActivity = Date.now();
      await setWithTTL(userSessionsKey, userSessions, REFRESH_TOKEN_TTL);
    }
  }
}

export async function getUserSessions(userId) {
  return await getValue(`${USER_SESSIONS_PREFIX}${userId}`) || [];
}

export async function getSessionMetadata(tokenId) {
  return await getValue(`${SESSION_METADATA_PREFIX}${tokenId}`);
}

export async function storeRefreshToken(tokenId, refreshTokenHash, userId) {
  await setWithTTL(`${REFRESH_TOKENS_PREFIX}${tokenId}`, { refreshTokenHash, userId, createdAt: Date.now() }, REFRESH_TOKEN_TTL);
}

export async function verifyRefreshToken(tokenId, refreshTokenHash) {
  const stored = await getValue(`${REFRESH_TOKENS_PREFIX}${tokenId}`);
  if (!stored) return false;
  return stored.refreshTokenHash === refreshTokenHash;
}

export async function deleteRefreshToken(tokenId) {
  await deleteKey(`${REFRESH_TOKENS_PREFIX}${tokenId}`);
}

export async function cleanupExpiredSessions() {
  // This would be run periodically
  // For in-memory stores, we clean up on access
  // For Redis, we rely on TTL expiration
}

export { DEFAULT_MAX_SESSIONS_PER_USER, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL };