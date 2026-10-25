import pg from 'pg';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

// Hosted Postgres (e.g. Neon) needs SSL; the local Docker database doesn't.
// SSL params are stripped from the URL because pg lets them override the ssl option below.
function poolConfig(databaseUrl) {
  if (!databaseUrl) return {};
  const url = new URL(databaseUrl);
  if (LOCAL_HOSTS.has(url.hostname)) return { connectionString: databaseUrl };
  for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) {
    url.searchParams.delete(key);
  }
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
}

export const pool = new pg.Pool(poolConfig(process.env.DATABASE_URL));

export const query = (text, params) => pool.query(text, params);
