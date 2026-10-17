import { createHmac, timingSafeEqual } from 'node:crypto';
import User from '../models/User.js';

const COOKIE_NAME = 'caseflow_session';
const SESSION_SECONDS = 60 * 60;

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    const error = new Error('Authentication is not configured. Set AUTH_SECRET to a random value of at least 32 bytes.');
    error.status = 503;
    throw error;
  }
  return secret;
}

function sign(value) {
  return createHmac('sha256', authSecret()).update(value).digest('base64url');
}

export function createSessionToken(userId) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: String(userId),
    iat: now,
    exp: now + SESSION_SECONDS,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, suppliedSignature] = parts;
  let expectedSignature;
  try {
    expectedSignature = Buffer.from(sign(payload), 'base64url');
  } catch {
    return null;
  }
  const actualSignature = Buffer.from(suppliedSignature, 'base64url');
  if (
    actualSignature.length !== expectedSignature.length
    || !timingSafeEqual(actualSignature, expectedSignature)
  ) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof claims.sub !== 'string'
      || !/^[a-f0-9]{24}$/i.test(claims.sub)
      || !Number.isInteger(claims.exp)
      || claims.exp <= now
      || !Number.isInteger(claims.iat)
      || claims.iat > now + 60
    ) return null;
    return claims;
  } catch {
    return null;
  }
}

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      return item.slice(separator + 1).trim();
    }
  }
  return null;
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export async function requireAuth(req, res, next) {
  try {
    const token = getCookie(req, COOKIE_NAME);
    const claims = readSessionToken(token);
    if (!claims) return res.status(401).json({ message: 'Please sign in to continue.' });

    // Look up the user on every request so disabled accounts and role changes
    // take effect immediately rather than waiting for a token to expire.
    const user = await User.findById(claims.sub)
      .select('name email role patientId isActive')
      .lean();
    if (!user || !user.isActive) {
      clearSessionCookie(res);
      return res.status(401).json({ message: 'This account is unavailable. Please sign in again.' });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: user.patientId ? String(user.patientId) : null,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  const configuredOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  if (!origin) {
    return res.status(403).json({ message: 'An origin header is required for this request.' });
  }

  try {
    if (new URL(origin).origin !== new URL(configuredOrigin).origin) {
      return res.status(403).json({ message: 'This request origin is not allowed.' });
    }
  } catch {
    return res.status(403).json({ message: 'This request origin is not allowed.' });
  }

  if (req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ message: 'Cross-site requests are not allowed.' });
  }
  return next();
}
