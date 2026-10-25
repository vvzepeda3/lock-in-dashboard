import { createApp } from './app.js';

const missing = ['JWT_SECRET', 'DATABASE_URL'].filter((name) => !process.env[name]);
if (missing.length) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      (process.env.NODE_ENV === 'production'
        ? 'Set them in your hosting provider’s environment settings.'
        : 'Copy server/.env.example to server/.env and fill it in.'),
  );
  process.exit(1);
}

const port = Number(process.env.PORT) || 4000;
createApp().listen(port, () => {
  console.log(`Lock In listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
});
