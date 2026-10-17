import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { verifyPassword } from '../lib/password.js';
import {
  clearSessionCookie,
  createSession,
  requireAuth,
  requireSameOrigin,
  revokeSession,
  setSessionCookie,
} from '../middleware/auth.js';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    patientId: user.patientId ? String(user.patientId) : null,
  };
}

router.post('/login', loginLimiter, requireSameOrigin, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password || email.length > 254 || password.length > 128) {
    return res.status(400).json({ message: 'Enter a valid email and password.' });
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordMatches = await verifyPassword(password, user?.passwordHash);
  if (!user || !user.isActive || !passwordMatches) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  const token = await createSession(user._id);
  setSessionCookie(res, token);
  return res.json({ user: publicUser(user) });
});

router.post('/logout', requireSameOrigin, async (req, res) => {
  await revokeSession(req);
  clearSessionCookie(res);
  return res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.get('/access', requireAuth, (req, res) => {
  const access = {
    patient: ['own profile', 'own approved consultations'],
    receptionist: ['patient registration', 'patient demographics', 'appointment workflow'],
    doctor: ['patient records', 'clinical history', 'consultations'],
  };
  return res.json({ role: req.user.role, permissions: access[req.user.role] || [] });
});

export default router;
