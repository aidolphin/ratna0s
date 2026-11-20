import { serialize, parse } from 'cookie';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 8 * 60 * 60, // 8 hours
};

const COOKIE_NAMES = {
  ACCESS_TOKEN: 'ratnaos_access',
  REFRESH_TOKEN: 'ratnaos_refresh',
  SESSION_ID: 'ratnaos_sid',
  CSRF_TOKEN: 'ratnaos_csrf',
};

export function setAuthCookies(res, { accessToken, refreshToken, sessionId, csrfToken }) {
  res.setHeader('Set-Cookie', [
    serialize(COOKIE_NAMES.ACCESS_TOKEN, accessToken, ACCESS_COOKIE_OPTIONS),
    serialize(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, COOKIE_OPTIONS),
    serialize(COOKIE_NAMES.SESSION_ID, sessionId, COOKIE_OPTIONS),
    serialize(COOKIE_NAMES.CSRF_TOKEN, csrfToken, { ...COOKIE_OPTIONS, sameSite: 'strict' }),
  ]);
}

export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    serialize(COOKIE_NAMES.ACCESS_TOKEN, '', { ...ACCESS_COOKIE_OPTIONS, maxAge: 0 }),
    serialize(COOKIE_NAMES.REFRESH_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 }),
    serialize(COOKIE_NAMES.SESSION_ID, '', { ...COOKIE_OPTIONS, maxAge: 0 }),
    serialize(COOKIE_NAMES.CSRF_TOKEN, '', { ...COOKIE_OPTIONS, maxAge: 0 }),
  ]);
}

export function getCookie(req, name) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[name] || null;
}

export function getAccessToken(req) {
  return getCookie(req, COOKIE_NAMES.ACCESS_TOKEN) || 
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
}

export function getRefreshToken(req) {
  return getCookie(req, COOKIE_NAMES.REFRESH_TOKEN);
}

export function getSessionId(req) {
  return getCookie(req, COOKIE_NAMES.SESSION_ID);
}

export function getCsrfToken(req) {
  return getCookie(req, COOKIE_NAMES.CSRF_TOKEN) || req.headers['x-csrf-token'];
}

export function validateCsrfToken(req, expectedToken) {
  const token = getCsrfToken(req);
  if (!token || !expectedToken) return false;
  
  if (token.length !== expectedToken.length) return false;
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

export { COOKIE_NAMES, COOKIE_OPTIONS, ACCESS_COOKIE_OPTIONS };