// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { encode } from '@auth/core/jwt';
import request from 'supertest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app.mjs';
import { migrate, progressStore } from './database.mjs';
import { readAuthSettings, createAuthConfig, authorizedSession, cedarvilleIdentity, safeReturnTo, sessionReader } from './auth.mjs';
import { normalizeProgress } from './progress-schema';

const tenant = '11111111-1111-4111-8111-111111111111';
const alice = `${tenant}:22222222-2222-4222-8222-222222222222`;
const bob = `${tenant}:33333333-3333-4333-8333-333333333333`;
const settings = { origin: 'https://roundup.example', tenant, secure: true };
const document = { version: 1, selectedGroups: ['radical-halogenation'], questionCount: 5, session: null };
const session = id => ({ user: { id, tenant }, expires: new Date(Date.now() + 3600000).toISOString() });
const env = { AUTH_URL: settings.origin, AUTH_SECRET: 'isolated-fixture-secret-never-production', AUTH_MICROSOFT_ENTRA_ID_ID: 'fixture-client', AUTH_MICROSOFT_ENTRA_ID_SECRET: 'fixture-client-secret', AUTH_MICROSOFT_ENTRA_ID_ISSUER: `https://login.microsoftonline.com/${tenant}/v2.0` };
let db, client, store, directory;
function appAs(id, overrides = {}) {
  return createApp({ settings, readSession: async () => id ? session(id) : null, store, validateProgress: normalizeProgress, staticDirectory: directory, ...overrides });
}
beforeAll(async () => {
  db = new PGlite();
  client = { query: async (sql, params) => {
    // PGlite's exec is the multi-statement PostgreSQL simple-query protocol.
    if (params === undefined && sql.includes(';')) { const results = await db.exec(sql); return results.at(-1); }
    return db.query(sql, params);
  } };
  await migrate(client);
  store = progressStore(client);
  directory = await mkdtemp(join(tmpdir(), 'roundup-test-'));
  await writeFile(join(directory, 'index.html'), '<h1>Protected practice</h1>');
  await writeFile(join(directory, 'bank.json'), '{"private":"question bank"}');
}, 30000);
afterAll(async () => { await db?.close(); if (directory) await rm(directory, { recursive: true }); });

describe('isolated PostgreSQL migrations and progress', () => {
  it('applies migrations once and preserves data on rerun', async () => {
    expect(await store.load(alice)).toMatchObject({ document: null, revision: 0 });
    expect(await store.save(alice, document, 0)).toMatchObject({ revision: 1 });
    await migrate(client);
    expect(await store.load(alice)).toMatchObject({ document, revision: 1 });
    expect((await client.query('SELECT name FROM rr_schema_migrations')).rows).toHaveLength(1);
  });
  it('isolates users and rejects stale writes without replacing newer progress', async () => {
    expect((await store.load(bob)).document).toBeNull();
    expect(await store.save(bob, document, 0)).toMatchObject({ revision: 1 });
    expect(await store.save(bob, { ...document, questionCount: 10 }, 1)).toMatchObject({ revision: 2 });
    expect(await store.save(bob, document, 1)).toBeNull();
    expect(await store.save(bob, document, 0)).toBeNull();
    expect((await store.load(bob)).document.questionCount).toBe(10);
    expect((await store.load(alice)).document.questionCount).toBe(5);
  });
  it('rejects changed migration history', async () => {
    const original = (await client.query('SELECT checksum FROM rr_schema_migrations')).rows[0].checksum;
    await client.query("UPDATE rr_schema_migrations SET checksum = 'changed'");
    await expect(migrate(client)).rejects.toThrow('modified');
    await client.query('UPDATE rr_schema_migrations SET checksum = $1', [original]);
  });
});

describe('server-side protection', () => {
  it('keeps only exact GET health independent of auth and database availability', async () => {
    const app = appAs(null, { settings: null, store: null, readSession: vi.fn(() => { throw Error(); }) });
    expect((await request(app).get('/api/health')).status).toBe(200);
    for (const path of ['/api/health/', '/api/health/details', '/API/health', '/api/progress', '/', '/bank.json']) {
      expect((await request(app).get(path)).status).toBe(503);
    }
    expect((await request(app).post('/api/health')).status).toBe(503);
    expect((await request(app).head('/api/health')).status).toBe(503);
  });
  it('denies anonymous API and asset requests and redirects app pages to login', async () => {
    const app = appAs(null);
    expect((await request(app).get('/api/progress')).status).toBe(401);
    expect((await request(app).put('/api/progress').send({})).status).toBe(401);
    for (const path of ['/', '/bank.json', '/structures/question.svg', '/login/']) {
      const response = await request(app).get(path);
      expect(response.status).toBe(303);
      expect(response.headers.location).toMatch(/^\/login\?returnTo=/);
      expect(response.text).not.toContain('Protected practice');
    }
  });
  it('allows authenticated pages and each user’s own data, ignoring supplied owner IDs', async () => {
    const app = appAs(alice);
    expect((await request(app).get('/')).text).toContain('Protected practice');
    expect((await request(app).get('/bank.json')).status).toBe(200);
    const current = await request(app).get('/api/progress?userId=' + bob);
    expect(current.body.document.questionCount).toBe(5);
    const saved = await request(app).put('/api/progress').set('Origin', settings.origin).send({ document, revision: current.body.revision, userId: bob });
    expect(saved.status).toBe(200);
    expect((await store.load(bob)).revision).toBe(2);
    expect((await request(app).put('/api/progress').set('Origin', settings.origin).send({ document, revision: current.body.revision })).status).toBe(409);
  });
  it('rejects cross-site writes, missing origin, corrupt saves and invalid revisions', async () => {
    const app = appAs(alice);
    expect((await request(app).put('/api/progress').send({ document, revision: 1 })).status).toBe(403);
    expect((await request(app).put('/api/progress').set('Origin', 'https://attacker.example').send({ document, revision: 1 })).status).toBe(403);
    expect((await request(app).put('/api/progress').set('Origin', settings.origin).send({ document: { version: 99 }, revision: 1 })).status).toBe(400);
    expect((await request(app).put('/api/progress').set('Origin', settings.origin).send({ document, revision: -1 })).status).toBe(400);
    expect((await request(app).put('/api/progress').set('Origin', settings.origin).send({ document: { ...document, session: { entries: [] } }, revision: 1 })).status).toBe(400);
  });
  it('rejects expired sessions and sessions for a different tenant', async () => {
    const expired = appAs(null, { readSession: async () => ({ ...session(alice), expires: '2000-01-01T00:00:00Z' }) });
    expect((await request(expired).get('/api/progress')).status).toBe(401);
    expect(authorizedSession({ ...session(alice), user: { id: alice, tenant: 'another' } }, tenant)).toBe(false);
  });
  it('keeps health alive when database operations fail and redacts errors', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = appAs(alice, { store: { load() { throw Error('private-connection-string'); } } });
    const result = await request(app).get('/api/progress');
    expect(result.status).toBe(503);
    expect(result.text).not.toContain('private-connection-string');
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-connection-string');
    log.mockRestore();
  });
});

describe('Cedarville OIDC and login boundaries', () => {
  it('requires a configured single Microsoft tenant and server secrets', () => {
    expect(readAuthSettings(env)).toEqual(settings);
    expect(readAuthSettings({ ...env, AUTH_URL: undefined, NEXTAUTH_URL: settings.origin })).toEqual(settings);
    expect(readAuthSettings({ ...env, AUTH_MICROSOFT_ENTRA_ID_ISSUER: 'https://login.microsoftonline.com/common/v2.0' })).toBeNull();
    expect(readAuthSettings({ ...env, AUTH_SECRET: '' })).toBeNull();
    expect(readAuthSettings({ ...env, AUTH_URL: 'http://public.example' })).toBeNull();
  });
  it('uses validated tenant/object claims instead of trusting email alone', async () => {
    const config = createAuthConfig(env, settings);
    const profile = { tid: tenant, oid: alice.split(':')[1], sub: 'provider-subject', preferred_username: 'fixture@cedarville.edu' };
    expect(cedarvilleIdentity(profile, tenant)?.id).toBe(alice);
    for (const wrong of [{ tid: 'wrong' }, { oid: '' }, { acct: 1 }, { preferred_username: 'fixture@cedarville.edu.attacker.example' }]) {
      expect(cedarvilleIdentity({ ...profile, ...wrong }, tenant)).toBeNull();
    }
    expect(config.callbacks.signIn({ account: { provider: 'microsoft-entra-id' }, profile })).toBe(true);
    expect(config.callbacks.signIn({ account: { provider: 'credentials' }, profile })).toBe(false);
    const token = config.callbacks.jwt({ token: {}, account: { provider: 'microsoft-entra-id' }, profile });
    expect(token).toEqual({ sub: alice, tenant });
    expect(config.callbacks.session({ session: session(alice), token }).user).toEqual({ id: alice, tenant });
  });
  it('allows only same-origin return destinations', () => {
    for (const url of ['https://attacker.example', '//attacker.example', '/\\attacker.example', '/api/auth/signin', '/login', 'javascript:alert(1)']) {
      expect(safeReturnTo(url, settings.origin)).toBe('/');
    }
    expect(safeReturnTo('/?practice=1', settings.origin)).toBe('/?practice=1');
    expect(safeReturnTo(settings.origin + '/?practice=1', settings.origin)).toBe('/?practice=1');
  });
  it('renders public login and serves real Auth.js CSRF at the provisioned base path', async () => {
    const config = createAuthConfig(env, settings);
    const app = appAs(null, { authConfig: config, readSession: sessionReader(config) });
    const login = await request(app).get('/login?returnTo=https://attacker.example');
    expect(login.status).toBe(200);
    expect(login.text).toContain('action="/api/auth/signin/microsoft-entra-id"');
    expect(login.text).not.toContain('attacker.example');
    const csrf = await request(app).get('/api/auth/csrf');
    expect(csrf.status).toBe(200);
    expect(typeof csrf.body.csrfToken).toBe('string');
    expect(csrf.headers['set-cookie'].join(';')).toMatch(/HttpOnly/i);
    expect(csrf.headers['set-cookie'].join(';')).toMatch(/Secure/i);
    expect((await request(app).get('/')).status).toBe(303);
    expect((await request(app).get('/api/progress').set('Cookie', '__Secure-authjs.session-token=forged')).status).toBe(401);
  });
  it('allows the CSRF-protected sign-in form to redirect only to Microsoft login', async () => {
    const config = createAuthConfig(env, settings);
    const issuer = env.AUTH_MICROSOFT_ENTRA_ID_ISSUER;
    const discovery = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      expect(String(input)).toBe(issuer + '/.well-known/openid-configuration');
      return globalThis.Response.json({ issuer, authorization_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
        token_endpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        jwks_uri: `https://login.microsoftonline.com/${tenant}/discovery/v2.0/keys` });
    });
    try {
      const app = appAs(null, { authConfig: config, readSession: sessionReader(config) });
      const login = await request(app).get('/login?returnTo=/?practice=1');
      const formAction = login.headers['content-security-policy'].split(';').find(value => value.trim().startsWith('form-action')).trim();
      expect(formAction).toBe("form-action 'self' https://login.microsoftonline.com");
      const csrf = await request(app).get('/api/auth/csrf');
      const cookies = csrf.headers['set-cookie'].map(value => value.split(';')[0]);
      const submit = body => request(app).post('/api/auth/signin/microsoft-entra-id').set('Cookie', cookies).type('form').send(body);
      const denied = await submit({ callbackUrl: settings.origin });
      expect(denied.headers.location).not.toMatch(/^https:\/\/login\.microsoftonline\.com\//);
      const result = await submit({ csrfToken: csrf.body.csrfToken, callbackUrl: settings.origin + '/?practice=1' });
      expect(result.status).toBe(302);
      const destination = new URL(result.headers.location);
      expect(destination.origin).toBe('https://login.microsoftonline.com');
      expect(destination.pathname).toBe(`/${tenant}/oauth2/v2.0/authorize`);
      expect(destination.searchParams.get('redirect_uri')).toBe(settings.origin + '/api/auth/callback/microsoft-entra-id');
      expect(destination.searchParams.get('scope')).toBe('openid profile email');
      expect(destination.searchParams.get('state')).toBeTruthy();
      expect(destination.searchParams.get('nonce')).toBeTruthy();
      expect(destination.searchParams.get('code_challenge_method')).toBe('S256');
      expect(destination.searchParams.get('code_challenge')).toBeTruthy();
    } finally { discovery.mockRestore(); }
  });
  it('verifies real encrypted session cookies for protected pages and APIs', async () => {
    const config = createAuthConfig(env, settings);
    const app = appAs(null, { authConfig: config, readSession: sessionReader(config) });
    const salt = '__Secure-authjs.session-token';
    const cookie = async (token, maxAge = 3600) => `${salt}=${await encode({ token, secret: env.AUTH_SECRET, salt, maxAge })}`;
    const valid = await cookie({ sub: alice, tenant });
    expect((await request(app).get('/').set('Cookie', valid)).status).toBe(200);
    const ownSave = await request(app).get('/api/progress').set('Cookie', valid);
    expect(ownSave.status).toBe(200);
    expect(ownSave.body.document.questionCount).toBe(5);
    const otherTenant = await cookie({ sub: alice, tenant: 'another' });
    expect((await request(app).get('/api/progress').set('Cookie', otherTenant)).status).toBe(401);
    const expired = await cookie({ sub: alice, tenant }, -3600);
    expect((await request(app).get('/api/progress').set('Cookie', expired)).status).toBe(401);
  });
});
