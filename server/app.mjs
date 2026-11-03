import express from 'express';
import { ExpressAuth } from '@auth/express';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { authorizedSession, safeReturnTo } from './auth.mjs';

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createApp({ settings, authConfig, readSession, store, validateProgress, staticDirectory = resolve('dist'), vite = null }) {
  const app = express();
  app.disable('x-powered-by');
  app.enable('strict routing');
  app.enable('case sensitive routing');
  app.set('trust proxy', 1); // CU Launch's App Service HTTPS reverse proxy.
  app.use((req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' });
    next();
  });
  app.get('/api/health', (req, res, next) => req.method === 'GET' ? res.status(200).json({ status: 'ok' }) : next('route'));

  // Canonicalize auth requests before Auth.js constructs absolute callback URLs.
  app.use('/api/auth', (req, res, next) => {
    if (!settings || !authConfig) return res.status(503).send('Cedarville sign-in is not configured yet.');
    req.headers.host = new URL(settings.origin).host;
    req.headers['x-forwarded-host'] = req.headers.host;
    req.headers['x-forwarded-proto'] = new URL(settings.origin).protocol.slice(0, -1);
    next();
  });
  // Only the authentication actions required by this provider are anonymous.
  if (authConfig) app.use(/^\/api\/auth\/(csrf|session|providers|signin(?:\/microsoft-entra-id)?|signout|callback\/microsoft-entra-id|error)$/, (req, res, next) => {
    if (!['GET', 'POST'].includes(req.method)) return res.sendStatus(405);
    // ExpressAuth's wildcard mount sets the provider action in params[0].
    next();
  }, ExpressAuth(authConfig));

  app.get('/login', (req, res) => {
    if (!settings) return res.status(503).type('html').send('<h1>Reagent Roundup</h1><p>Cedarville sign-in is not configured yet. Please try again after setup is complete.</p>');
    const nonce = randomBytes(18).toString('base64');
    const returnTo = safeReturnTo(req.query.returnTo || req.query.callbackUrl, settings.origin);
    // Chromium also applies form-action to the OAuth redirect after the local POST.
    // Permit the configured provider's Microsoft login host without opening other destinations.
    res.set('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self' https://login.microsoftonline.com; base-uri 'none'; frame-ancestors 'none'`);
    res.type('html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sign in · Reagent Roundup</title>
      <style nonce="${nonce}">body{font:18px system-ui;max-width:38rem;margin:12vh auto;padding:2rem;background:#f6f8fb;color:#183446}button{font:inherit;padding:1rem;background:#174c64;color:white;border:0;border-radius:.4rem}p{line-height:1.6}</style>
      <h1>Reagent Roundup</h1><p>Sign in with your Cedarville University Microsoft account to continue. The button opens Microsoft’s secure sign-in page.</p>${req.query.error ? '<p role="alert">Sign-in was unsuccessful. Please use your Cedarville account and try again.</p>' : ''}
      <form method="post" action="/api/auth/signin/microsoft-entra-id"><input type="hidden" name="csrfToken" id="csrf"><input type="hidden" name="callbackUrl" value="${escapeHtml(settings.origin + returnTo)}"><button disabled>Sign in with Cedarville</button></form><p id="notice" role="status"></p>
      <script nonce="${nonce}">fetch('/api/auth/csrf',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(!d.csrfToken)throw Error();document.getElementById('csrf').value=d.csrfToken;document.querySelector('button').disabled=false}).catch(()=>{document.getElementById('notice').textContent='Sign-in is unavailable. Please reload to try again.'})</script></html>`);
  });

  app.use(asyncRoute(async (req, res, next) => {
    if (!settings || !readSession) return res.status(503).send('Cedarville sign-in is not configured yet.');
    const session = await readSession(req);
    if (!authorizedSession(session, settings.tenant)) {
      if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Sign in with Cedarville to continue.' });
      return res.redirect(303, '/login?returnTo=' + encodeURIComponent(safeReturnTo(req.originalUrl, settings.origin)));
    }
    res.locals.userId = session.user.id;
    next();
  }));
  app.get('/api/progress', asyncRoute(async (req, res) => {
    if (!store) return res.status(503).json({ error: 'Account saving is unavailable. Your browser progress is unchanged.' });
    res.json(await store.load(res.locals.userId));
  }));
  app.put('/api/progress', (req, res, next) => {
    if (req.get('origin') !== settings.origin || !req.is('application/json')) return res.sendStatus(403);
    next();
  }, express.json({ limit: '512kb' }), asyncRoute(async (req, res) => {
    if (!store) return res.status(503).json({ error: 'Account saving is unavailable. Your browser progress is unchanged.' });
    const { document, revision } = req.body || {};
    if (!Number.isSafeInteger(revision) || revision < 0 || revision > 2147483646) return res.status(400).json({ error: 'Invalid save version.' });
    let validated;
    try { validated = validateProgress(document); }
    catch { return res.status(400).json({ error: 'Invalid or incompatible progress.' }); }
    const saved = await store.save(res.locals.userId, validated, revision);
    if (!saved) return res.status(409).json({ error: 'Account progress changed in another tab or device. Load it before saving again.' });
    res.json(saved);
  }));
  app.use('/api', (req, res) => res.sendStatus(404));
  if (vite) app.use(vite.middlewares);
  else {
    app.use(express.static(staticDirectory, { index: false, redirect: false, dotfiles: 'deny' }));
    app.get('/', (req, res) => res.sendFile(resolve(staticDirectory, 'index.html')));
  }
  app.use((req, res) => res.sendStatus(404));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Save is too large.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    // Never expose database connection strings, claims, or provider details.
    console.error('A server request failed.');
    res.status(503).json({ error: 'This service is temporarily unavailable. Your browser progress is unchanged.' });
  });
  return app;
}
