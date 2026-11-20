import test from 'node:test';
import assert from 'node:assert/strict';
import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';

class MockStorage {
  constructor() { this.data = new Map(); }
  getItem(k) { return this.data.get(k) || null; }
  setItem(k, v) { this.data.set(k, String(v)); }
  removeItem(k) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

const mockDocument = {
  readyState: 'complete',
  getElementById: () => null,
  createElement: () => ({ style: {}, addEventListener: () => {}, appendChild: () => {}, setAttribute: () => {} }),
  addEventListener: () => {},
  body: { appendChild: () => {} },
  querySelector: () => null
};

const code = readFileSync(new URL('../reliability.js', import.meta.url).pathname, 'utf8');

const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: new MockStorage(),
  sessionStorage: new MockStorage(),
  crypto: globalThis.crypto,
  Blob: globalThis.Blob,
  btoa: globalThis.btoa,
  atob: globalThis.atob,
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
  console: globalThis.console,
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  setInterval: () => ({ ref: () => {}, unref: () => {} }),
  clearInterval: globalThis.clearInterval,
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  RatnaOS: undefined
};

const sandbox = {
  globalThis: globalThis,
  window: mockWindow,
  document: mockDocument,
  localStorage: new MockStorage(),
  sessionStorage: new MockStorage(),
  crypto: globalThis.crypto,
  Blob: globalThis.Blob,
  btoa: globalThis.btoa,
  atob: globalThis.atob,
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
  console: globalThis.console,
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  setInterval: () => ({ ref: () => {}, unref: () => {} }),
  clearInterval: globalThis.clearInterval,
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  module: { exports: {} },
  exports: {},
  require: (id) => {
    if (id === 'node:crypto') return globalThis.crypto;
    throw new Error(`Unknown module: ${id}`);
  }
};

const context = createContext(sandbox);
runInContext(code, context);

await new Promise(resolve => setTimeout(resolve, 200));

const { auth } = mockWindow.RatnaOS;

function resetState() {
  mockWindow.localStorage.clear();
  mockWindow.sessionStorage.clear();
}

test('rateLimitStatus returns zero attempts for unknown user', () => {
  resetState();
  const status = auth.rateLimitStatus('nonexistent');
  assert.equal(status.attempts, 0);
  assert.equal(status.maxAttempts, 5);
  assert.equal(status.lockedOut, false);
  assert.equal(status.remaining, 5);
});

test('failed login records attempt and increments count', async () => {
  resetState();
  const res1 = await auth.login('rateuser1', 'wrongpassword1');
  assert.equal(res1.success, false);
  const s1 = auth.rateLimitStatus('rateuser1');
  assert.equal(s1.attempts, 1);
  assert.equal(s1.lockedOut, false);
  assert.equal(s1.remaining, 4);

  const res2 = await auth.login('rateuser1', 'wrongpassword2');
  assert.equal(res2.success, false);
  const s2 = auth.rateLimitStatus('rateuser1');
  assert.equal(s2.attempts, 2);
});

test('account locks out after MAX_FAILED_ATTEMPTS (5)', async () => {
  resetState();
  for (let i = 0; i < 5; i++) {
    const res = await auth.login('rateuser2', 'wrongpassword');
    assert.equal(res.success, false);
  }
  const status = auth.rateLimitStatus('rateuser2');
  assert.equal(status.attempts, 5);
  assert.equal(status.lockedOut, true);
  assert.equal(status.remaining, 0);

  const blocked = await auth.login('rateuser2', 'anything');
  assert.equal(blocked.success, false);
  assert.equal(blocked.error, 'Account temporarily locked due to multiple failed login attempts. Try again later.');
});

test('successful login clears rate limit', async () => {
  resetState();
  for (let i = 0; i < 3; i++) {
    await auth.login('rateuser3', 'wrongpassword');
  }
  let status = auth.rateLimitStatus('rateuser3');
  assert.equal(status.attempts, 3);

  const res = await auth.login('admin', 'admin123');
  assert.equal(res.success, true);

  status = auth.rateLimitStatus('admin');
  assert.equal(status.attempts, 0);
  assert.equal(status.lockedOut, false);
});

test('clearRateLimit manually clears rate limit', async () => {
  resetState();
  for (let i = 0; i < 3; i++) {
    await auth.login('rateuser4', 'wrongpassword');
  }
  let status = auth.rateLimitStatus('rateuser4');
  assert.equal(status.attempts, 3);

  auth.clearRateLimit('rateuser4');
  status = auth.rateLimitStatus('rateuser4');
  assert.equal(status.attempts, 0);
  assert.equal(status.lockedOut, false);
});

test('user not found still records failed attempt', async () => {
  resetState();
  const res = await auth.login('nonexistentuser', 'password');
  assert.equal(res.success, false);
  const status = auth.rateLimitStatus('nonexistentuser');
  assert.equal(status.attempts, 1);
  assert.equal(status.lockedOut, false);
});

test('different users have independent rate limits', async () => {
  resetState();
  await auth.login('rateuser5', 'wrongpass1');
  await auth.login('rateuser5', 'wrongpass2');
  await auth.login('rateuser6', 'wrongpass3');

  const user5Status = auth.rateLimitStatus('rateuser5');
  const user6Status = auth.rateLimitStatus('rateuser6');
  assert.equal(user5Status.attempts, 2);
  assert.equal(user6Status.attempts, 1);
});

test('rateLimitStatus exposes maxAttempts and remaining fields', () => {
  resetState();
  const status = auth.rateLimitStatus('testuser');
  assert.ok('maxAttempts' in status);
  assert.ok('remaining' in status);
  assert.equal(status.maxAttempts, 5);
  assert.equal(status.remaining, 5);
});
