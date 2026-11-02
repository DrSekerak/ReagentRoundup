import { createApp } from './app.mjs';
import { readAuthSettings, createAuthConfig, sessionReader } from './auth.mjs';
import { createPool, migrate, progressStore } from './database.mjs';
import { normalizeProgress } from '../dist-server/progress-schema.js';

const settings = readAuthSettings(process.env);
const authConfig = settings ? createAuthConfig(process.env, settings) : null;
const pool = createPool();
let store = null;
let retry;
async function prepareDatabase() {
  if (!pool) return;
  let client;
  try {
    client = await pool.connect();
    await migrate(client);
    store = progressStore(pool);
    console.info('Account progress database is ready.');
  } catch {
    console.error('Account progress database is unavailable; retrying in 30 seconds.');
    retry = setTimeout(prepareDatabase, 30000);
    retry.unref();
  } finally { client?.release(); }
}
const dev = process.argv.includes('--dev');
const vite = dev ? await (await import('vite')).createServer({ server: { middlewareMode: true, hmr: false }, configLoader: 'native', appType: 'spa' }) : null;
const app = createApp({ settings, authConfig, readSession: authConfig ? sessionReader(authConfig) : null,
  store: { load: (...args) => { if (!store) throw new Error('Database unavailable'); return store.load(...args); },
    save: (...args) => { if (!store) throw new Error('Database unavailable'); return store.save(...args); } },
  validateProgress: normalizeProgress, vite });
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.info('Reagent Roundup server started.'));
// Process health must not depend on database or Entra reachability.
void prepareDatabase();
if (!settings) console.error('Cedarville authentication settings are missing or invalid. Protected content remains unavailable.');
async function shutdown() {
  clearTimeout(retry);
  server.close();
  await vite?.close();
  await pool?.end();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
