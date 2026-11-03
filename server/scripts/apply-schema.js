// Applies db/schema.sql to the database (idempotent: every statement uses IF NOT EXISTS).
// Uses the direct connection when one is set (Neon's DATABASE_URL_UNPOOLED), since
// schema changes shouldn't go through the PgBouncer pooler.
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { poolConfig } from '../src/db.js';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in server/.env or .env.local, or pass it in the environment.');
  process.exit(1);
}

const client = new pg.Client(poolConfig(url));
const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await client.connect();
await client.query(sql);
console.log(`Schema applied to ${new URL(url).hostname}.`);
await client.end();
