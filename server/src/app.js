import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import subjectRoutes from './routes/subjects.js';
import sessionRoutes from './routes/sessions.js';

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp() {
  const app = express();

  // Client and API share one origin (Vite proxies /api in dev), so CORS is only
  // needed if the client is ever hosted elsewhere.
  if (process.env.CLIENT_ORIGIN) app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/sessions', sessionRoutes);

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Production: serve the built client and let React Router handle every other path
  if (process.env.NODE_ENV === 'production' && existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*path}', (req, res) => res.sendFile('index.html', { root: CLIENT_DIST }));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
