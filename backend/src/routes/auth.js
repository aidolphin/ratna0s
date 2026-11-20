import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createRateLimiter, createIpRateLimiter, createCombinedRateLimiter } from '../middleware/rateLimiter.js';
import { 
  createUserSession, 
  refreshAccessToken, 
  invalidateSession, 
  invalidateAllUserSessions,
  validateAccessToken,
  createStepUpToken,
  validateStepUpToken,
  getUserSessions,
  getSessionMetadata,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  DEFAULT_MAX_SESSIONS_PER_USER
} from '../middleware/secureTokens.js';
import { 
  setAuthCookies, 
  clearAuthCookies, 
  getRefreshToken, 
  getAccessToken, 
  getCsrfToken,
  validateCsrfToken
} from '../middleware/cookies.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const BCRYPT_ROUNDS = 12;

const users = new Map();

const defaultUsers = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', email: '', active: true },
  { username: 'manager', password: 'manager123', role: 'manager', name: 'Store Manager', email: '', active: true },
  { username: 'sales', password: 'sales123', role: 'sales', name: 'Sales Staff', email: '', active: true },
  { username: 'production', password: 'prod123', role: 'production', name: 'Production Head', email: '', active: true },
  { username: 'accountant', password: 'account123', role: 'accountant', name: 'Accountant', email: '', active: true },
  { username: 'viewer', password: 'viewer123', role: 'viewer', name: 'Viewer', email: '', active: true },
];

async function initUsers() {
  for (const user of defaultUsers) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    users.set(user.username, { ...user, passwordHash, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true });
  }
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

const loginLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'login', 
    keyPrefix: 'login',
    getAccountId: (req) => req.body?.username
  }),
  createIpRateLimiter({ category: 'auth' })
);

const registerLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'register', 
    keyPrefix: 'register'
  }),
  createIpRateLimiter({ category: 'auth' })
);

const passwordResetLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'passwordReset', 
    keyPrefix: 'pwreset',
    getAccountId: (req) => req.body?.username || req.body?.email
  }),
  createIpRateLimiter({ category: 'auth' })
);

const passwordRecoveryLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'passwordRecovery', 
    keyPrefix: 'pwrecovery',
    getAccountId: (req) => req.body?.email
  }),
  createIpRateLimiter({ category: 'auth' })
);

const tokenRefreshLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'tokenRefresh', 
    keyPrefix: 'tokenrefresh',
    getAccountId: (req) => getRefreshToken(req)
  }),
  createIpRateLimiter({ category: 'auth' })
);

const logoutLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'logout', 
    keyPrefix: 'logout',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'auth' })
);

const stepUpLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'stepUp', 
    keyPrefix: 'stepup',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'auth' })
);

const sessionsLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'auth', 
    endpoint: 'sessions', 
    keyPrefix: 'sessions',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'auth' })
);

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username and password are required' });
    }

    const user = users.get(username);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    user.lastLogin = new Date().toISOString();
    users.set(username, user);

    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const session = await createUserSession(user, metadata);
    const csrfToken = generateCsrfToken();

    setAuthCookies(res, {
      accessToken: session.accessToken,
      refreshToken: session.refreshTokenJwt,
      sessionId: session.sessionId,
      csrfToken,
    });

    res.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      csrfToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during login' });
  }
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username, password, role, and name are required' });
    }

    const validRoles = ['admin', 'manager', 'sales', 'production', 'accountant', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid role' });
    }

    if (users.has(username)) {
      return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = {
      username,
      passwordHash,
      role,
      name,
      email: email || '',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      mustChangePassword: true,
    };

    users.set(username, user);

    const metadata = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const session = await createUserSession(user, metadata);
    const csrfToken = generateCsrfToken();

    setAuthCookies(res, {
      accessToken: session.accessToken,
      refreshToken: session.refreshTokenJwt,
      sessionId: session.sessionId,
      csrfToken,
    });

    res.status(201).json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      csrfToken,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during registration' });
  }
});

router.post('/password/reset', passwordResetLimiter, async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Bad Request', message: 'Username, current password, and new password are required' });
    }

    const user = users.get(username);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    users.set(username, user);

    await invalidateAllUserSessions(username, null, 'password_change');

    res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during password reset' });
  }
});

router.post('/password/recovery', passwordRecoveryLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email is required' });
    }

    const user = Array.from(users.values()).find(u => u.email === email && u.active);

    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a recovery link has been sent' });
    }

    await invalidateAllUserSessions(user.username, null, 'password_recovery');

    res.json({ success: true, message: 'If the email exists, a recovery link has been sent' });
  } catch (err) {
    console.error('Password recovery error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during password recovery' });
  }
});

router.post('/token/refresh', tokenRefreshLimiter, async (req, res) => {
  try {
    const refreshToken = getRefreshToken(req) || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Bad Request', message: 'Refresh token is required' });
    }

    // Decode refresh token to get user ID (without verification - verification happens in refreshAccessToken)
    const decoded = jwt.decode(refreshToken);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    const user = users.get(decoded.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or inactive' });
    }

    const result = await refreshAccessToken(refreshToken, user, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (!result.success) {
      return res.status(401).json({ error: 'Unauthorized', message: result.error });
    }

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshTokenJwt,
      sessionId: result.sessionId,
      csrfToken,
    });

    res.json({ 
      success: true, 
      accessToken: result.accessToken, 
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      csrfToken,
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during token refresh' });
  }
});

router.post('/logout', logoutLimiter, async (req, res) => {
  try {
    const accessToken = getAccessToken(req);
    if (accessToken) {
      const validation = await validateAccessToken(accessToken, false);
      if (validation.valid && validation.decoded?.jti) {
        await invalidateSession(validation.decoded.jti, validation.decoded.sub, 'logout');
      }
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during logout' });
  }
});

router.post('/logout/all', logoutLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const accessToken = getAccessToken(req);
    let currentTokenId = null;
    
    if (accessToken) {
      const validation = await validateAccessToken(accessToken, false);
      if (validation.valid) {
        currentTokenId = validation.decoded.jti;
      }
    }

    await invalidateAllUserSessions(req.user.username, currentTokenId, 'logout_all');
    clearAuthCookies(res);

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (err) {
    console.error('Logout all error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during logout' });
  }
});

router.post('/step-up', stepUpLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const { operation, password } = req.body;

    if (!operation || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Operation and password are required' });
    }

    const validOperations = ['delete_user', 'change_role', 'export_data', 'financial_approval', 'settings_change'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid operation' });
    }

    const user = users.get(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid password' });
    }

    const accessToken = getAccessToken(req);
    const validation = await validateAccessToken(accessToken, false);
    if (!validation.valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
    }

    const stepUp = await createStepUpToken(user, validation.decoded.sid, operation);

    res.json({ 
      success: true, 
      stepUpToken: stepUp.stepUpToken, 
      expiresIn: stepUp.expiresIn,
      operation,
    });
  } catch (err) {
    console.error('Step-up error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred during step-up authentication' });
  }
});

router.get('/sessions', sessionsLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const sessions = await getUserSessions(req.user.username);
    const currentToken = getAccessToken(req);
    let currentTokenId = null;
    
    if (currentToken) {
      const validation = await validateAccessToken(currentToken, false);
      if (validation.valid) {
        currentTokenId = validation.decoded.jti;
      }
    }

    const sanitizedSessions = sessions.map(s => ({
      sessionId: s.sessionId,
      tokenId: s.tokenId,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
      ip: s.ip,
      userAgent: s.userAgent,
      isCurrent: s.tokenId === currentTokenId,
    }));

    res.json({ success: true, sessions: sanitizedSessions });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred retrieving sessions' });
  }
});

router.delete('/sessions/:tokenId', sessionsLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const { tokenId } = req.params;
    const accessToken = getAccessToken(req);
    let currentTokenId = null;
    
    if (accessToken) {
      const validation = await validateAccessToken(accessToken, false);
      if (validation.valid) {
        currentTokenId = validation.decoded.jti;
      }
    }

    if (tokenId === currentTokenId) {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot revoke current session. Use logout instead.' });
    }

    await invalidateSession(tokenId, req.user.username, 'user_revoked');

    res.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred revoking session' });
  }
});

router.delete('/sessions', sessionsLimiter, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const accessToken = getAccessToken(req);
    let currentTokenId = null;
    
    if (accessToken) {
      const validation = await validateAccessToken(accessToken, false);
      if (validation.valid) {
        currentTokenId = validation.decoded.jti;
      }
    }

    await invalidateAllUserSessions(req.user.username, currentTokenId, 'user_revoked_all');
    clearAuthCookies(res);

    res.json({ success: true, message: 'All other sessions revoked' });
  } catch (err) {
    console.error('Revoke all sessions error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred revoking sessions' });
  }
});

export async function authenticateToken(req, res, next) {
  const token = getAccessToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
  }

  const result = await validateAccessToken(token);

  if (!result.valid) {
    if (result.expired) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Forbidden', message: result.error || 'Invalid token' });
  }

  const { decoded } = result;
  const user = users.get(decoded.sub);

  if (!user || !user.active) {
    return res.status(403).json({ error: 'Forbidden', message: 'User not found or inactive' });
  }

  req.user = { username: user.username, role: user.role, name: user.name };
  req.tokenId = decoded.jti;
  req.sessionId = decoded.sid;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireStepUp(operation) {
  return async (req, res, next) => {
    const stepUpToken = req.headers['x-step-up-token'] || req.body?.stepUpToken;
    
    if (!stepUpToken) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Step-up authentication required',
        code: 'STEP_UP_REQUIRED',
        operation 
      });
    }

    const result = await validateStepUpToken(stepUpToken, operation);
    
    if (!result.valid) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: result.error || 'Invalid step-up token',
        code: 'STEP_UP_INVALID'
      });
    }

    req.stepUp = result.decoded;
    next();
  };
}

export { initUsers, users, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, DEFAULT_MAX_SESSIONS_PER_USER };
export default router;