import test from 'node:test';
import assert from 'node:assert/strict';

// Prototype pollution guard - matches implementation in src.js and reliability.js
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

test('sanitizeObject strips __proto__ as own property', () => {
  const dirty = JSON.parse('{"__proto__":{"polluted":true},"name":"legit"}');
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.name, 'legit');
  assert.equal(Object.prototype.polluted, undefined);
});

test('sanitizeObject strips constructor as own property', () => {
  const dirty = JSON.parse('{"constructor":{"prototype":{"polluted":true}},"name":"legit"}');
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.name, 'legit');
});

test('sanitizeObject strips prototype as own property', () => {
  const dirty = JSON.parse('{"prototype":{"polluted":true},"name":"legit"}');
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.name, 'legit');
});

test('sanitizeObject removes all three dangerous keys as own properties', () => {
  const dirty = {__proto__: {x:1}, constructor: {y:2}, prototype: {z:3}, safe: 'value'};
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.safe, 'value');
});

test('sanitizeObject recursively strips dangerous keys in nested objects', () => {
  const dirty = {level1: {__proto__: {polluted: true}, safe: 'ok'}};
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean.level1), false);
  assert.equal(clean.level1.safe, 'ok');
});

test('sanitizeObject strips dangerous keys in array elements', () => {
  const dirty = [{__proto__: {x:1}, a:1}, {constructor: {y:2}, b:2}];
  const clean = sanitizeObject(dirty);
  assert.equal(hasOwnDangerousKey(clean[0]), false);
  assert.equal(clean[0].a, 1);
  assert.equal(hasOwnDangerousKey(clean[1]), false);
  assert.equal(clean[1].b, 2);
});

test('sanitizeObject preserves legitimate application data', () => {
  const legit = {
    id: 'item-1',
    name: 'Gold Ring',
    metalType: 'Gold',
    purity: '22K',
    weight: 10.5,
    nested: { category: 'jewellery', tags: ['gold', 'ring'] },
    arr: [{ sku: 'R-001' }, { sku: 'R-002' }]
  };
  const clean = sanitizeObject(legit);
  assert.deepEqual(clean, legit);
});

test('sanitizeObject handles null and undefined', () => {
  assert.equal(sanitizeObject(null), null);
  assert.equal(sanitizeObject(undefined), undefined);
});

test('sanitizeObject handles primitives', () => {
  assert.equal(sanitizeObject('string'), 'string');
  assert.equal(sanitizeObject(42), 42);
  assert.equal(sanitizeObject(true), true);
});

test('sanitizeObject handles empty object', () => {
  assert.deepEqual(sanitizeObject({}), {});
});

test('sanitizeObject handles object with only dangerous keys', () => {
  const dirty = {__proto__: {x:1}, constructor: {y:2}};
  const clean = sanitizeObject(dirty);
  assert.deepEqual(clean, {});
});

test('JSON.parse + sanitizeObject blocks prototype pollution via __proto__', () => {
  const malicious = JSON.parse('{"__proto__":{"isAdmin":true},"username":"attacker"}');
  const clean = sanitizeObject(malicious);
  // Verify prototype is not polluted globally
  assert.equal({}.isAdmin, undefined);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.username, 'attacker');
});

test('JSON.parse + sanitizeObject blocks prototype pollution via constructor', () => {
  const malicious = JSON.parse('{"constructor":{"prototype":{"isAdmin":true}}}');
  const clean = sanitizeObject(malicious);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal({}.isAdmin, undefined);
});

test('sanitizeObject does not mutate original object', () => {
  const original = {__proto__: {x:1}, safe: 'value'};
  const clean = sanitizeObject(original);
  assert.notEqual(clean, original);
  assert.equal(hasOwnDangerousKey(clean), false);
  assert.equal(clean.safe, 'value');
});

test('sanitizeObject prevents global Object.prototype pollution', () => {
  // Before: Object.prototype should not have polluted properties
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.isAdmin, undefined);

  // Sanitize a malicious object
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"isAdmin":true}}}');
  sanitizeObject(malicious);

  // After: prototype must still be clean
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(Object.prototype.isAdmin, undefined);
  assert.equal({}.polluted, undefined);
  assert.equal({}.isAdmin, undefined);
});
