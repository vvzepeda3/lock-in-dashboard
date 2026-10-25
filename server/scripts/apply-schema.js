// Applies db/schema.sql to DATABASE_URL (idempotent). Useful if the
// docker volume already existed before the schema file was mounted.
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Put it in server/.env or pass it in the environment.');
  process.exit(1);
}

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Schema applied.');
await pool.end();
