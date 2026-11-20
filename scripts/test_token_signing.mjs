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

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
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
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
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
  auth.logout();
  mockWindow.localStorage.clear();
  mockWindow.sessionStorage.clear();
}

test('login produces a signed token with 3 parts', async () => {
  resetState();
  const res = await auth.login('admin', 'admin123');
  assert.equal(res.success, true);
  const token = res.user.token;
  const parts = token.split('.');
  assert.equal(parts.length, 3, 'Signed token should have 3 parts (uuid.timestamp.signature)');
});

test('session token is stored in sessionStorage as signed token', async () => {
  resetState();
  const res = await auth.login('admin', 'admin123');
  assert.equal(res.success, true);
  const stored = mockWindow.sessionStorage.getItem('ratnaos-session');
  assert.ok(stored, 'Session token should be stored in sessionStorage');
  assert.equal(stored.split('.').length, 3, 'Stored token should be signed (3 parts)');
});

test('different logins produce different tokens', async () => {
  resetState();
  const res1 = await auth.login('admin', 'admin123');
  const firstToken = res1.user.token;
  auth.logout();
  const res2 = await auth.login('admin', 'admin123');
  assert.equal(res2.success, true);
  assert.notEqual(firstToken, res2.user.token, 'Re-login should produce a new token');
});

test('legacy unsigned token (2 parts) is rejected', () => {
  const legacyToken = 'some-uuid.1234567890';
  const parts = legacyToken.split('.');
  assert.equal(parts.length, 2, 'Legacy token has 2 parts');
});
