import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const MAX_DURATION_SECONDS = 4 * 60 * 60;
const CLOCK_SKEW_MS = 60 * 1000;

const toSession = (row) => ({
  id: row.id,
  subjectId: row.subject_id,
  startedAt: row.started_at,
  endedAt: row.ended_at,
  durationSeconds: row.duration_seconds,
});

const parseDate = (value) => {
  const d = typeof value === 'string' ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

router.use(requireAuth);

// GET /api/sessions?from=<ISO date>  (newest first)
router.get('/', async (req, res, next) => {
  const from = req.query.from ? parseDate(req.query.from) : null;
  if (req.query.from && !from) return res.status(400).json({ error: '"from" must be an ISO date' });

  try {
    const { rows } = await query(
      `SELECT id, subject_id, started_at, ended_at, duration_seconds
         FROM sessions
        WHERE user_id = $1 AND ($2::timestamptz IS NULL OR ended_at >= $2)
        ORDER BY ended_at DESC`,
      [req.user.id, from],
    );
    res.json({ sessions: rows.map(toSession) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { subjectId = null, durationSeconds } = req.body ?? {};
  const startedAt = parseDate(req.body?.startedAt);
  const endedAt = parseDate(req.body?.endedAt);

  if (!startedAt || !endedAt) {
    return res.status(400).json({ error: 'startedAt and endedAt must be ISO dates' });
  }
  if (endedAt < startedAt) return res.status(400).json({ error: 'endedAt must be after startedAt' });
  if (endedAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
    return res.status(400).json({ error: 'endedAt cannot be in the future' });
  }
  const wallSeconds = (endedAt - startedAt) / 1000;
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > MAX_DURATION_SECONDS ||
    durationSeconds > wallSeconds + 5
  ) {
    return res.status(400).json({ error: 'durationSeconds is invalid for the given time range' });
  }
  if (subjectId !== null && !Number.isInteger(subjectId)) {
    return res.status(400).json({ error: 'subjectId must be an integer or null' });
  }

  try {
    if (subjectId !== null) {
      const owned = await query('SELECT 1 FROM subjects WHERE id = $1 AND user_id = $2', [
        subjectId,
        req.user.id,
      ]);
      if (!owned.rowCount) return res.status(400).json({ error: 'Unknown subject' });
    }

    const { rows } = await query(
      `INSERT INTO sessions (user_id, subject_id, started_at, ended_at, duration_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, subject_id, started_at, ended_at, duration_seconds`,
      [req.user.id, subjectId, startedAt, endedAt, durationSeconds],
    );
    res.status(201).json({ session: toSession(rows[0]) });
  } catch (err) {
    next(err);
  }
});

export default router;
