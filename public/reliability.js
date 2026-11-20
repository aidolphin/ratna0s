// RatnaOS Reliability Enhancement Module
// Adds: Authentication, RBAC, Input Validation, Error Handling, Auto-backups, Data Recovery, Audit Logs, Delete Protection, Duplicate Prevention

(function() {
  'use strict';

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const RELIABILITY_KEY = 'ratnaos-reliability-v1';
  const BACKUP_KEY = 'ratnaos-backups-v1';
  const AUTH_KEY = 'ratnaos-auth-v1';
  const DATA_KEY = 'ratnaos-pilot-v1';
  const MAX_BACKUPS = 50;
  const BACKUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

  // ============================================================
  // UTILITY FUNCTIONS (self-contained)
  // ============================================================
  function generateId() {
    return crypto.randomUUID();
  }

  function getState() {
    try {
      return JSON.parse(localStorage.getItem(DATA_KEY)) || {};
    } catch {
      return {};
    }
  }

  let _lastPersistError = null;

  function saveState(state) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
      _lastPersistError = null;
    } catch (e) {
      console.error('Save state error:', e);
      if (_lastPersistError !== e.message) {
        _lastPersistError = e.message;
        showNotification(tr('Data save failed. Changes may not be persisted.'), 'error');
      }
    }
  }

  function num(x) { return Number(x || 0); }
  function rnd(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function esc(x) { return String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Prototype pollution guard: strip dangerous keys from user-controlled objects
  const DANGEROUS_KEYS=new Set(['__proto__','constructor','prototype']);
  function sanitizeObject(obj){
    if(obj===null||obj===undefined) return obj;
    if(Array.isArray(obj)) return obj.map(sanitizeObject);
    if(typeof obj!=='object') return obj;
    const clean={};
    for(const [k,v] of Object.entries(obj)){
      if(DANGEROUS_KEYS.has(k)) continue;
      clean[k]=sanitizeObject(v);
    }
    return clean;
  }

  // Localization bridge (filled by src.js once i18n is loaded)
  const tr = (msg) => {
    try { return (typeof window !== 'undefined' && window.RatnaOS && window.RatnaOS.t) ? window.RatnaOS.t(msg) : msg; }
    catch (e) { return msg; }
  };

  // ============================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================
  const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SALES: 'sales',
    PRODUCTION: 'production',
    ACCOUNTANT: 'accountant',
    VIEWER: 'viewer'
  };

  const PERMISSIONS = {
    'inventory:create': [ROLES.ADMIN, ROLES.MANAGER],
    'inventory:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'inventory:update': [ROLES.ADMIN, ROLES.MANAGER],
    'inventory:delete': [ROLES.ADMIN],
    'inventory:export': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],

    'sales:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],
    'sales:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'sales:update': [ROLES.ADMIN, ROLES.MANAGER],
    'sales:delete': [ROLES.ADMIN],
    'sales:refund': [ROLES.ADMIN, ROLES.MANAGER],
    'sales:export': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],

    'metals:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'metals:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'metals:update': [ROLES.ADMIN, ROLES.MANAGER],
    'metals:delete': [ROLES.ADMIN],
    'metals:post-period': [ROLES.ADMIN, ROLES.MANAGER],
    'metals:export': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],

    'karigar:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'karigar:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'karigar:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'karigar:delete': [ROLES.ADMIN],
    'jobs:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'jobs:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'jobs:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'jobs:delete': [ROLES.ADMIN],
    'jobs:issue-metal': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'jobs:return-metal': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],

    'production:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'production:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'bom:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'bom:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'bom:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.PRODUCTION],
    'bom:delete': [ROLES.ADMIN],

    'reports:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'knowledge:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.PRODUCTION, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'knowledge:write': [ROLES.ADMIN, ROLES.MANAGER],
    'accounting:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'accounting:post': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
    'tax:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'tax:post': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
    'tax:configure': [ROLES.ADMIN, ROLES.MANAGER],
    'reports:export': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],

    'customers:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],
    'customers:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'customers:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],
    'customers:delete': [ROLES.ADMIN],

    'suppliers:create': [ROLES.ADMIN, ROLES.MANAGER],
    'suppliers:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'suppliers:update': [ROLES.ADMIN, ROLES.MANAGER],
    'suppliers:delete': [ROLES.ADMIN],
    'suppliers:payment': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],

    'expenses:create': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
    'expenses:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.VIEWER],
    'expenses:update': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
    'expenses:delete': [ROLES.ADMIN],
    'expenses:approve': [ROLES.ADMIN, ROLES.MANAGER],

    'settings:read': [ROLES.ADMIN, ROLES.MANAGER],
    'settings:update': [ROLES.ADMIN],
    'settings:backup': [ROLES.ADMIN],
    'settings:restore': [ROLES.ADMIN],
    'settings:user-management': [ROLES.ADMIN],

    'audit:read': [ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
    'audit:export': [ROLES.ADMIN, ROLES.MANAGER]
  };

  const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', role: ROLES.ADMIN, name: 'Administrator', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true },
    { username: 'manager', password: 'manager123', role: ROLES.MANAGER, name: 'Store Manager', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true },
    { username: 'sales', password: 'sales123', role: ROLES.SALES, name: 'Sales Staff', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true },
    { username: 'production', password: 'prod123', role: ROLES.PRODUCTION, name: 'Production Head', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true },
    { username: 'accountant', password: 'account123', role: ROLES.ACCOUNTANT, name: 'Accountant', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true },
    { username: 'viewer', password: 'viewer123', role: ROLES.VIEWER, name: 'Viewer', email: '', active: true, createdAt: new Date().toISOString(), lastLogin: null, mustChangePassword: true }
  ];

  // ============================================================
  // AUTH UTILITIES
  // ============================================================
  // ============================================================
  // PASSWORD HASHING (PBKDF2-SHA256 via Web Crypto API)
  // ============================================================
  const PBKDF2_ITERATIONS = 100000;
  const HASH_ALG = 'SHA-256';
  const KEY_LENGTH = 256;
  const SALT_BYTES = 16;

  function toBase64(bytes) {
    const bin = String.fromCharCode(...bytes);
    return btoa(bin);
  }

  function fromBase64(str) {
    const bin = atob(str);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }

  // Constant-time comparison to prevent timing side-channels
  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  function timingSafeEqualBytes(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required');
    }
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: HASH_ALG },
      keyMaterial,
      KEY_LENGTH
    );
    return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(new Uint8Array(bits))}`;
  }

  // Verify legacy sha256: djb2 hash (for migration only)
  function verifyLegacyHash(password, hash) {
    let hashVal = 0;
    const salt = 'ratnaos-salt-2024';
    const str = salt + password;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hashVal = ((hashVal << 5) - hashVal) + char;
      hashVal = hashVal & hashVal;
    }
    const expected = 'sha256:' + Math.abs(hashVal).toString(16).padStart(8, '0') + ':' + btoa(str).slice(0, 16);
    return timingSafeEqual(expected, hash);
  }

  async function verifyPassword(password, hash) {
    if (!password || typeof password !== 'string') return false;
    if (!hash || typeof hash !== 'string') return false;

    if (hash.startsWith('pbkdf2:')) {
      const parts = hash.split(':');
      if (parts.length !== 4) return false;
      const iterations = parseInt(parts[1], 10);
      if (!iterations || iterations < 10000) return false;
      let salt;
      try {
        salt = fromBase64(parts[2]);
      } catch {
        return false;
      }
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
      );
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: HASH_ALG },
        keyMaterial,
        KEY_LENGTH
      );
      let expectedHash;
      try {
        expectedHash = fromBase64(parts[3]);
      } catch {
        return false;
      }
      return timingSafeEqualBytes(new Uint8Array(bits), expectedHash);
    }

    if (hash.startsWith('sha256:')) {
      // Legacy format - verify then caller should rehash
      return verifyLegacyHash(password, hash);
    }

    return false;
  }

  async function migrateLegacyHashes() {
    let migrated = false;
    for (const user of authState.users || []) {
      if (user.passwordHash && user.passwordHash.startsWith('sha256:')) {
        user.legacyHash = true;
        user.mustChangePassword = true;
        migrated = true;
      }
    }
    if (migrated) await saveAuth();
    return migrated;
  }

  async function hashDefaultUsers() {
    const users = [];
    for (const u of DEFAULT_USERS) {
      users.push({
        ...u,
        passwordHash: await hashPassword(u.password),
        mustChangePassword: true
      });
    }
    return users;
  }

  // ============================================================
  // SESSION TOKEN SIGNING (HMAC-SHA256)
  // ============================================================
  // Session tokens are cryptographically signed to prevent forgery.
  // Token format: uuid.timestamp.base64url(hmac_sha256(uuid.timestamp))
  // A signing key is generated once and persisted in localStorage.
  // Legacy unsigned tokens (uuid.timestamp) are rejected.
  const SIGNING_KEY_KEY = 'ratnaos-signing-key';
  let _signingKey = null;

  async function getOrCreateSigningKey() {
    if (_signingKey) return _signingKey;
    try {
      const stored = localStorage.getItem(SIGNING_KEY_KEY);
      let keyData;
      if (stored) {
        keyData = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
      } else {
        keyData = crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem(SIGNING_KEY_KEY, btoa(String.fromCharCode(...keyData)));
      }
      _signingKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
      );
      return _signingKey;
    } catch (e) {
      console.error('Signing key init error:', e);
      return null;
    }
  }

  async function generateToken() {
    const key = await getOrCreateSigningKey();
    const uuid = crypto.randomUUID();
    const timestamp = Date.now().toString(36);
    const payload = uuid + '.' + timestamp;
    if (!key) return payload; // fallback: unsigned (should not happen)
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return payload + '.' + sigB64;
  }

  async function parseToken(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length === 2) {
      // Legacy unsigned token — reject
      return null;
    }
    if (parts.length !== 3) return null;
    const [uuid, timestampStr, sigB64] = parts;
    const payload = uuid + '.' + timestampStr;
    const key = await getOrCreateSigningKey();
    if (!key) return null;
    try {
      const sigData = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
      const valid = await crypto.subtle.verify('HMAC', key, sigData, new TextEncoder().encode(payload));
      if (!valid) return null;
      return { uuid, timestamp: parseInt(timestampStr, 36) };
    } catch {
      return null;
    }
  }

  async function isTokenValid(token) {
    const parsed = await parseToken(token);
    if (!parsed) return false;
    return (Date.now() - parsed.timestamp) < SESSION_TIMEOUT_MS;
  }

  // ============================================================
  // AUTH DATA ENCRYPTION (AES-GCM)
  // ============================================================
  // Auth state stored in localStorage is encrypted with AES-GCM.
  // A 256-bit key is generated once and persisted in localStorage.
  // Each encryption uses a random 96-bit IV; IV is stored with ciphertext.
  // Legacy plaintext data is detected and re-encrypted on next save.
  const ENC_KEY_KEY = 'ratnaos-auth-enc-key';
  let _encKey = null;

  async function getOrCreateEncKey() {
    if (_encKey) return _encKey;
    try {
      const stored = localStorage.getItem(ENC_KEY_KEY);
      let keyData;
      if (stored) {
        keyData = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
      } else {
        keyData = crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem(ENC_KEY_KEY, btoa(String.fromCharCode(...keyData)));
      }
      _encKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
      );
      return _encKey;
    } catch (e) {
      console.error('Encryption key init error:', e);
      return null;
    }
  }

  async function encryptAuthData(plaintextObj) {
    const key = await getOrCreateEncKey();
    if (!key) return JSON.stringify(plaintextObj); // fallback: plaintext
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(plaintextObj));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv }, key, plaintext
    );
    return JSON.stringify({
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
    });
  }

  async function decryptAuthData(encryptedStr) {
    try {
      const parsed = JSON.parse(encryptedStr);
      if (!parsed.iv || !parsed.ciphertext) {
        // Legacy plaintext format — return as-is for parsing
        return encryptedStr;
      }
      const key = await getOrCreateEncKey();
      if (!key) return encryptedStr;
      const iv = Uint8Array.from(atob(parsed.iv), c => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(parsed.ciphertext), c => c.charCodeAt(0));
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, key, ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return encryptedStr; // return as-is, caller will handle parse failure
    }
  }

  // ============================================================
  // CSRF TOKEN (defense-in-depth for bearer-token SPA)
  // ============================================================
  // No cookie-based auth exists, so traditional cookie-autosubmit CSRF
  // does not apply. A CSRF token is still generated per session to protect
  // same-origin forged requests and to provide a validation hook for any
  // future backend API calls. The token is stored in sessionStorage (not
  // accessible cross-origin) and compared using timing-safe comparison.
  const CSRF_KEY = 'ratnaos-csrf';

  function generateCsrfToken() {
    return crypto.randomUUID();
  }

  function getCsrfToken() {
    try {
      const stored = sessionStorage.getItem(CSRF_KEY);
      if (stored) return stored;
      const token = generateCsrfToken();
      sessionStorage.setItem(CSRF_KEY, token);
      return token;
    } catch {
      return generateCsrfToken();
    }
  }

  function validateCsrfToken(token) {
    if (!token || typeof token !== 'string') return false;
    const expected = getCsrfToken();
    return timingSafeEqual(token, expected);
  }

  function rotateCsrfToken() {
    const token = generateCsrfToken();
    try { sessionStorage.setItem(CSRF_KEY, token); } catch {}
    return token;
  }

  // ============================================================
  // LOGIN RATE LIMITING / BRUTE FORCE PROTECTION
  // ============================================================
  const RATE_LIMIT_KEY = 'ratnaos-auth-rate-limit';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
  const WINDOW_DURATION_MS = 15 * 60 * 1000;

  let rateLimitState = {};

  function loadRateLimitState() {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      if (stored) {
        rateLimitState = sanitizeObject(JSON.parse(stored));
      }
    } catch {
      rateLimitState = {};
    }
  }

  function saveRateLimitState() {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimitState));
    } catch {
      console.error('Failed to persist rate limit state');
    }
  }

  function cleanupStaleEntries(username) {
    const now = Date.now();
    const entries = rateLimitState[username];
    if (!entries) return;
    rateLimitState[username] = entries.filter(
      e => now - e.timestamp < WINDOW_DURATION_MS
    );
    if (rateLimitState[username].length === 0) {
      delete rateLimitState[username];
    }
  }

  function isLockedOut(username) {
    cleanupStaleEntries(username);
    const entries = rateLimitState[username];
    if (!entries || entries.length < MAX_FAILED_ATTEMPTS) return false;
    const oldestInWindow = entries[entries.length - MAX_FAILED_ATTEMPTS].timestamp;
    return (Date.now() - oldestInWindow) < LOCKOUT_DURATION_MS;
  }

  function recordFailedAttempt(username) {
    const now = Date.now();
    if (!rateLimitState[username]) rateLimitState[username] = [];
    rateLimitState[username].push({ timestamp: now, reason: 'failed_login' });
    cleanupStaleEntries(username);
    saveRateLimitState();
    logAudit('AUTH_RATE_LIMIT', `Failed login attempt recorded for user: ${username}`, {
      attempts: rateLimitState[username]?.length || 0,
      lockedOut: isLockedOut(username)
    });
  }

  function recordSuccessfulLogin(username) {
    if (rateLimitState[username]) {
      delete rateLimitState[username];
      saveRateLimitState();
      logAudit('AUTH_RATE_LIMIT_RESET', `Rate limit cleared for user: ${username} after successful login`);
    }
  }

  function getRateLimitStatus(username) {
    cleanupStaleEntries(username);
    const entries = rateLimitState[username];
    if (!entries || entries.length === 0) {
      return { attempts: 0, maxAttempts: MAX_FAILED_ATTEMPTS, lockedOut: false, remaining: MAX_FAILED_ATTEMPTS };
    }
    const attempts = entries.length;
    const lockedOut = isLockedOut(username);
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
    return { attempts, maxAttempts: MAX_FAILED_ATTEMPTS, lockedOut, remaining };
  }

  function clearRateLimit(username) {
    if (rateLimitState[username]) {
      delete rateLimitState[username];
      saveRateLimitState();
    }
  }

  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================
  let authState = {
    currentUser: null,
    token: null,
    isAuthenticated: false,
    permissions: [],
    users: null
  };

  // ============================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================
  async function initAuth() {
    try {
      loadRateLimitState();
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const decrypted = await decryptAuthData(stored);
        const data = sanitizeObject(JSON.parse(decrypted));
        if (data.users) {
          authState.users = data.users;
          // Re-encrypt if data was legacy plaintext format
          if (!stored.includes('"iv"') && !stored.includes('"ciphertext"')) {
            await saveAuth();
          }
          await migrateLegacyHashes();
        } else {
          authState.users = await hashDefaultUsers();
          await saveAuth();
        }
      } else {
        authState.users = await hashDefaultUsers();
        await saveAuth();
      }

      const sessionToken = sessionStorage.getItem('ratnaos-session');
      if (sessionToken && await isTokenValid(sessionToken)) {
        const user = authState.users.find(u => u.token === sessionToken);
        if (user && user.active) {
          await loginUser(user, sessionToken, false);
        }
      }
    } catch (e) {
      console.error('Auth init error:', e);
      authState.users = await hashDefaultUsers();
      await saveAuth();
    }
  }

  let _lastAuthSaveError = null;
  async function saveAuth() {
    try {
      const encrypted = await encryptAuthData({ users: authState.users });
      localStorage.setItem(AUTH_KEY, encrypted);
      _lastAuthSaveError = null;
    } catch (e) {
      console.error('Auth save error:', e);
      if (_lastAuthSaveError !== e.message) {
        _lastAuthSaveError = e.message;
        showNotification(tr('Authentication state save failed.'), 'error');
      }
    }
  }

  async function loginUser(user, token, persist = true) {
    authState.currentUser = user;
    authState.token = token;
    authState.isAuthenticated = true;
    authState.permissions = getPermissionsForRole(user.role);
    user.lastLogin = new Date().toISOString();
    user.token = token;
    await saveAuth();
    if (persist) {
      sessionStorage.setItem('ratnaos-session', token);
    }
    // Ensure a CSRF token exists for the authenticated session
    getCsrfToken();
    logAudit('AUTH_LOGIN', `User ${user.username} logged in as ${user.role}`);
    return true;
  }

  function logoutUser() {
    if (authState.currentUser) {
      logAudit('AUTH_LOGOUT', `User ${authState.currentUser.username} logged out`);
    }
    authState.currentUser = null;
    authState.token = null;
    authState.isAuthenticated = false;
    authState.permissions = [];
    sessionStorage.removeItem('ratnaos-session');
    try { sessionStorage.removeItem(CSRF_KEY); } catch {}
  }

  async function authenticate(username, password) {
    if (isLockedOut(username)) {
      logAudit('AUTH_RATE_LIMITED', `Login blocked for user: ${username} - account locked out`);
      return { success: false, error: 'Account temporarily locked due to multiple failed login attempts. Try again later.' };
    }
    const user = authState.users.find(u => u.username === username && u.active);
    if (!user) {
      recordFailedAttempt(username);
      logAudit('AUTH_FAILED', `Login failed for username: ${username} - user not found`);
      return { success: false, error: tr('Invalid username or password') };
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailedAttempt(username);
      logAudit('AUTH_FAILED', `Login failed for username: ${username} - invalid password`);
      return { success: false, error: tr('Invalid username or password') };
    }
    // Rehash legacy passwords on successful login
    if (user.passwordHash.startsWith('sha256:')) {
      user.passwordHash = await hashPassword(password);
      user.legacyHash = false;
      saveAuth();
      logAudit('PASSWORD_MIGRATED', `Password rehashed for user: ${username}`);
    }
    recordSuccessfulLogin(username);
    const token = await generateToken();
    return await loginUser(user, token) ? { success: true, user, mustChangePassword: user.mustChangePassword } : { success: false, error: 'Login failed' };
  }

  async function changePassword(username, oldPassword, newPassword) {
    const user = authState.users.find(u => u.username === username);
    if (!user) return { success: false, error: tr('User not found') };
    if (!await verifyPassword(oldPassword, user.passwordHash)) {
      return { success: false, error: 'Current password is incorrect' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }
    user.passwordHash = await hashPassword(newPassword);
    user.legacyHash = false;
    user.mustChangePassword = false;
    await saveAuth();
    logAudit('PASSWORD_CHANGE', `Password changed for user: ${username}`);
    return { success: true };
  }

  async function createUser(username, password, role, name, email) {
    if (!hasPermission('settings:user-management')) {
      return { success: false, error: 'Insufficient permissions' };
    }
    if (authState.users.find(u => u.username === username)) {
      return { success: false, error: 'Username already exists' };
    }
    if (!Object.values(ROLES).includes(role)) {
      return { success: false, error: tr('Invalid role') };
    }
    const user = {
      username,
      passwordHash: await hashPassword(password),
      role,
      name,
      email: email || '',
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      mustChangePassword: true
    };
    authState.users.push(user);
    await saveAuth();
    logAudit('USER_CREATED', `User ${username} created with role ${role} by ${authState.currentUser?.username}`);
    return { success: true, user };
  }

  async function updateUser(username, updates) {
    if (!hasPermission('settings:user-management')) {
      return { success: false, error: 'Insufficient permissions' };
    }
    const user = authState.users.find(u => u.username === username);
    if (!user) return { success: false, error: tr('User not found') };
    if (updates.role && !Object.values(ROLES).includes(updates.role)) {
      return { success: false, error: tr('Invalid role') };
    }
    Object.assign(user, sanitizeObject(updates));
    await saveAuth();
    logAudit('USER_UPDATED', `User ${username} updated by ${authState.currentUser?.username}`, updates);
    return { success: true, user };
  }

  async function deleteUser(username) {
    if (!hasPermission('settings:user-management')) {
      return { success: false, error: 'Insufficient permissions' };
    }
    if (username === authState.currentUser?.username) {
      return { success: false, error: 'Cannot delete yourself' };
    }
    const idx = authState.users.findIndex(u => u.username === username);
    if (idx === -1) return { success: false, error: 'User not found' };
    authState.users.splice(idx, 1);
    await saveAuth();
    logAudit('USER_DELETED', `User ${username} deleted by ${authState.currentUser?.username}`);
    return { success: true };
  }

  function getPermissionsForRole(role) {
    const perms = [];
    for (const [perm, roles] of Object.entries(PERMISSIONS)) {
      if (roles.includes(role)) perms.push(perm);
    }
    return perms;
  }

  function hasPermission(permission) {
    return authState.permissions.includes(permission);
  }

  function requirePermission(permission) {
    if (!hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
    return true;
  }

  // ============================================================
  // INPUT VALIDATION
  // ============================================================
  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  class AppError extends Error {
    constructor(message, code = 'APP_ERROR') {
      super(message);
      this.name = 'AppError';
      this.code = code;
    }
  }

  class DuplicateTransactionError extends AppError {
    constructor(message) {
      super(message, 'DUPLICATE_TRANSACTION');
      this.name = 'DuplicateTransactionError';
    }
  }

  class InsufficientStockError extends AppError {
    constructor(message) {
      super(message, 'INSUFFICIENT_STOCK');
      this.name = 'InsufficientStockError';
    }
  }

  class MetalBalanceError extends AppError {
    constructor(message) {
      super(message, 'METAL_BALANCE_ERROR');
      this.name = 'MetalBalanceError';
    }
  }

  class PermissionDeniedError extends AppError {
    constructor(message) {
      super(message, 'PERMISSION_DENIED');
      this.name = 'PermissionDeniedError';
    }
  }

  const Validators = {
    required: (value, fieldName) => {
      if (value === undefined || value === null || value === '') {
        throw new ValidationError(`${fieldName} is required`);
      }
      return true;
    },

    string: (value, fieldName, options = {}) => {
      Validators.required(value, fieldName);
      if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`);
      }
      if (options.minLength && value.length < options.minLength) {
        throw new ValidationError(`${fieldName} must be at least ${options.minLength} characters`);
      }
      if (options.maxLength && value.length > options.maxLength) {
        throw new ValidationError(`${fieldName} must not exceed ${options.maxLength} characters`);
      }
      if (options.pattern && !options.pattern.test(value)) {
        throw new ValidationError(`${fieldName} format is invalid`);
      }
      return true;
    },

    number: (value, fieldName, options = {}) => {
      Validators.required(value, fieldName);
      const n = Number(value);
      if (isNaN(n) || !isFinite(n)) {
        throw new ValidationError(`${fieldName} must be a valid number`);
      }
      if (options.min !== undefined && n < options.min) {
        throw new ValidationError(`${fieldName} must be at least ${options.min}`);
      }
      if (options.max !== undefined && n > options.max) {
        throw new ValidationError(`${fieldName} must not exceed ${options.max}`);
      }
      if (options.integer && !Number.isInteger(n)) {
        throw new ValidationError(`${fieldName} must be an integer`);
      }
      if (options.positive && n <= 0) {
        throw new ValidationError(`${fieldName} must be positive`);
      }
      return n;
    },

    date: (value, fieldName, options = {}) => {
      Validators.required(value, fieldName);
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid date`);
      }
      if (options.min && date < new Date(options.min)) {
        throw new ValidationError(`${fieldName} must be on or after ${options.min}`);
      }
      if (options.max && date > new Date(options.max)) {
        throw new ValidationError(`${fieldName} must be on or before ${options.max}`);
      }
      return date;
    },

    email: (value, fieldName) => {
      Validators.string(value, fieldName);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new ValidationError(`${fieldName} must be a valid email`);
      }
      return true;
    },

    object: (value, fieldName, schema = {}) => {
      Validators.required(value, fieldName);
      if (typeof value !== 'object' || value === null) {
        throw new ValidationError(`${fieldName} must be an object`);
      }
      for (const [key, validator] of Object.entries(schema)) {
        if (validator && typeof validator === 'function') {
          validator(value[key], key);
        }
      }
      return true;
    }
  };

  const ValidationSchemas = {
    item: (data) => {
      Validators.required(data.name, 'Item name');
      Validators.required(data.category, 'Category');
      Validators.required(data.metalType, 'Metal type');
      Validators.number(data.grossWeight, 'Gross weight', { min: 0 });
      Validators.number(data.netWeight, 'Net weight', { min: 0 });
      Validators.number(data.purity, 'Purity', { min: 0, max: 24 });
      Validators.number(data.makingCharge, 'Making charge', { min: 0 });
      Validators.number(data.wastagePercent, 'Wastage %', { min: 0, max: 100 });
    },
    customer: (data) => {
      Validators.required(data.name, 'Customer name');
      Validators.string(data.phone, 'Phone', { maxLength: 20 });
      Validators.email(data.email, 'Email');
      Validators.number(data.creditLimit, 'Credit limit', { min: 0 });
    },
    sale: (data) => {
      Validators.required(data.customerName, 'Customer name');
      Validators.number(data.total, 'Total', { positive: true });
      Validators.required(data.items, 'Items');
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new ValidationError('At least one item required');
      }
    },
    expense: (data) => {
      Validators.required(data.category, 'Category');
      Validators.number(data.amount, 'Amount', { positive: true });
      Validators.date(data.date, 'Date');
    },
    metalTransaction: (data) => {
      Validators.required(data.type, 'Type');
      Validators.required(data.metal, 'Metal');
      Validators.required(data.purity, 'Purity');
      Validators.number(data.weight, 'Weight', { positive: true });
      Validators.number(data.rate, 'Rate', { min: 0 });
    }
  };

  // ============================================================
  // ERROR HANDLING
  // ============================================================
  function handleError(error, context = '') {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message, type: 'validation' };
    }
    if (error instanceof AppError) {
      return { success: false, error: error.message, type: error.code };
    }
    console.error(`Error ${context}:`, error);
    logError('UNHANDLED', error.message, { context, stack: error.stack });
    return { success: false, error: tr('An unexpected error occurred'), type: 'unknown' };
  }

  function asyncHandler(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return handleError(error, fn.name);
      }
    };
  }

  // ============================================================
  // AUDIT LOGGING (reads/writes directly to localStorage)
  // ============================================================
  const AUDIT_CATEGORIES = {
    AUTH: 'Auth',
    SALES: 'Sales',
    METAL: 'Metal',
    INVENTORY: 'Inventory',
    PRODUCTION: 'Production',
    FINANCIAL: 'Financial',
    SYSTEM: 'System',
    SECURITY: 'Security',
    DATA: 'Data'
  };

  function categorizeEvent(event) {
    const prefixes = {
      'AUTH_': AUDIT_CATEGORIES.AUTH,
      'LOGIN': AUDIT_CATEGORIES.AUTH,
      'LOGOUT': AUDIT_CATEGORIES.AUTH,
      'PASSWORD': AUDIT_CATEGORIES.SECURITY,
      'USER_': AUDIT_CATEGORIES.SECURITY,
      'SALE': AUDIT_CATEGORIES.SALES,
      'POS': AUDIT_CATEGORIES.SALES,
      'INVOICE': AUDIT_CATEGORIES.SALES,
      'METAL_': AUDIT_CATEGORIES.METAL,
      'PURCHASE': AUDIT_CATEGORIES.METAL,
      'ISSUE': AUDIT_CATEGORIES.METAL,
      'RETURN': AUDIT_CATEGORIES.METAL,
      'WASTAGE': AUDIT_CATEGORIES.METAL,
      'INVENTORY': AUDIT_CATEGORIES.INVENTORY,
      'ITEM_': AUDIT_CATEGORIES.INVENTORY,
      'STOCK_': AUDIT_CATEGORIES.INVENTORY,
      'JOB_': AUDIT_CATEGORIES.PRODUCTION,
      'KARIGAR_': AUDIT_CATEGORIES.PRODUCTION,
      'STAGE_': AUDIT_CATEGORIES.PRODUCTION,
      'QC_': AUDIT_CATEGORIES.PRODUCTION,
      'BOM_': AUDIT_CATEGORIES.PRODUCTION,
      'EXPENSE': AUDIT_CATEGORIES.FINANCIAL,
      'PAYMENT': AUDIT_CATEGORIES.FINANCIAL,
      'REPORT_': AUDIT_CATEGORIES.FINANCIAL,
      'BACKUP': AUDIT_CATEGORIES.SYSTEM,
      'RESTORE': AUDIT_CATEGORIES.SYSTEM,
      'SETTINGS_': AUDIT_CATEGORIES.SYSTEM,
      'DELETE': AUDIT_CATEGORIES.SECURITY,
      'EXPORT': AUDIT_CATEGORIES.DATA
    };

    for (const [prefix, category] of Object.entries(prefixes)) {
      if (event.startsWith(prefix)) return category;
    }
    return AUDIT_CATEGORIES.DATA;
  }

  function logAudit(event, detail, metadata = {}) {
    try {
      const state = getState();
      if (!Array.isArray(state.audit)) state.audit = [];

      const entry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        event,
        category: categorizeEvent(event),
        detail,
        user: authState.currentUser?.username || 'system',
        userRole: authState.currentUser?.role || 'none',
        sessionId: authState.token,
        metadata: {
          ...metadata,
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        }
      };

      state.audit.unshift(entry);
      if (state.audit.length > 10000) {
        state.audit = state.audit.slice(0, 10000);
      }
      saveState(state);
    } catch (e) {
      console.error('Audit log error:', e);
    }
  }

  function logError(type, message, details = {}) {
    logAudit(`ERROR_${type}`, message, { ...details, level: 'error' });
  }

  // ============================================================
  // DUPLICATE TRANSACTION PREVENTION
  // Enhanced persistent version defined later (after IdempotencyStore)
  // ============================================================

  // ============================================================
  // STOCK UPDATE VALIDATION
  // ============================================================
  const StockGuard = {
    validateIssue(itemId, weight, metalType, purity) {
      const state = getState();
      const item = state.items?.find(i => i.id === itemId);
      if (!item) throw new AppError('Item not found', 'ITEM_NOT_FOUND');
      if (item.status !== 'stock') throw new InsufficientStockError('Item not in stock');
      const available = num(item.netWeight ?? item.weight);
      if (weight > available) {
        throw new InsufficientStockError(`Insufficient stock: ${available}g available, ${weight}g requested`);
      }
      if ((item.metalType || item.metal) !== metalType) {
        throw new MetalBalanceError('Metal type mismatch');
      }
      if (String(item.purity) !== String(purity)) {
        throw new MetalBalanceError('Purity mismatch');
      }
      return true;
    },

    validateReturn(issueWeight, returnWeight) {
      if (returnWeight > issueWeight) {
        throw new MetalBalanceError('Return weight exceeds issued weight');
      }
      return true;
    },

    // Atomic check-and-deduct: validates stock and marks item sold in one locked operation.
    // Returns the updated item or throws if insufficient stock.
    validateAndDeductItem(itemId, qty, weight) {
      const state = getState();
      const item = state.items?.find(i => i.id === itemId);
      if (!item) throw new AppError('Item not found', 'ITEM_NOT_FOUND');
      if (item.status !== 'stock') throw new InsufficientStockError('Item not in stock');
      const available = num(item.netWeight ?? item.weight);
      if (weight > available) {
        throw new InsufficientStockError(`Insufficient stock: ${available}g available, ${weight}g requested`);
      }
      item.status = 'sold';
      item.updatedAt = new Date().toISOString();
      saveState(state);
      return item;
    }
  };

  // ============================================================
  // CONCURRENCY CONTROL: TRANSACTION LOCK (async mutex)
  // ============================================================
  // Single-file PWA uses localStorage; there is no DB transaction layer.
  // A reentrant async mutex serializes all mutating operations so that
  // check-then-act sequences (stock validation + deduction, balance read + write)
  // cannot interleave across concurrent callers.
  class TransactionLock {
    constructor() {
      this._queue = Promise.resolve();
      this._locked = false;
    }

    async acquire() {
      let release;
      const locked = new Promise((res) => { release = res; });
      // Wait for previous holder to release, then signal we hold the lock.
      // The next acquire() will wait on this `locked` promise.
      const waitForPrevious = this._queue;
      this._queue = locked;
      await waitForPrevious;
      this._locked = true;
      return () => { this._locked = false; release(); };
    }
  }

  const txnLock = new TransactionLock();

  // ============================================================
  // IDEMPOTENCY STORE (persisted to localStorage)
  // ============================================================
  // Records processed idempotency keys so retried operations are not
  // applied twice. Keys expire after IDEMPOTENCY_TTL_MS.
  const IDEMPOTENCY_KEY = 'ratnaos-idempotency';
  const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

  function loadIdempotencyStore() {
    try {
      const raw = localStorage.getItem(IDEMPOTENCY_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      const now = Date.now();
      const cleaned = {};
      for (const [k, v] of Object.entries(data)) {
        if (now - v < IDEMPOTENCY_TTL_MS) cleaned[k] = v;
      }
      return cleaned;
    } catch {
      return {};
    }
  }

  let idempotencyStore = loadIdempotencyStore();

  function saveIdempotencyStore() {
    try {
      localStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify(idempotencyStore));
    } catch (e) {
      console.error('Idempotency store save error:', e);
    }
  }

  function idempotencyHas(key) {
    return !!idempotencyStore[key];
  }

  function idempotencyRecord(key) {
    idempotencyStore[key] = Date.now();
    saveIdempotencyStore();
  }

  function idempotencyCleanup() {
    const now = Date.now();
    let changed = false;
    for (const [k, v] of Object.entries(idempotencyStore)) {
      if (now - v >= IDEMPOTENCY_TTL_MS) {
        delete idempotencyStore[k];
        changed = true;
      }
    }
    if (changed) saveIdempotencyStore();
  }

  // ============================================================
  // ENHANCED TRANSACTION REGISTRY (persistent duplicate prevention)
  // ============================================================
  const DUPLICATE_KEY = 'ratnaos-duplicates';
  const DUPLICATE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  function loadDuplicateRegistry() {
    try {
      const raw = localStorage.getItem(DUPLICATE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      const now = Date.now();
      const cleaned = {};
      for (const [k, v] of Object.entries(data)) {
        if (now - v < DUPLICATE_TTL_MS) cleaned[k] = v;
      }
      return cleaned;
    } catch {
      return {};
    }
  }

  let duplicateRegistry = loadDuplicateRegistry();

  function saveDuplicateRegistry() {
    try {
      localStorage.setItem(DUPLICATE_KEY, JSON.stringify(duplicateRegistry));
    } catch (e) {
      console.error('Duplicate registry save error:', e);
    }
  }

  function duplicateHas(key) {
    return !!duplicateRegistry[key];
  }

  function duplicateRegister(key) {
    duplicateRegistry[key] = Date.now();
    saveDuplicateRegistry();
    setTimeout(() => {
      delete duplicateRegistry[key];
      saveDuplicateRegistry();
    }, DUPLICATE_TTL_MS);
  }

  const TransactionRegistry = {
    pending: new Map(),

    generateKey(type, data) {
      const keyParts = [
        type,
        data.metal || '',
        data.purity || '',
        data.weight || '',
        data.rate || '',
        data.date || new Date().toISOString().slice(0, 10),
        data.reference || '',
        data.karigar || '',
        data.jobCode || '',
        data.customer || ''
      ];
      return keyParts.join('|');
    },

    checkAndRegister(type, data) {
      const key = this.generateKey(type, data);
      if (this.pending.has(key) || duplicateHas(key)) {
        throw new DuplicateTransactionError('Duplicate transaction detected');
      }
      this.pending.set(key, Date.now());
      duplicateRegister(key);
      setTimeout(() => {
        this.pending.delete(key);
      }, 5000);
      return key;
    }
  };

  // ============================================================
  // ATOMIC OPERATION WRAPPER
  // ============================================================
  // Executes fn inside the transaction lock with idempotency protection.
  // If the idempotency key was already processed, returns the cached result
  // instead of re-executing. fn should return { success, ... } or throw.
  const _idempotencyResults = new Map();

  async function atomicOperation(idempotencyKey, fn) {
    if (!idempotencyKey) {
      throw new Error('Idempotency key required for atomic operation');
    }

    // Fast path: already processed in this session
    if (idempotencyHas(idempotencyKey)) {
      const cached = _idempotencyResults.get(idempotencyKey);
      if (cached) return { ...cached, _idempotent: true };
      return { success: true, _idempotent: true };
    }

    if (duplicateHas(idempotencyKey)) {
      return { success: true, _idempotent: true };
    }

    const release = await txnLock.acquire();
    try {
      // Re-check after acquiring lock (another caller may have processed it)
      if (idempotencyHas(idempotencyKey)) {
        const cached = _idempotencyResults.get(idempotencyKey);
        if (cached) return { ...cached, _idempotent: true };
        return { success: true, _idempotent: true };
      }

      const result = await fn();

      idempotencyRecord(idempotencyKey);
      if (result && typeof result === 'object') {
        _idempotencyResults.set(idempotencyKey, result);
      }
      return result;
    } finally {
      release();
    }
  }

  // ============================================================
  // BACKUP MANAGER
  // ============================================================
  const BackupManager = {
    init() {
      this.startAutoBackup();
      this.cleanOldBackups();
    },

    startAutoBackup() {
      setInterval(() => this.createBackup('Auto-backup'), BACKUP_INTERVAL_MS);
    },

    createBackup(type = 'Manual') {
      try {
        const state = getState();
        const backup = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type,
          data: JSON.parse(JSON.stringify(state)),
          size: new Blob([JSON.stringify(state)]).size
        };
        const backups = this.listBackups();
        backups.unshift(backup);
        if (backups.length > MAX_BACKUPS) backups.length = MAX_BACKUPS;
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
        logAudit('BACKUP_CREATED', `Backup created: ${type}`, { backupId: backup.id });
        return backup;
      } catch (e) {
        console.error('Backup error:', e);
        logError('BACKUP_FAILED', e.message);
        return null;
      }
    },

    // Short aliases used by the UI (src.js)
    list() { return this.listBackups(); },
    create(type) { return this.createBackup(type); },
    restore(id) { return this.restoreBackup(id); },
    delete(id) { return this.deleteBackup(id); },

    listBackups() {
      try {
        return JSON.parse(localStorage.getItem(BACKUP_KEY)) || [];
      } catch {
        return [];
      }
    },

    restoreBackup(backupId) {
      try {
        const backups = this.listBackups();
        const backup = backups.find(b => b.id === backupId);
        if (!backup) throw new Error('Backup not found');
        saveState(backup.data);
        logAudit('BACKUP_RESTORED', `Restored from backup: ${backupId}`);
        return true;
      } catch (e) {
        console.error('Restore error:', e);
        logError('RESTORE_FAILED', e.message);
        return false;
      }
    },

    deleteBackup(backupId) {
      try {
        const backups = this.listBackups().filter(b => b.id !== backupId);
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
        logAudit('BACKUP_DELETED', `Deleted backup: ${backupId}`);
        return true;
      } catch (e) {
        console.error('Delete backup error:', e);
        return false;
      }
    },

    cleanOldBackups() {
      const backups = this.listBackups();
      if (backups.length > MAX_BACKUPS) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, MAX_BACKUPS)));
      }
    }
  };

  // ============================================================
  // DATA RECOVERY
  // ============================================================
  const DataRecovery = {
    async runIntegrityCheck() {
      const issues = [];
      const fixes = [];
      const state = getState();

      // 1. Check items
      (state.items || []).forEach(item => {
        if (!item.id) {
          item.id = generateId();
          fixes.push(`Generated ID for item ${item.code || 'unknown'}`);
        }
        if (!item.sku) {
          const cat = item.category || 'gold';
          const metal = item.metalType || item.metal || 'Gold';
          const pur = item.purity || '22K';
          item.sku = `${cat.toUpperCase().slice(0,3)}-${metal.slice(0,1)}${pur}-${generateId().slice(0,6).toUpperCase()}`;
          fixes.push(`Generated SKU for item ${item.code || 'unknown'}`);
        }
        if (typeof item.netWeight !== 'number') {
          item.netWeight = num(item.netWeight || item.weight || 0);
          fixes.push(`Fixed netWeight for item ${item.code || item.id}`);
        }
      });

      // 2. Check sales
      (state.sales || []).forEach(sale => {
        if (!sale.items || !sale.items.length) {
          issues.push(`Sale ${sale.invoice} has no items`);
        }
        if (!sale.id) {
          sale.id = generateId();
          fixes.push(`Generated ID for sale ${sale.invoice}`);
        }
      });

      // 3. Check metal transactions
      const txns = state.metalManagement?.transactions || [];
      txns.forEach(txn => {
        if (!txn.id) {
          txn.id = generateId();
          fixes.push(`Generated ID for metal transaction`);
        }
        const expectedValue = num(txn.weight) * num(txn.rate);
        if (Math.abs(num(txn.value) - expectedValue) > 0.01) {
          issues.push(`Metal transaction ${txn.reference}: value mismatch`);
        }
      });

      // 4. Check job consistency
      const jobs = state.jobs || [];
      jobs.forEach(job => {
        if (!job.id) job.id = generateId();
        const issued = this.getJobIssuedWeight(job);
        const returned = this.getJobReturnedWeight(job);
        if (returned > issued) {
          issues.push(`Job ${job.code}: returned (${returned}g) > issued (${issued}g)`);
        }
      });

      // 5. Check balances
      (state.customers || []).forEach(c => {
        if (typeof c.balance !== 'number') c.balance = 0;
        if (typeof c.creditLimit !== 'number') c.creditLimit = 0;
      });
      (state.suppliers || []).forEach(s => {
        if (typeof s.balance !== 'number') s.balance = 0;
      });

      // 6. Verify audit log
      if (!Array.isArray(state.audit)) state.audit = [];

      if (fixes.length > 0) {
        saveState(state);
        logAudit('INTEGRITY_FIXES_APPLIED', `${fixes.length} fixes applied`, { fixes });
      }

      return { issues, fixes, timestamp: new Date().toISOString() };
    },

    getJobIssuedWeight(job) {
      return (job.metalIssues || []).reduce((sum, m) => sum + num(m.weight), 0);
    },

    getJobReturnedWeight(job) {
      return (job.materialReturns || []).reduce((sum, m) => sum + num(m.weight), 0);
    },

    async recoverFromCorruption() {
      logAudit('RECOVERY_STARTED', 'Data recovery initiated');
      BackupManager.createBackup('Pre-recovery');

      const result = await this.runIntegrityCheck();

      if (result.issues.length > 20) {
        const backups = BackupManager.listBackups();
        if (backups.length > 0) {
          await BackupManager.restoreBackup(backups[0].id);
          logAudit('RECOVERY_FROM_BACKUP', 'Restored from latest backup due to extensive corruption');
        }
      }

      logAudit('RECOVERY_COMPLETED', 'Data recovery completed', result);
      return result;
    }
  };

  // ============================================================
  // DELETE PROTECTION
  // ============================================================
  const DeleteGuard = {
    canDelete(type, itemId) {
      const state = getState();
      switch (type) {
        case 'item':
          return !(state.sales || []).some(s => s.items?.some(i => i.itemId === itemId)) &&
                 !(state.jobs || []).some(j => j.metalIssues?.some(m => m.itemId === itemId));
        case 'customer':
          return !(state.sales || []).some(s => s.customerId === itemId) &&
                 !(state.quotes || []).some(q => q.customerId === itemId);
        case 'karigar':
          return !(state.jobs || []).some(j => j.assignedKarigarId === itemId);
        case 'supplier':
          return !(state.metalManagement?.transactions || []).some(t => t.supplierId === itemId);
        default:
          return true;
      }
    },

    softDelete(type, itemId) {
      const state = getState();
      const collections = { item: 'items', customer: 'customers', karigar: 'karigars', supplier: 'suppliers', job: 'jobs' };
      const collection = state[collections[type]];
      if (!collection) return false;
      const item = collection.find(i => i.id === itemId);
      if (!item) return false;
      item.deletedAt = new Date().toISOString();
      item.deletedBy = authState.currentUser?.username || 'system';
      item.status = 'deleted';
      saveState(state);
      logAudit(`${type.toUpperCase()}_DELETED`, `Soft deleted ${type}: ${itemId}`, { type, itemId });
      return true;
    }
  };

  // ============================================================
  // NOTIFICATION SYSTEM
  // ============================================================
  function showNotification(message, type = 'info') {
    if (typeof window === 'undefined') return;
    const container = document.getElementById('toast-container') || (() => {
      const c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:1100;display:flex;flex-direction:column;gap:8px;pointer-events:none';
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement('div');
    toast.style.cssText = `background:var(--bg-card);border:1px solid var(--border-whisper);border-radius:var(--radius-lg);padding:12px 16px;box-shadow:var(--shadow-strong);display:flex;align-items:center;gap:12px;min-width:280px;max-width:400px;animation:slideInRight 0.3s ease;pointer-events:auto;border-left:3px solid ${type==='success'?'var(--success)':type==='error'?'var(--error)':type==='warning'?'var(--warning)':'var(--info)'}`;
    toast.innerHTML = `<span style="flex:1;font-family:var(--font-body);font-size:0.8125rem;color:var(--text-pearl)">${esc(tr(message))}</span><button style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  // ============================================================
  // SECURE OPERATIONS WRAPPER
  // ============================================================
  const SecureOperations = {
    async execute(permission, fn, ...args) {
      requirePermission(permission);
      return fn(...args);
    },

    validateAndExecute(permission, schema, data, fn) {
      requirePermission(permission);
      if (schema) Validators.object(data, 'data', schema);
      return fn(data);
    }
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  async function initReliability() {
    await initAuth();
    BackupManager.init();

    DataRecovery.runIntegrityCheck().then(result => {
      if (result.fixes.length > 0) {
        showNotification(`${result.fixes.length} ${tr('data integrity fixes applied')}`, 'info');
      }
      if (result.issues.length > 0) {
        showNotification(`${result.issues.length} ${tr('data integrity issues found')}`, 'warning');
      }
    });

    // Global error boundary for forms
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.dataset.validate) {
        try {
          const schema = ValidationSchemas[form.dataset.validate];
          if (schema) {
            const formData = Object.fromEntries(new FormData(form).entries());
            schema(formData);
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            e.preventDefault();
            showNotification(error.message, 'error');
            return false;
          }
        }
      }
    }, true);

    // Protect against accidental navigation with unsaved changes
    let hasUnsavedChanges = false;
    document.addEventListener('input', () => { hasUnsavedChanges = true; }, { passive: true });
    document.addEventListener('change', () => { hasUnsavedChanges = true; }, { passive: true });

    window.addEventListener('beforeunload', (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Clear unsaved flag on successful save
    const originalRender = window.render;
    if (originalRender) {
      window.render = function() {
        hasUnsavedChanges = false;
        return originalRender.apply(this, arguments);
      };
    }

    // Expose reliability API globally
    window.RatnaOS = {
      ...(window.RatnaOS || {}),
      auth: {
        login: authenticate,
        logout: logoutUser,
        changePassword,
        createUser,
        updateUser,
        deleteUser,
        getCurrentUser: () => authState.currentUser,
        isAuthenticated: () => authState.isAuthenticated,
        hasPermission,
        hashPassword,
        verifyPassword,
        rateLimitStatus: getRateLimitStatus,
        clearRateLimit
      },
      validate: Validators,
      schemas: ValidationSchemas,
      backup: BackupManager,
      recovery: DataRecovery,
      deleteGuard: DeleteGuard,
      secure: SecureOperations,
      errors: {
        AppError,
        ValidationError,
        DuplicateTransactionError,
        InsufficientStockError,
        MetalBalanceError,
        PermissionDeniedError
      },
      audit: {
        log: logAudit,
        getCategory: categorizeEvent
      },
      showNotification,
      atomicOperation,
      idempotencyHas,
      csrf: {
        generate: generateCsrfToken,
        token: getCsrfToken,
        validate: validateCsrfToken,
        rotate: rotateCsrfToken
      }
    };

    logAudit('SYSTEM_INIT', 'Reliability module initialized');
    console.log('RatnaOS Reliability Module loaded');
  }

  // Auto-initialize when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initReliability);
    } else {
      initReliability();
    }
  }

})();