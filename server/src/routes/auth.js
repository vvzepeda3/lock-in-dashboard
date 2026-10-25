import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!EMAIL_RE.test(email)) return { error: 'A valid email is required' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  return { email, password };
}

router.post('/signup', async (req, res, next) => {
  const creds = validateCredentials(req.body);
  if (creds.error) return res.status(400).json({ error: creds.error });

  try {
    const hash = await bcrypt.hash(creds.password, SALT_ROUNDS);
    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [creds.email, hash],
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email is already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const creds = validateCredentials(req.body);
  if (creds.error) return res.status(400).json({ error: creds.error });

  try {
    const { rows } = await query(
      'SELECT id, email, password_hash, created_at FROM users WHERE lower(email) = $1',
      [creds.email],
    );
    const row = rows[0];
    const ok = row && (await bcrypt.compare(creds.password, row.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const user = { id: row.id, email: row.email, created_at: row.created_at };
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, email, created_at FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!rows[0]) return res.status(401).json({ error: 'User no longer exists' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
