// Applies db/schema.sql to DATABASE_URL (idempotent). Useful if the
// docker volume already existed before the schema file was mounted.
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Schema applied.');
await pool.end();
