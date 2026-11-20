import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { 
  createSession, 
  revokeToken, 
  revokeAllUserTokens, 
  isTokenRevoked, 
  updateSessionActivity,
  storeRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
  getUserSessions,
  getSessionMetadata,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  DEFAULT_MAX_SESSIONS_PER_USER
} from './sessionManager.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_ALGORITHM = 'HS256';

const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  STEP_UP: 'step_up'
};

function generateTokenId() {
  return crypto.randomBytes(16).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user, tokenId, sessionId) {
  return jwt.sign(
    { 
      sub: user.username, 
      role: user.role, 
      name: user.name,
      jti: tokenId,
      sid: sessionId,
      type: TOKEN_TYPES.ACCESS
    },
    JWT_SECRET,
    { 
      algorithm: JWT_ALGORITHM,
      expiresIn: `${ACCESS_TOKEN_TTL}s`
    }
  );
}

function generateRefreshToken(user, tokenId, sessionId) {
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  const jwtToken = jwt.sign(
    { 
      sub: user.username, 
      jti: tokenId,
      sid: sessionId,
      type: TOKEN_TYPES.REFRESH
    },
    JWT_SECRET,
    { 
      algorithm: JWT_ALGORITHM,
      expiresIn: `${REFRESH_TOKEN_TTL}s`
    }
  );
  
  const refreshTokenHash = hashToken(jwtToken);
  
  return {
    token: refreshToken,
    hash: refreshTokenHash,
    jwt: jwtToken
  };
}

function generateStepUpToken(user, tokenId, sessionId, operation) {
  return jwt.sign(
    { 
      sub: user.username, 
      role: user.role, 
      name: user.name,
      jti: tokenId,
      sid: sessionId,
      type: TOKEN_TYPES.STEP_UP,
      operation
    },
    JWT_SECRET,
    { 
      algorithm: JWT_ALGORITHM,
      expiresIn: '5m'
    }
  );
}

function verifyToken(token, expectedType = null) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    
    if (expectedType && decoded.type !== expectedType) {
      return { valid: false, error: 'Invalid token type' };
    }
    
    return { valid: true, decoded };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired', expired: true };
    }
    return { valid: false, error: 'Invalid token' };
  }
}

async function createUserSession(user, metadata = {}) {
  const tokenId = generateTokenId();
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  const accessToken = generateAccessToken(user, tokenId, sessionId);
  const { token: refreshToken, hash: refreshTokenHash, jwt: refreshJwt } = generateRefreshToken(user, tokenId, sessionId);
  
  await storeRefreshToken(tokenId, refreshTokenHash, user.username);
  await createSession(user.username, tokenId, { 
    sessionId, 
    ...metadata 
  });
  
  return {
    accessToken,
    refreshToken,
    refreshTokenJwt: refreshJwt,
    tokenId,
    sessionId,
    expiresIn: ACCESS_TOKEN_TTL,
    refreshExpiresIn: REFRESH_TOKEN_TTL
  };
}

async function rotateTokens(user, oldTokenId, oldSessionId, metadata = {}) {
  await revokeToken(oldTokenId, user.username, 'rotation');
  await deleteRefreshToken(oldTokenId);
  
  return await createUserSession(user, { ...metadata, previousSessionId: oldSessionId });
}

async function refreshAccessToken(refreshToken, user, metadata = {}) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { success: false, error: 'Refresh token expired', expired: true };
    }
    return { success: false, error: 'Invalid refresh token' };
  }
  
  if (!decoded || !decoded.jti || decoded.type !== TOKEN_TYPES.REFRESH) {
    return { success: false, error: 'Invalid refresh token' };
  }
  
  const refreshTokenHash = hashToken(refreshToken);
  const isValid = await verifyRefreshToken(decoded.jti, refreshTokenHash);
  if (!isValid) {
    return { success: false, error: 'Refresh token not found or revoked' };
  }
  
  const revoked = await isTokenRevoked(decoded.jti);
  if (revoked) {
    return { success: false, error: 'Token has been revoked' };
  }
  
  await revokeToken(decoded.jti, user.username, 'refresh_rotation');
  await deleteRefreshToken(decoded.jti);
  
  const newSession = await createUserSession(user, { ...metadata, previousSessionId: decoded.sid });
  
  return { success: true, ...newSession };
}

async function invalidateSession(tokenId, userId, reason = 'logout') {
  await revokeToken(tokenId, userId, reason);
  await deleteRefreshToken(tokenId);
}

async function invalidateAllUserSessions(userId, currentTokenId = null, reason = 'revoke_all') {
  await revokeAllUserTokens(userId, currentTokenId, reason);
}

async function validateAccessToken(token, requireActive = true) {
  const result = verifyToken(token, TOKEN_TYPES.ACCESS);
  
  if (!result.valid) {
    return { valid: false, error: result.error, expired: result.expired };
  }
  
  const { decoded } = result;
  
  if (requireActive) {
    const revoked = await isTokenRevoked(decoded.jti);
    if (revoked) {
      return { valid: false, error: 'Token has been revoked' };
    }
  }
  
  await updateSessionActivity(decoded.jti);
  
  return { valid: true, decoded };
}

async function validateRefreshToken(token) {
  const result = verifyToken(token, TOKEN_TYPES.REFRESH);
  
  if (!result.valid) {
    return { valid: false, error: result.error, expired: result.expired };
  }
  
  const { decoded } = result;
  const revoked = await isTokenRevoked(decoded.jti);
  if (revoked) {
    return { valid: false, error: 'Token has been revoked' };
  }
  
  return { valid: true, decoded };
}

async function createStepUpToken(user, sessionId, operation) {
  const tokenId = generateTokenId();
  const stepUpToken = generateStepUpToken(user, tokenId, sessionId, operation);
  
  return { stepUpToken, tokenId, expiresIn: 300 };
}

async function validateStepUpToken(token, expectedOperation) {
  const result = verifyToken(token, TOKEN_TYPES.STEP_UP);
  
  if (!result.valid) {
    return { valid: false, error: result.error, expired: result.expired };
  }
  
  const { decoded } = result;
  
  if (decoded.operation !== expectedOperation) {
    return { valid: false, error: 'Invalid step-up operation' };
  }
  
  const revoked = await isTokenRevoked(decoded.jti);
  if (revoked) {
    return { valid: false, error: 'Token has been revoked' };
  }
  
  return { valid: true, decoded };
}

export { 
  createUserSession,
  rotateTokens,
  refreshAccessToken,
  invalidateSession,
  invalidateAllUserSessions,
  validateAccessToken,
  validateRefreshToken,
  createStepUpToken,
  validateStepUpToken,
  generateTokenId,
  hashToken,
  TOKEN_TYPES,
  JWT_SECRET,
  JWT_ALGORITHM,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  DEFAULT_MAX_SESSIONS_PER_USER,
  getUserSessions,
  getSessionMetadata
};