import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const JWT_SECRET = 'test-secret';
  const ACCESS_TTL = 8 * 60 * 60;
  const REFRESH_TTL = 7 * 24 * 60 * 60;
  const DEFAULT_MAX_SESSIONS_PER_USER = 5;

  const users = new Map();
  const revokedTokens = new Map();
  const refreshTokens = new Map();
  const userSessions = new Map();

  const testPassword = 'password123';
  const testPasswordHash = bcrypt.hashSync(testPassword, 12);

  const defaultUser = {
    username: 'testuser',
    passwordHash: testPasswordHash,
    role: 'admin',
    name: 'Test User',
    email: 'test@example.com',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    mustChangePassword: false,
  };
  users.set('testuser', defaultUser);

  const testUser = {
    username: 'test',
    passwordHash: testPasswordHash,
    role: 'admin',
    name: 'Test',
    email: 'test@test.com',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    mustChangePassword: false,
  };
  users.set('test', testUser);

  function generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }

  function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  function generateAccessToken(user, tokenId, sessionId) {
    const jwt = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: {
        sub: user.username,
        role: user.role,
        name: user.name,
        jti: tokenId,
        sid: sessionId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + ACCESS_TTL,
      },
    };
    const encoded = Buffer.from(JSON.stringify(jwt.header)).toString('base64url') + '.' +
      Buffer.from(JSON.stringify(jwt.payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
    return encoded + '.' + sig;
  }

  function generateRefreshToken(user, tokenId, sessionId) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const jwt = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: {
        sub: user.username,
        jti: tokenId,
        sid: sessionId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + REFRESH_TTL,
      },
    };
    const encoded = Buffer.from(JSON.stringify(jwt.header)).toString('base64url') + '.' +
      Buffer.from(JSON.stringify(jwt.payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
    const jwtToken = encoded + '.' + sig;
    const refreshTokenHash = hashToken(jwtToken);
    return {
      token: refreshToken,
      hash: refreshTokenHash,
      jwt: jwtToken,
    };
  }

  function verifyToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false, error: 'Invalid format' };
      
      const encoded = parts[0] + '.' + parts[1];
      const sig = parts[2];
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
      
      if (sig !== expectedSig) return { valid: false, error: 'Invalid signature' };
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      if (payload.exp * 1000 < Date.now()) {
        return { valid: false, error: 'Token expired', expired: true };
      }
      
      return { valid: true, decoded: payload };
    } catch {
      return { valid: false, error: 'Invalid token' };
    }
  }

  async function createUserSession(user, metadata = {}) {
    let userSessionList = userSessions.get(user.username) || [];
    
    if (userSessionList.length >= DEFAULT_MAX_SESSIONS_PER_USER) {
      const oldest = userSessionList.sort((a, b) => a.createdAt - b.createdAt)[0];
      revokedTokens.set(oldest.tokenId, { userId: user.username, revokedAt: Date.now() });
      refreshTokens.delete(oldest.tokenId);
      userSessionList = userSessionList.filter(s => s.tokenId !== oldest.tokenId);
    }
    
    const tokenId = generateTokenId();
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    const accessToken = generateAccessToken(user, tokenId, sessionId);
    const { token: refreshToken, hash: refreshTokenHash, jwt: refreshJwt } = generateRefreshToken(user, tokenId, sessionId);
    
    refreshTokens.set(tokenId, { hash: refreshTokenHash, userId: user.username, createdAt: Date.now() });
    
    const session = {
      tokenId,
      userId: user.username,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      sessionId,
    };
    
    userSessionList.push(session);
    userSessions.set(user.username, userSessionList);
    
    return {
      accessToken,
      refreshToken,
      refreshTokenJwt: refreshJwt,
      tokenId,
      sessionId,
      expiresIn: ACCESS_TTL,
      refreshExpiresIn: REFRESH_TTL,
    };
  }

  async function validateAccessToken(token) {
    const result = verifyToken(token);
    if (!result.valid) return result;
    
    const revoked = revokedTokens.has(result.decoded.jti);
    if (revoked) return { valid: false, error: 'Token has been revoked' };
    
    return result;
  }

  async function invalidateSession(tokenId, userId) {
    revokedTokens.set(tokenId, { userId, revokedAt: Date.now() });
    refreshTokens.delete(tokenId);
    
    const userSessionList = userSessions.get(userId) || [];
    const filtered = userSessionList.filter(s => s.tokenId !== tokenId);
    userSessions.set(userId, filtered);
  }

  async function invalidateAllUserSessions(userId, currentTokenId = null) {
    const userSessionList = userSessions.get(userId) || [];
    for (const session of userSessionList) {
      if (session.tokenId !== currentTokenId) {
        revokedTokens.set(session.tokenId, { userId, revokedAt: Date.now() });
        refreshTokens.delete(session.tokenId);
      }
    }
    if (currentTokenId) {
      userSessions.set(userId, userSessionList.filter(s => s.tokenId === currentTokenId));
    } else {
      userSessions.delete(userId);
    }
  }

  function getAccessToken(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    return cookies.ratnaos_access || 
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  }

  function getRefreshToken(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    const cookieToken = cookies.ratnaos_refresh;
    if (cookieToken) return cookieToken;
    if (req.body?.refreshToken) return req.body.refreshToken;
    
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const decoded = verifyToken(token);
      if (decoded.valid && decoded.decoded.type === 'refresh') return token;
    }
    return null;
  }

  function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(c => {
      const [key, ...rest] = c.trim().split('=');
      if (key && rest.length) cookies[key] = rest.join('=');
    });
    return cookies;
  }

  function setAuthCookies(res, { accessToken, refreshTokenJwt, sessionId, csrfToken }) {
    res.setHeader('Set-Cookie', [
      `ratnaos_access=${accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${ACCESS_TTL}`,
      `ratnaos_refresh=${refreshTokenJwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${REFRESH_TTL}`,
      `ratnaos_sid=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${REFRESH_TTL}`,
      `ratnaos_csrf=${csrfToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${REFRESH_TTL}`,
    ]);
  }

  function clearAuthCookies(res) {
    res.setHeader('Set-Cookie', [
      'ratnaos_access=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'ratnaos_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'ratnaos_sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'ratnaos_csrf=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    ]);
  }

  function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  const requestCounts = new Map();

  function createRateLimiter(max, windowMs, keyGen) {
    return (req, res, next) => {
      const key = keyGen(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      let entry = requestCounts.get(key);
      if (!entry || entry.windowStart < windowStart) {
        entry = { count: 0, windowStart: now };
      }
      entry.count++;
      requestCounts.set(key, entry);

      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
      res.set('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + windowMs) / 1000)));

      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
        res.set('Retry-After', String(Math.max(1, retryAfter)));
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.max(1, retryAfter),
        });
      }
      next();
    };
  }

  const loginLimiter = createRateLimiter(5, 15 * 60 * 1000, (req) => `login:${req.body?.username || req.ip}`);
  const ipLimiter = createRateLimiter(20, 15 * 60 * 1000, (req) => `ip:${req.ip}`);
  const combinedLimiter = (req, res, next) => {
    loginLimiter(req, res, () => ipLimiter(req, res, next));
  };

  app.post('/api/auth/login', combinedLimiter, async (req, res) => {
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

    const metadata = { ip: req.ip, userAgent: req.get('User-Agent') };
    const session = await createUserSession(user, metadata);
    const csrfToken = generateCsrfToken();

    setAuthCookies(res, { accessToken: session.accessToken, refreshTokenJwt: session.refreshTokenJwt, sessionId: session.sessionId, csrfToken });

    res.json({
      success: true,
      user: { username: user.username, name: user.name, role: user.role, email: user.email, mustChangePassword: user.mustChangePassword },
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      csrfToken,
    });
  });

  app.post('/api/auth/token/refresh', async (req, res) => {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      return res.status(400).json({ error: 'Bad Request', message: 'Refresh token is required' });
    }

    const decodedResult = verifyToken(refreshToken);
    if (!decodedResult.valid || decodedResult.decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    const { jti, sub } = decodedResult.decoded;
    
    const stored = refreshTokens.get(jti);
    if (!stored) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Refresh token not found or revoked' });
    }

    if (stored.hash !== hashToken(refreshToken)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    if (revokedTokens.has(jti)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token has been revoked' });
    }

    const user = users.get(sub);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    await invalidateSession(jti, user.username);
    refreshTokens.delete(jti);

    const newSession = await createUserSession(user, { ip: req.ip, userAgent: req.get('User-Agent') });
    const csrfToken = generateCsrfToken();

    setAuthCookies(res, { accessToken: newSession.accessToken, refreshTokenJwt: newSession.refreshTokenJwt, sessionId: newSession.sessionId, csrfToken });

    res.json({ success: true, accessToken: newSession.accessToken, refreshToken: newSession.refreshToken, expiresIn: newSession.expiresIn, csrfToken });
  });

  app.post('/api/auth/logout', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (accessToken) {
      const validation = await validateAccessToken(accessToken);
      if (validation.valid && validation.decoded?.jti) {
        await invalidateSession(validation.decoded.jti, validation.decoded.sub);
      }
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.post('/api/auth/logout/all', async (req, res) => {
    const accessToken = getAccessToken(req);
    let currentTokenId = null;
    let username = null;
    if (accessToken) {
      const validation = await validateAccessToken(accessToken);
      if (validation.valid) {
        currentTokenId = validation.decoded.jti;
        username = validation.decoded.sub;
      }
    }
    if (username) {
      await invalidateAllUserSessions(username, currentTokenId);
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out from all devices' });
  });

  app.get('/api/auth/sessions', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const validation = await validateAccessToken(accessToken);
    if (!validation.valid) {
      return res.status(403).json({ error: 'Forbidden', message: validation.error || 'Invalid token' });
    }
    const sessions = userSessions.get(validation.decoded.sub) || [];
    const sanitizedSessions = sessions.map(s => ({
      sessionId: s.sessionId,
      tokenId: s.tokenId,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
      ip: s.ip,
      userAgent: s.userAgent,
      isCurrent: s.tokenId === validation.decoded.jti,
    }));
    res.json({ success: true, sessions: sanitizedSessions });
  });

  app.delete('/api/auth/sessions/:tokenId', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const validation = await validateAccessToken(accessToken);
    if (!validation.valid) {
      return res.status(403).json({ error: 'Forbidden', message: validation.error || 'Invalid token' });
    }
    const { tokenId } = req.params;
    if (tokenId === validation.decoded.jti) {
      return res.status(400).json({ error: 'Bad Request', message: 'Cannot revoke current session. Use logout instead.' });
    }
    await invalidateSession(tokenId, validation.decoded.sub);
    res.json({ success: true, message: 'Session revoked' });
  });

  app.delete('/api/auth/sessions', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const validation = await validateAccessToken(accessToken);
    if (!validation.valid) {
      return res.status(403).json({ error: 'Forbidden', message: validation.error || 'Invalid token' });
    }
    let currentTokenId = null;
    if (validation.valid) currentTokenId = validation.decoded.jti;
    await invalidateAllUserSessions(validation.decoded.sub, currentTokenId);
    clearAuthCookies(res);
    res.json({ success: true, message: 'All other sessions revoked' });
  });

  app.post('/api/auth/step-up', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const validation = await validateAccessToken(accessToken);
    if (!validation.valid) {
      return res.status(403).json({ error: 'Forbidden', message: validation.error || 'Invalid token' });
    }

    const { operation, password } = req.body;
    if (!operation || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Operation and password are required' });
    }

    const validOperations = ['delete_user', 'change_role', 'export_data', 'financial_approval', 'settings_change'];
    if (!validOperations.includes(operation)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid operation' });
    }

    const user = users.get(validation.decoded.sub);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid password' });
    }

    const stepUpTokenId = generateTokenId();
    const stepUpJwt = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: {
        sub: user.username,
        role: user.role,
        name: user.name,
        jti: stepUpTokenId,
        sid: validation.decoded.sid,
        type: 'step_up',
        operation,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      },
    };
    const encoded = Buffer.from(JSON.stringify(stepUpJwt.header)).toString('base64url') + '.' +
      Buffer.from(JSON.stringify(stepUpJwt.payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(encoded).digest('base64url');
    const stepUpToken = encoded + '.' + sig;

    res.json({ success: true, stepUpToken, expiresIn: 300, operation });
  });

  app.get('/api/protected', async (req, res) => {
    const accessToken = getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const validation = await validateAccessToken(accessToken);
    if (!validation.valid) {
      const status = validation.expired ? 401 : 403;
      return res.status(status).json({ 
        error: status === 401 ? 'Unauthorized' : 'Forbidden', 
        message: validation.error || 'Invalid token',
        code: validation.expired ? 'TOKEN_EXPIRED' : undefined
      });
    }
    res.json({ success: true, data: 'Protected data' });
  });

  return { 
    app, 
    users, 
    revokedTokens, 
    refreshTokens, 
    userSessions, 
    generateTokenId, 
    hashToken, 
    generateAccessToken, 
    generateRefreshToken, 
    verifyToken, 
    createUserSession, 
    validateAccessToken, 
    invalidateSession, 
    invalidateAllUserSessions,
    DEFAULT_MAX_SESSIONS_PER_USER
  };
}

test('Session creation - creates access and refresh tokens with proper structure', async () => {
  const { createUserSession, verifyToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  assert.ok(session.accessToken);
  assert.ok(session.refreshToken);
  assert.ok(session.tokenId);
  assert.ok(session.sessionId);
  assert.equal(session.expiresIn, 8 * 60 * 60);
  
  const decoded = verifyToken(session.accessToken);
  assert.ok(decoded.valid);
  assert.equal(decoded.decoded.type, 'access');
  assert.equal(decoded.decoded.sub, 'test');
});

test('Token rotation on refresh - old token revoked, new tokens issued', async () => {
  const { app, createUserSession, validateAccessToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const refreshResult = await request(app)
    .post('/api/auth/token/refresh')
    .set('Cookie', [`ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  assert.equal(refreshResult.status, 200);
  assert.ok(refreshResult.body.success);
  assert.ok(refreshResult.body.accessToken);
  assert.ok(refreshResult.body.refreshToken);
  
  const oldValidation = await validateAccessToken(session.accessToken);
  assert.equal(oldValidation.valid, false);
  assert.equal(oldValidation.error, 'Token has been revoked');
  
  const newValidation = await validateAccessToken(refreshResult.body.accessToken);
  assert.ok(newValidation.valid);
});

test('Session invalidation on logout', async () => {
  const { app, createUserSession, validateAccessToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const logoutResult = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  assert.equal(logoutResult.status, 200);
  
  const validation = await validateAccessToken(session.accessToken);
  assert.equal(validation.valid, false);
  assert.equal(validation.error, 'Token has been revoked');
});

test('Revoke all sessions except current', async () => {
  const { app, createUserSession, validateAccessToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  
  const session1 = await createUserSession(user);
  const session2 = await createUserSession(user);
  const session3 = await createUserSession(user);
  
  const logoutAllResult = await request(app)
    .post('/api/auth/logout/all')
    .set('Cookie', [`ratnaos_access=${session2.accessToken}`, `ratnaos_refresh=${session2.refreshTokenJwt}`]);
  
  assert.equal(logoutAllResult.status, 200);
  
  const v1 = await validateAccessToken(session1.accessToken);
  const v2 = await validateAccessToken(session2.accessToken);
  const v3 = await validateAccessToken(session3.accessToken);
  
  assert.equal(v1.valid, false);
  assert.ok(v2.valid);
  assert.equal(v3.valid, false);
});

test('Revoke specific session by tokenId', async () => {
  const { app, createUserSession, validateAccessToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  
  const session1 = await createUserSession(user);
  const session2 = await createUserSession(user);
  
  const revokeResult = await request(app)
    .delete('/api/auth/sessions/' + session1.tokenId)
    .set('Cookie', [`ratnaos_access=${session2.accessToken}`, `ratnaos_refresh=${session2.refreshTokenJwt}`]);
  
  assert.equal(revokeResult.status, 200);
  
  const v1 = await validateAccessToken(session1.accessToken);
  const v2 = await validateAccessToken(session2.accessToken);
  
  assert.equal(v1.valid, false);
  assert.ok(v2.valid);
});

test('Cannot revoke current session via DELETE', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const revokeResult = await request(app)
    .delete('/api/auth/sessions/' + session.tokenId)
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  assert.equal(revokeResult.status, 400);
  assert.equal(revokeResult.body.error, 'Bad Request');
});

test('Get user sessions returns sanitized session list', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  await createUserSession(user);
  await createUserSession(user);
  
  const loginResult = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testuser', password: 'password123' });
  
  const cookieHeader = loginResult.headers['set-cookie']?.[0];
  const cookies = cookieHeader ? cookieHeader.split(';')[0] : '';
  
  const sessionsResult = await request(app)
    .get('/api/auth/sessions')
    .set('Cookie', cookies);
  
  assert.equal(sessionsResult.status, 200);
  assert.ok(sessionsResult.body.success);
  assert.ok(Array.isArray(sessionsResult.body.sessions));
  assert.ok(sessionsResult.body.sessions.length >= 1);
  
  const session = sessionsResult.body.sessions[0];
  assert.ok(session.sessionId);
  assert.ok(session.tokenId);
  assert.ok(session.createdAt);
  assert.ok(session.lastActivity);
  assert.ok(typeof session.isCurrent === 'boolean');
});

test('Expired token returns 401 with TOKEN_EXPIRED code', async () => {
  const { app, generateAccessToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  
  const expiredToken = generateAccessToken(user, 'expired-token-id', 'expired-session-id');
  const payload = JSON.parse(Buffer.from(expiredToken.split('.')[1], 'base64url').toString());
  payload.exp = Math.floor(Date.now() / 1000) - 100;
  const newEncoded = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url') + '.' + 
    Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', 'test-secret').update(newEncoded).digest('base64url');
  const finalToken = newEncoded + '.' + sig;
  
  const result = await request(app)
    .get('/api/protected')
    .set('Cookie', [`ratnaos_access=${finalToken}`]);
  
  assert.equal(result.status, 401);
  assert.equal(result.body.code, 'TOKEN_EXPIRED');
});

test('Revoked token returns 403 with revoked error', async () => {
  const { app, createUserSession, revokedTokens } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  revokedTokens.set(session.tokenId, { userId: 'test', revokedAt: Date.now() });
  
  const result = await request(app)
    .get('/api/protected')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`]);
  
  assert.equal(result.status, 403);
  assert.equal(result.body.error, 'Forbidden');
});

test('Secure cookies set with HttpOnly, Secure, SameSite flags', async () => {
  const { app } = createTestApp();
  
  const result = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testuser', password: 'password123' });
  
  assert.equal(result.status, 200);
  const cookies = result.headers['set-cookie'];
  assert.ok(cookies);
  
  const accessCookie = cookies.find(c => c.startsWith('ratnaos_access='));
  const refreshCookie = cookies.find(c => c.startsWith('ratnaos_refresh='));
  const csrfCookie = cookies.find(c => c.startsWith('ratnaos_csrf='));
  
  assert.ok(accessCookie);
  assert.ok(refreshCookie);
  assert.ok(csrfCookie);
  
  assert.ok(accessCookie.includes('HttpOnly'));
  assert.ok(accessCookie.includes('Secure'));
  assert.ok(accessCookie.includes('SameSite=Lax'));
  
  assert.ok(refreshCookie.includes('HttpOnly'));
  assert.ok(refreshCookie.includes('Secure'));
  assert.ok(refreshCookie.includes('SameSite=Lax'));
  
  assert.ok(csrfCookie.includes('HttpOnly'));
  assert.ok(csrfCookie.includes('Secure'));
  assert.ok(csrfCookie.includes('SameSite=Strict'));
});

test('Login creates new session (session fixation protection)', async () => {
  const { app, createUserSession, userSessions } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  
  const oldSession = await createUserSession(user);
  
  const loginResult = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testuser', password: 'password123' });
  
  assert.equal(loginResult.status, 200);
  
  const cookies = loginResult.headers['set-cookie'];
  const newAccessCookie = cookies.find(c => c.startsWith('ratnaos_access='));
  assert.ok(newAccessCookie);
  
  const newToken = newAccessCookie.split(';')[0].split('=')[1];
  assert.notEqual(newToken, oldSession.accessToken);
});

test('Step-up authentication for sensitive operations', async () => {
  const { app, createUserSession, verifyToken } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const stepUpResult = await request(app)
    .post('/api/auth/step-up')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`])
    .send({ operation: 'delete_user', password: 'password123' });
  
  assert.equal(stepUpResult.status, 200);
  assert.ok(stepUpResult.body.success);
  assert.ok(stepUpResult.body.stepUpToken);
  assert.equal(stepUpResult.body.operation, 'delete_user');
  
  const stepUpValidation = verifyToken(stepUpResult.body.stepUpToken);
  assert.ok(stepUpValidation.valid);
  assert.equal(stepUpValidation.decoded.type, 'step_up');
  assert.equal(stepUpValidation.decoded.operation, 'delete_user');
});

test('Step-up fails with wrong password', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const stepUpResult = await request(app)
    .post('/api/auth/step-up')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`])
    .send({ operation: 'delete_user', password: 'wrongpassword' });
  
  assert.equal(stepUpResult.status, 401);
  assert.equal(stepUpResult.body.error, 'Unauthorized');
});

test('Invalid operation rejected for step-up', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const stepUpResult = await request(app)
    .post('/api/auth/step-up')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`])
    .send({ operation: 'invalid_operation', password: 'password123' });
  
  assert.equal(stepUpResult.status, 400);
  assert.equal(stepUpResult.body.error, 'Bad Request');
});

test('Concurrent session limit enforced', async () => {
  const { createUserSession, userSessions, DEFAULT_MAX_SESSIONS_PER_USER } = createTestApp();
  const user = { username: 'testuser', role: 'admin', name: 'Test' };
  
  for (let i = 0; i < DEFAULT_MAX_SESSIONS_PER_USER + 2; i++) {
    await createUserSession(user);
  }
  
  const sessions = userSessions.get('testuser');
  assert.ok(sessions.length <= DEFAULT_MAX_SESSIONS_PER_USER);
});

test('Rate limiting on auth endpoints', async () => {
  const { app } = createTestApp();
  
  for (let i = 0; i < 5; i++) {
    const result = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ratelimituser', password: 'wrong' });
    if (i < 4) assert.equal(result.status, 401);
  }
  
  const result = await request(app)
    .post('/api/auth/login')
    .send({ username: 'ratelimituser', password: 'wrong' });
  
  assert.equal(result.status, 429);
  assert.equal(result.body.error, 'Too Many Requests');
});

test('Refresh token rotation works only once per token', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const firstRefresh = await request(app)
    .post('/api/auth/token/refresh')
    .set('Cookie', [`ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  assert.equal(firstRefresh.status, 200);
  
  const secondRefresh = await request(app)
    .post('/api/auth/token/refresh')
    .set('Cookie', [`ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  assert.equal(secondRefresh.status, 401);
  assert.equal(secondRefresh.body.error, 'Unauthorized');
});

test('Logout clears all auth cookies', async () => {
  const { app, createUserSession } = createTestApp();
  const user = { username: 'test', role: 'admin', name: 'Test' };
  const session = await createUserSession(user);
  
  const logoutResult = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', [`ratnaos_access=${session.accessToken}`, `ratnaos_refresh=${session.refreshTokenJwt}`]);
  
  const cookies = logoutResult.headers['set-cookie'];
  assert.ok(cookies);
  
  for (const cookie of cookies) {
    assert.ok(cookie.includes('Max-Age=0'));
  }
});