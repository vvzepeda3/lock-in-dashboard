import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const DEFAULT_COLOR = '#7c5cff';

const toSubject = (row) => ({ id: row.id, name: row.name, color: row.color, createdAt: row.created_at });

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, color, created_at FROM subjects WHERE user_id = $1 ORDER BY lower(name)',
      [req.user.id],
    );
    res.json({ subjects: rows.map(toSubject) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 50) {
    return res.status(400).json({ error: 'Subject name must be 1-50 characters' });
  }
  const color = COLOR_RE.test(req.body?.color ?? '') ? req.body.color : DEFAULT_COLOR;

  try {
    const { rows } = await query(
      'INSERT INTO subjects (user_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color, created_at',
      [req.user.id, name, color],
    );
    res.status(201).json({ subject: toSubject(rows[0]) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'You already have a subject with that name' });
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Subject not found' });

  try {
    const { rowCount } = await query('DELETE FROM subjects WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: 'Subject not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
