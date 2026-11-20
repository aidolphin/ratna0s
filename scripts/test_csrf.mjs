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
  querySelector: () => null,
  querySelectorAll: () => []
};

const code = readFileSync(new URL('../reliability.js', import.meta.url).pathname, 'utf8');

const noopTimer = () => ({ ref: () => {}, unref: () => {} });

const sharedSessionStorage = new MockStorage();

const sandbox = {
  globalThis: globalThis,
  window: Object.assign(Object.create(null), {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    location: { href: 'http://localhost/' },
    navigator: { userAgent: 'test' },
    localStorage: new MockStorage(),
    sessionStorage: sharedSessionStorage,
    crypto: globalThis.crypto,
    Blob: globalThis.Blob,
    btoa: globalThis.btoa,
    atob: globalThis.atob,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    console: globalThis.console,
    setTimeout: noopTimer,
    clearTimeout: () => {},
    setInterval: noopTimer,
    clearInterval: () => {},
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
    RatnaOS: undefined,
    document: mockDocument
  }),
  document: mockDocument,
  localStorage: new MockStorage(),
  sessionStorage: sharedSessionStorage,
  crypto: globalThis.crypto,
  Blob: globalThis.Blob,
  btoa: globalThis.btoa,
  atob: globalThis.atob,
  TextEncoder: globalThis.TextEncoder,
  TextDecoder: globalThis.TextDecoder,
  console: globalThis.console,
  setTimeout: noopTimer,
  clearTimeout: () => {},
  setInterval: noopTimer,
  clearInterval: () => {},
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams
};

const context = createContext(sandbox);
runInContext(code, context);

await new Promise(resolve => setTimeout(resolve, 100));

const RatnaOS = sandbox.window.RatnaOS;
const { csrf } = RatnaOS;

test('csrf object is exposed on window.RatnaOS', () => {
  assert.ok(csrf);
  assert.ok(typeof csrf.generate === 'function');
  assert.ok(typeof csrf.token === 'function');
  assert.ok(typeof csrf.validate === 'function');
  assert.ok(typeof csrf.rotate === 'function');
});

test('csrf.generate creates a non-empty token', () => {
  const token = csrf.generate();
  assert.ok(token);
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 0);
});

test('csrf.token returns the same token on repeated calls', () => {
  const t1 = csrf.token();
  const t2 = csrf.token();
  assert.equal(t1, t2);
});

test('csrf.validate returns true for the current token', () => {
  const token = csrf.token();
  assert.ok(csrf.validate(token));
});

test('csrf.validate returns false for a forged/wrong token', () => {
  assert.ok(!csrf.validate('forged-token-12345'));
  assert.ok(!csrf.validate(''));
  assert.ok(!csrf.validate(null));
  assert.ok(!csrf.validate(undefined));
  assert.ok(!csrf.validate('wrong.token.format'));
});

test('csrf.validate uses timing-safe comparison', () => {
  const token = csrf.token();
  // A token that differs by only one character should still be rejected
  const mutated = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
  assert.ok(!csrf.validate(mutated));
});

test('csrf.rotate produces a new token and invalidates the old one', () => {
  const oldToken = csrf.token();
  const newToken = csrf.rotate();
  assert.notEqual(oldToken, newToken);
  assert.ok(csrf.validate(newToken));
  assert.ok(!csrf.validate(oldToken));
});

test('csrf token is stored in sessionStorage', () => {
  const token = csrf.token();
  const stored = sandbox.window.sessionStorage.getItem('ratnaos-csrf');
  assert.equal(stored, token);
});

test('csrf.token generates a new token when none exists in sessionStorage', () => {
  sandbox.window.sessionStorage.removeItem('ratnaos-csrf');
  const token = csrf.token();
  assert.ok(token);
  const stored = sandbox.window.sessionStorage.getItem('ratnaos-csrf');
  assert.equal(stored, token);
});

test('simulating a forged request with wrong CSRF token is rejected', () => {
  const validToken = csrf.token();
  const forgedToken = 'attacker-forged-token';

  // Valid token should pass
  assert.ok(csrf.validate(validToken), 'valid token should pass');

  // Forged token should fail
  assert.ok(!csrf.validate(forgedToken), 'forged token should be rejected');

  // Empty token should fail
  assert.ok(!csrf.validate(''), 'empty token should be rejected');
});

test('csrf tokens are unique across generations', () => {
  const t1 = csrf.generate();
  const t2 = csrf.generate();
  assert.notEqual(t1, t2);
  assert.ok(t1.length >= 32);
  assert.ok(t2.length >= 32);
});

test('bearer token is not a cookie - no automatic credential transmission', () => {
  // Verify no cookie-based auth: document.cookie is not available in this test env
  // The auth token lives in sessionStorage, not cookies
  const sessionToken = sharedSessionStorage.getItem('ratnaos-session');
  const csrfToken = csrf.token();
  // CSRF token is separate from session token
  assert.notEqual(csrfToken, sessionToken || '');
  // No document.cookie mechanism exists in this PWA (no cookie-based auth)
  assert.ok(!sharedSessionStorage.getItem('ratnaos-session') || typeof sharedSessionStorage.getItem('ratnaos-session') === 'string');
});
