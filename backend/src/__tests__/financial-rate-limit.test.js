import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

function createFinancialTestApp() {
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

  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    if (token.startsWith('admin-')) {
      req.user = { username: token.replace('-token', ''), role: 'admin' };
    } else if (token.startsWith('sales-')) {
      req.user = { username: token.replace('-token', ''), role: 'sales' };
    } else if (token.startsWith('viewer-')) {
      req.user = { username: token.replace('-token', ''), role: 'viewer' };
    } else if (token.startsWith('user')) {
      req.user = { username: token.replace('-token', ''), role: 'admin' };
    } else if (token.startsWith('newuser-')) {
      req.user = { username: token.replace('-token', ''), role: 'admin' };
    } else {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid token' });
    }
    next();
  };

  const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
    next();
  };

  app.post('/api/financial/transactions',
    authMiddleware,
    requireRole('admin', 'manager', 'accountant'),
    createLimiter(30, 60 * 1000, (req) => `fin_txn:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.status(201).json({ success: true, transaction: { id: 1, ...req.body } });
    }
  );

  app.get('/api/financial/transactions',
    authMiddleware,
    requireRole('admin', 'manager', 'accountant', 'viewer'),
    createLimiter(10, 60 * 1000, (req) => `fin_report:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.json({ success: true, transactions: [] });
    }
  );

  app.post('/api/financial/metal-operations',
    authMiddleware,
    requireRole('admin', 'manager', 'production'),
    createLimiter(20, 60 * 1000, (req) => `fin_metal:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.status(201).json({ success: true, operation: { id: 1, ...req.body } });
    }
  );

  app.post('/api/financial/sales',
    authMiddleware,
    requireRole('admin', 'manager', 'sales'),
    createLimiter(30, 60 * 1000, (req) => `fin_sale:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.status(201).json({ success: true, sale: { id: 1, ...req.body } });
    }
  );

  app.post('/api/financial/expenses',
    authMiddleware,
    requireRole('admin', 'manager', 'accountant'),
    createLimiter(20, 60 * 1000, (req) => `fin_expense:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.status(201).json({ success: true, expense: { id: 1, ...req.body } });
    }
  );

  app.get('/api/financial/reports/summary',
    authMiddleware,
    requireRole('admin', 'manager', 'accountant'),
    createLimiter(10, 60 * 1000, (req) => `fin_report:${req.user.username}`),
    createLimiter(100, 60 * 1000, (req) => `fin_ip:${req.ip}`),
    (req, res) => {
      res.json({ success: true, summary: {} });
    }
  );

  return { app, reset: () => requestCounts.clear() };
}

test('Financial transaction creation - allows requests under per-user limit', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 30; i++) {
    const res = await request(app)
      .post('/api/financial/transactions')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });
    assert.equal(res.status, 201);
  }
});

test('Financial transaction creation - blocks after per-user limit', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 30; i++) {
    await request(app)
      .post('/api/financial/transactions')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });
  }

  const res = await request(app)
    .post('/api/financial/transactions')
    .set('Authorization', 'Bearer admin-admin-token')
    .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });

  assert.equal(res.status, 429);
  assert.ok(res.body.retryAfter > 0);
});

test('Financial transaction creation - different users have independent limits', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 30; i++) {
    await request(app)
      .post('/api/financial/transactions')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });
  }

  const res = await request(app)
    .post('/api/financial/transactions')
    .set('Authorization', 'Bearer admin-manager-token')
    .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });

  assert.equal(res.status, 201);
});

test('Metal operations - rate limited per user', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 20; i++) {
    const res = await request(app)
      .post('/api/financial/metal-operations')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ type: 'purchase', metal: 'Gold', purity: '22K', weight: 10 });
    assert.equal(res.status, 201);
  }

  const res = await request(app)
    .post('/api/financial/metal-operations')
    .set('Authorization', 'Bearer admin-admin-token')
    .send({ type: 'purchase', metal: 'Gold', purity: '22K', weight: 10 });

  assert.equal(res.status, 429);
});

test('Sales creation - rate limited per user', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 30; i++) {
    const res = await request(app)
      .post('/api/financial/sales')
      .set('Authorization', 'Bearer sales-sales-token')
      .send({ customerName: 'Customer', items: [{ name: 'Item', price: 100 }], total: 100 });
    assert.equal(res.status, 201);
  }

  const res = await request(app)
    .post('/api/financial/sales')
    .set('Authorization', 'Bearer sales-sales-token')
    .send({ customerName: 'Customer', items: [{ name: 'Item', price: 100 }], total: 100 });

  assert.equal(res.status, 429);
});

test('Expense creation - rate limited per user', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 20; i++) {
    const res = await request(app)
      .post('/api/financial/expenses')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ category: 'Rent', amount: 1000, description: 'Office rent' });
    assert.equal(res.status, 201);
  }

  const res = await request(app)
    .post('/api/financial/expenses')
    .set('Authorization', 'Bearer admin-admin-token')
    .send({ category: 'Rent', amount: 1000, description: 'Office rent' });

  assert.equal(res.status, 429);
});

test('Reports - rate limited per user', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 10; i++) {
    const res = await request(app)
      .get('/api/financial/reports/summary')
      .set('Authorization', 'Bearer admin-admin-token');
    assert.equal(res.status, 200);
  }

  const res = await request(app)
    .get('/api/financial/reports/summary')
    .set('Authorization', 'Bearer admin-admin-token');

  assert.equal(res.status, 429);
});

test('Viewer role can access reports but not create transactions', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  const res1 = await request(app)
    .get('/api/financial/transactions')
    .set('Authorization', 'Bearer viewer-viewer-token');
  assert.equal(res1.status, 200);

  const res2 = await request(app)
    .post('/api/financial/transactions')
    .set('Authorization', 'Bearer viewer-viewer-token')
    .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });
  assert.equal(res2.status, 403);
});

test('Financial rate limit error does not expose sensitive data', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 30; i++) {
    await request(app)
      .post('/api/financial/transactions')
      .set('Authorization', 'Bearer admin-admin-token')
      .send({ type: 'income', amount: 1000000, description: 'Secret transaction', category: 'sales' });
  }

  const res = await request(app)
    .post('/api/financial/transactions')
    .set('Authorization', 'Bearer admin-admin-token')
    .send({ type: 'income', amount: 1000000, description: 'Secret transaction', category: 'sales' });

  assert.equal(res.status, 429);
  assert.equal(res.body.error, 'Too Many Requests');
  assert.ok(!res.body.message.includes('1000000'));
  assert.ok(!res.body.message.includes('Secret transaction'));
});

test('IP-based limit also applies to financial endpoints', async () => {
  const { app, reset } = createFinancialTestApp();
  reset();

  for (let i = 0; i < 100; i++) {
    const res = await request(app)
      .post('/api/financial/transactions')
      .set('Authorization', `Bearer admin-user${i}-token`)
      .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });
    if (i < 99) assert.equal(res.status, 201);
  }

  const res = await request(app)
    .post('/api/financial/transactions')
    .set('Authorization', 'Bearer admin-newuser-token')
    .send({ type: 'income', amount: 100, description: 'Test', category: 'sales' });

  assert.equal(res.status, 429);
});