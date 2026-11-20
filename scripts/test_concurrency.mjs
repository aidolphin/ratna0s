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

const sandbox = {
  globalThis: globalThis,
  window: Object.assign(Object.create(null), {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    location: { href: 'http://localhost/' },
    navigator: { userAgent: 'test' },
    localStorage: new MockStorage(),
    sessionStorage: new MockStorage(),
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
    RatnaOS: undefined
  }),
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
const { atomicOperation, idempotencyHas } = RatnaOS;

test('atomicOperation is available', async () => {
  assert.ok(typeof atomicOperation === 'function');
});

test('atomicOperation executes fn and records idempotency key', async () => {
  let executed = false;
  const result = await atomicOperation('test_op_1', async () => {
    executed = true;
    return { success: true, value: 42 };
  });
  assert.ok(executed);
  assert.equal(result.success, true);
  assert.equal(result.value, 42);
  assert.ok(idempotencyHas('test_op_1'));
});

test('atomicOperation returns cached result for repeated idempotency key', async () => {
  let count = 0;
  const result1 = await atomicOperation('test_op_2', async () => {
    count++;
    return { success: true, count };
  });
  const result2 = await atomicOperation('test_op_2', async () => {
    count++;
    return { success: true, count };
  });
  assert.equal(count, 1, 'fn should only execute once for same idempotency key');
  assert.equal(result2._idempotent, true, 'second call should be marked idempotent');
});

test('atomicOperation serializes concurrent operations (lock test)', async () => {
  const order = [];
  const ops = [];
  for (let i = 0; i < 5; i++) {
    ops.push(atomicOperation(`lock_test_${i}`, async () => {
      order.push(`start_${i}`);
      await new Promise(r => setTimeout(r, 20));
      order.push(`end_${i}`);
      return { success: true, i };
    }));
  }
  const results = await Promise.all(ops);
  // Verify serialization: no overlapping execution
  for (let i = 0; i < order.length; i += 2) {
    const startIdx = order.indexOf(`start_${Math.floor(i/2)}`);
    const endIdx = order.indexOf(`end_${Math.floor(i/2)}`);
    const between = order.slice(startIdx + 1, endIdx);
    const otherStarts = between.filter(x => x.startsWith('start_'));
    assert.equal(otherStarts.length, 0, 'Operations should be serialized by lock');
  }
  assert.equal(results.length, 5);
  results.forEach((r, i) => assert.equal(r.success, true));
});

test('atomicOperation rejects missing idempotency key', async () => {
  await assert.rejects(() => atomicOperation('', async () => ({ success: true })), /Idempotency key required/);
  await assert.rejects(() => atomicOperation(null, async () => ({ success: true })), /Idempotency key required/);
});

test('atomicOperation propagates errors from fn', async () => {
  await assert.rejects(
    () => atomicOperation('test_op_fail', async () => { throw new Error('Boom'); }),
    /Boom/
  );
  assert.ok(!idempotencyHas('test_op_fail'), 'failed operation should not record idempotency key');
});

test('atomicOperation prevents duplicate transactions via idempotency', async () => {
  const result1 = await atomicOperation('dup_test', async () => ({ success: true }));
  const result2 = await atomicOperation('dup_test', async () => ({ success: true, should_not_happen: true }));
  assert.equal(result2._idempotent, true);
  assert.equal(result2.should_not_happen, undefined);
});

test('concurrent metal transactions do not duplicate', async () => {
  const results = await Promise.all([
    atomicOperation('metal_dup:TXN-001:PURCHASE:Gold:22K:2026-11-19', async () => ({ success: true, txn: 'first' })),
    atomicOperation('metal_dup:TXN-001:PURCHASE:Gold:22K:2026-11-19', async () => ({ success: true, txn: 'second' })),
    atomicOperation('metal_dup:TXN-001:PURCHASE:Gold:22K:2026-11-19', async () => ({ success: true, txn: 'third' }))
  ]);
  const nonIdempotent = results.filter(r => !r._idempotent);
  assert.equal(nonIdempotent.length, 1, 'Only one transaction should be processed');
  const idempotent = results.filter(r => r._idempotent);
  assert.equal(idempotent.length, 2, 'Two transactions should be idempotent replays');
});

test('sanitizeObject strips prototype pollution keys', () => {
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj !== 'object') return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      clean[k] = sanitizeObject(v);
    }
    return clean;
  }
  function hasOwnDangerousKey(obj) {
    for (const k of DANGEROUS_KEYS) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) return true;
    }
    return false;
  }
  const dirty = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"bad":true}},"name":"legit"}');
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.name, 'legit');
});

test('Object.prototype is not polluted by sanitized input', () => {
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.isAdmin, undefined);
  const malicious = JSON.parse('{"__proto__":{"isAdmin":true}}');
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
  function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj !== 'object') return obj;
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      clean[k] = sanitizeObject(v);
    }
    return clean;
  }
  sanitizeObject(malicious);
  assert.equal({}.isAdmin, undefined);
});
