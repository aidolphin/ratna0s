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
  // RatnaOS will be assigned here
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
  URLSearchParams: globalThis.URLSearchParams
};

const context = createContext(sandbox);
runInContext(code, context);

await new Promise(resolve => setTimeout(resolve, 200));

const { auth } = mockWindow.RatnaOS;

test('hashPassword creates a PBKDF2-SHA256 hash', async () => {
  const hash = await auth.hashPassword('testpassword123');
  assert.ok(hash.startsWith('pbkdf2:'));
  const parts = hash.split(':');
  assert.equal(parts.length, 4);
  assert.equal(parts[1], '100000');
  assert.ok(parts[2], 'salt present');
  assert.ok(parts[3], 'derived key present');
});

test('hashPassword produces different hashes for same password (random salt)', async () => {
  const h1 = await auth.hashPassword('samepassword');
  const h2 = await auth.hashPassword('samepassword');
  assert.notEqual(h1, h2, 'random salt should produce different hashes');
});

test('verifyPassword returns true for correct password', async () => {
  const hash = await auth.hashPassword('correctpassword');
  assert.ok(await auth.verifyPassword('correctpassword', hash));
});

test('verifyPassword returns false for incorrect password', async () => {
  const hash = await auth.hashPassword('correctpassword');
  assert.ok(!await auth.verifyPassword('wrongpassword', hash));
});

test('verifyPassword returns false for empty inputs', async () => {
  assert.ok(!await auth.verifyPassword('', 'somehash'));
  assert.ok(!await auth.verifyPassword('password', ''));
  assert.ok(!await auth.verifyPassword('', ''));
});

test('verifyPassword rejects malformed pbkdf2 hash', async () => {
  assert.ok(!await auth.verifyPassword('password', 'pbkdf2:bad'));
  assert.ok(!await auth.verifyPassword('password', 'pbkdf2:100000:invalidbase64!:hash'));
});

test('verifyPassword rejects unknown hash format', async () => {
  assert.ok(!await auth.verifyPassword('password', 'unknown:format:here'));
  assert.ok(!await auth.verifyPassword('password', 'plaintextpassword'));
});

test('legacy sha256 hash is verified correctly', async () => {
  const password = 'legacy123';
  const salt = 'ratnaos-salt-2024';
  const str = salt + password;
  let hashVal = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hashVal = ((hashVal << 5) - hashVal) + char;
    hashVal = hashVal & hashVal;
  }
  const legacyHash = 'sha256:' + Math.abs(hashVal).toString(16).padStart(8, '0') + ':' + btoa(str).slice(0, 16);

  assert.ok(await auth.verifyPassword(password, legacyHash));
  assert.ok(!await auth.verifyPassword('wrongpassword', legacyHash));
});

test('hashPassword rejects empty or missing password', async () => {
  await assert.rejects(() => auth.hashPassword(''), /Password is required/);
  await assert.rejects(() => auth.hashPassword(null), /Password is required/);
  await assert.rejects(() => auth.hashPassword(undefined), /Password is required/);
});

test('hashPassword output format is consistent', async () => {
  const hash = await auth.hashPassword('consistenttest');
  assert.match(hash, /^pbkdf2:\d+:[A-Za-z0-9+\/=]+:[A-Za-z0-9+\/=]+$/);
});

test('verifyPassword with wrong iteration count rejects', async () => {
  // Tamper with iteration count
  const hash = await auth.hashPassword('tampertest');
  const parts = hash.split(':');
  parts[1] = '1000'; // too low
  const tamperedHash = parts.join(':');
  assert.ok(!await auth.verifyPassword('tampertest', tamperedHash));
});

test('hashing twice then verifying both hashes works independently', async () => {
  const hash1 = await auth.hashPassword('multiuser');
  const hash2 = await auth.hashPassword('multiuser');
  assert.ok(await auth.verifyPassword('multiuser', hash1));
  assert.ok(await auth.verifyPassword('multiuser', hash2));
  assert.ok(!await auth.verifyPassword('multiuser', hash1 + 'x'));
});
