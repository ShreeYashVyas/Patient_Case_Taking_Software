import { createHash, randomBytes } from 'node:crypto';
import Session from '../models/Session.js';

const COOKIE_NAME = 'caseflow_session';
const SESSION_SECONDS = 60 * 60;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
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

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  await Session.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
  });
  return token;
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

export async function revokeSession(req) {
  const token = getCookie(req, COOKIE_NAME);
  if (token && token.length <= 128) {
    await Session.deleteOne({ tokenHash: hashToken(token) });
  }
}

export async function requireAuth(req, res, next) {
  try {
    const token = getCookie(req, COOKIE_NAME);
    if (!token || token.length > 128) {
      return res.status(401).json({ message: 'Please sign in to continue.' });
    }

    // Only the hash is stored. Every request checks the live session and user,
    // so logout and account deactivation take effect immediately.
    const session = await Session.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() },
    }).populate('user', 'name email role patientId isActive');

    if (!session || !session.user || !session.user.isActive) {
      if (session) await Session.deleteOne({ _id: session._id });
      clearSessionCookie(res);
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }

    req.sessionId = String(session._id);
    req.user = {
      id: String(session.user._id),
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      patientId: session.user.patientId ? String(session.user.patientId) : null,
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
