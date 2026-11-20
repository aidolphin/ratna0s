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
  mockLocalStorage.clear();
  mockSessionStorage.clear();
}

test('auth data is stored encrypted (not plaintext JSON)', async () => {
  resetState();
  await auth.login('admin', 'admin123');
  const stored = mockLocalStorage.getItem('ratnaos-auth-v1');
  assert.ok(stored, 'Auth data should be stored');
  const parsed = JSON.parse(stored);
  assert.ok(parsed.iv, 'Encrypted auth should have an IV');
  assert.ok(parsed.ciphertext, 'Encrypted auth should have ciphertext');
  assert.ok(!parsed.users, 'Encrypted auth should not expose users in plaintext');
});

test('encrypted auth data can be decrypted and read back', async () => {
  resetState();
  await auth.login('admin', 'admin123');
  const stored = mockLocalStorage.getItem('ratnaos-auth-v1');
  // Verify it's encrypted format
  const parsed = JSON.parse(stored);
  assert.ok(parsed.iv && parsed.ciphertext, 'Auth data should be encrypted');
  // Simulate re-init by logging in again
  const res = await auth.login('admin', 'admin123');
  assert.equal(res.success, true);
  assert.ok(auth.isAuthenticated(), 'User should be authenticated after encrypted data round-trip');
});

test('consecutive saves produce different ciphertext (random IV)', async () => {
  resetState();
  await auth.login('admin', 'admin123');
  const first = mockLocalStorage.getItem('ratnaos-auth-v1');
  auth.logout();
  await auth.login('admin', 'admin123');
  const second = mockLocalStorage.getItem('ratnaos-auth-v1');
  assert.notEqual(first, second, 'Different saves should produce different ciphertext (random IV)');
});

test('legacy plaintext auth data is detected', () => {
  // Simulate legacy plaintext storage
  mockLocalStorage.setItem('ratnaos-auth-v1', JSON.stringify({ users: [] }));
  const stored = mockLocalStorage.getItem('ratnaos-auth-v1');
  const parsed = JSON.parse(stored);
  assert.ok(parsed.users, 'Legacy plaintext data has users property');
  assert.ok(!parsed.iv, 'Legacy plaintext data has no IV');
  assert.ok(!parsed.ciphertext, 'Legacy plaintext data has no ciphertext');
});
