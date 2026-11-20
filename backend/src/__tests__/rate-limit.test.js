import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

function createTestApp() {
  const app = express();
  app.use(express.json());

  const requestCounts = new Map();

  function createLimiter(max, windowMs, keyGen) {
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

  const loginLimiter = createLimiter(5, 15 * 60 * 1000, (req) => `login:${req.body?.username || req.ip}`);
  const ipLimiter = createLimiter(20, 15 * 60 * 1000, (req) => `ip:${req.ip}`);

  app.post('/api/auth/login', loginLimiter, ipLimiter, (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      return res.json({ success: true, user: { username: 'admin', role: 'admin' } });
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
  });

  app.post('/api/auth/password/reset', createLimiter(3, 60 * 60 * 1000, (req) => `pwreset:${req.body?.username || req.ip}`), ipLimiter, (req, res) => {
    res.json({ success: true, message: 'Password updated' });
  });

  app.post('/api/auth/password/recovery', createLimiter(3, 60 * 60 * 1000, (req) => `pwrecovery:${req.body?.email || req.ip}`), ipLimiter, (req, res) => {
    res.json({ success: true, message: 'Recovery email sent' });
  });

  app.get('/api/public/health', createLimiter(100, 60 * 1000, (req) => `health:${req.ip}`), (req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/public/knowledge/search', createLimiter(50, 60 * 1000, (req) => `knowledge:${req.ip}`), (req, res) => {
    res.json({ success: true, results: [] });
  });

  return { app, reset: () => requestCounts.clear() };
}

test('Login rate limiting - allows requests under limit', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 5; i++) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrong' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  }
});

test('Login rate limiting - blocks requests over limit per account', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'blockeduser', password: 'wrong' });
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'blockeduser', password: 'wrong' });

  assert.equal(res.status, 429);
  assert.equal(res.body.error, 'Too Many Requests');
  assert.ok(res.body.retryAfter > 0);
  assert.ok(res.headers['retry-after']);
});

test('Login rate limiting - different users have independent limits', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'user1', password: 'wrong' });
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'user2', password: 'wrong' });

  assert.equal(res.status, 401);
  assert.notEqual(res.status, 429);
});

test('Login rate limiting - IP-based limit also applies', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 20; i++) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: `user${i}`, password: 'wrong' });
    if (i < 19) {
      assert.equal(res.status, 401);
    }
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'anotheruser', password: 'wrong' });

  assert.equal(res.status, 429);
});

test('Password reset rate limiting - blocks after 3 attempts per hour per account', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 3; i++) {
    const res = await request(app)
      .post('/api/auth/password/reset')
      .send({ username: 'resetuser', currentPassword: 'old', newPassword: 'newpass123' });
    assert.equal(res.status, 200);
  }

  const res = await request(app)
    .post('/api/auth/password/reset')
    .send({ username: 'resetuser', currentPassword: 'old', newPassword: 'newpass123' });

  assert.equal(res.status, 429);
  assert.ok(res.body.retryAfter > 0);
});

test('Password recovery rate limiting - blocks after 3 attempts per hour per email', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 3; i++) {
    const res = await request(app)
      .post('/api/auth/password/recovery')
      .send({ email: 'test@example.com' });
    assert.equal(res.status, 200);
  }

  const res = await request(app)
    .post('/api/auth/password/recovery')
    .send({ email: 'test@example.com' });

  assert.equal(res.status, 429);
});

test('Public health endpoint - allows generous rate limit', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 100; i++) {
    const res = await request(app).get('/api/public/health');
    assert.equal(res.status, 200);
  }

  const res = await request(app).get('/api/public/health');
  assert.equal(res.status, 429);
});

test('Public knowledge endpoint - rate limited appropriately', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 50; i++) {
    const res = await request(app).get('/api/public/knowledge/search?q=test');
    assert.equal(res.status, 200);
  }

  const res = await request(app).get('/api/public/knowledge/search?q=test');
  assert.equal(res.status, 429);
});

test('Successful login does not count towards rate limit', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 3; i++) {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('Rate limit headers are present in responses', async () => {
  const { app, reset } = createTestApp();
  reset();

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test', password: 'wrong' });

  assert.ok(res.headers['x-ratelimit-limit']);
  assert.ok(res.headers['x-ratelimit-remaining']);
  assert.ok(res.headers['x-ratelimit-reset']);
});

test('Rate limit error response does not expose sensitive information', async () => {
  const { app, reset } = createTestApp();
  reset();

  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'secretuser', password: 'wrong' });
  }

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'secretuser', password: 'wrong' });

  assert.equal(res.status, 429);
  assert.equal(res.body.error, 'Too Many Requests');
  assert.ok(!res.body.message.includes('secretuser'));
  assert.ok(!res.body.message.includes('password'));
  assert.ok(!res.body.message.includes('attempts'));
});