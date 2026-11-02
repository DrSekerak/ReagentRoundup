import pg from 'pg';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

export function createPool(env = process.env) {
  if (!env.DATABASE_URL) return null;
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000 });
  pool.on('error', () => console.error('An idle database connection was interrupted.'));
  return pool;
}

export async function migrate(client) {
  const directory = new URL('./migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(file => /^\d+_[a-z_]+\.sql$/.test(file)).sort();
  await client.query('BEGIN');
  try {
    // Serialize migrations between app instances without changing existing application data.
    await client.query('SELECT pg_advisory_xact_lock(764281905)');
    await client.query('CREATE TABLE IF NOT EXISTS rr_schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const applied = await client.query('SELECT name, checksum FROM rr_schema_migrations');
    for (const file of files) {
      const sql = (await readFile(new URL(file, directory), 'utf8')).replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = applied.rows.find(row => row.name === file);
      if (existing && existing.checksum !== checksum) throw new Error('An applied migration was modified.');
      if (existing) continue;
      await client.query(sql);
      await client.query('INSERT INTO rr_schema_migrations (name, checksum) VALUES ($1, $2)', [file, checksum]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}

export function progressStore(pool) {
  return {
    async load(userId) {
      const result = await pool.query('SELECT document, revision, updated_at FROM rr_progress WHERE user_id = $1', [userId]);
      return result.rows[0] || { document: null, revision: 0, updated_at: null };
    },
    async save(userId, document, revision) {
      await pool.query('INSERT INTO rr_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [userId]);
      // Never silently replace a newer save from another device or tab.
      const result = revision === 0
        ? await pool.query('INSERT INTO rr_progress (user_id, document) VALUES ($1, $2::jsonb) ON CONFLICT (user_id) DO NOTHING RETURNING revision, updated_at', [userId, JSON.stringify(document)])
        : await pool.query('UPDATE rr_progress SET document = $2::jsonb, revision = revision + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revision = $3 RETURNING revision, updated_at', [userId, JSON.stringify(document), revision]);
      return result.rows[0] || null;
    },
  };
}
