import { createApp } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env.');
  process.exit(1);
}

const port = Number(process.env.PORT) || 4000;
createApp().listen(port, () => {
  console.log(`Lock In API listening on http://localhost:${port}`);
});
