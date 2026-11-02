import { getSession } from '@auth/express';
import MicrosoftEntraID from '@auth/express/providers/microsoft-entra-id';

const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function safeReturnTo(value, origin) {
  if (typeof value !== 'string' || /[\\\r\n]/.test(value)) return '/';
  try {
    const target = new URL(value, origin);
    if (target.origin !== origin || !target.pathname.startsWith('/') || target.pathname.startsWith('/api/auth') || target.pathname === '/login') return '/';
    return target.pathname + target.search + target.hash;
  } catch { return '/'; }
}

export function readAuthSettings(env) {
  const required = ['AUTH_SECRET', 'AUTH_MICROSOFT_ENTRA_ID_ID', 'AUTH_MICROSOFT_ENTRA_ID_SECRET', 'AUTH_MICROSOFT_ENTRA_ID_ISSUER'];
  if (required.some(key => !env[key]) || !(env.AUTH_URL || env.NEXTAUTH_URL)) return null;
  try {
    const url = new URL(env.AUTH_URL || env.NEXTAUTH_URL);
    if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return null;
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) return null;
    if (env.NEXTAUTH_URL && new URL(env.NEXTAUTH_URL).origin !== url.origin) return null;
    const issuer = new URL(env.AUTH_MICROSOFT_ENTRA_ID_ISSUER);
    const tenant = issuer.pathname.split('/')[1];
    if (issuer.origin !== 'https://login.microsoftonline.com' || !guid.test(tenant) || issuer.pathname !== `/${tenant}/v2.0` || issuer.search || issuer.hash) return null;
    if (env.AUTH_SECRET.length < 32) return null;
    return { origin: url.origin, tenant: tenant.toLowerCase(), secure: url.protocol === 'https:' };
  } catch { return null; }
}

// These claims are consumed only after Auth.js verifies the OIDC response.
// The configured single tenant is authoritative; an email suffix alone is not authorization.
export function cedarvilleIdentity(profile, tenant) {
  if (!profile || String(profile.tid).toLowerCase() !== tenant || !guid.test(profile.oid) || typeof profile.sub !== 'string' || !profile.sub) return null;
  const email = profile.preferred_username || profile.email;
  if (typeof email !== 'string' || !/^[^\s@]+@cedarville\.edu$/i.test(email) || profile.acct === 1 || profile.acct === '1') return null;
  return { id: `${tenant}:${profile.oid.toLowerCase()}`, tenant };
}

export function createAuthConfig(env, settings) {
  return {
    basePath: '/api/auth',
    secret: env.AUTH_SECRET,
    trustHost: true,
    useSecureCookies: settings.secure,
    session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
    pages: { signIn: '/login', error: '/login' },
    providers: [MicrosoftEntraID({
      clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      checks: ['pkce', 'state', 'nonce'],
      authorization: { params: { scope: 'openid profile email' } },
      // Avoid an unnecessary Microsoft Graph photo request and scope.
      profile: profile => ({ id: profile.sub, name: profile.name, email: profile.email, image: null }),
    })],
    callbacks: {
      signIn({ account, profile }) {
        return account?.provider === 'microsoft-entra-id' && !!cedarvilleIdentity(profile, settings.tenant);
      },
      jwt({ token, account, profile }) {
        if (account) {
          const identity = account.provider === 'microsoft-entra-id' && cedarvilleIdentity(profile, settings.tenant);
          if (!identity) return null;
          // Keep access tokens, email and profile data out of the session cookie.
          return { sub: identity.id, tenant: identity.tenant };
        }
        return token;
      },
      session({ session, token }) {
        session.user = { id: token.sub, tenant: token.tenant };
        return session;
      },
      redirect({ url }) { return settings.origin + safeReturnTo(url, settings.origin); },
    },
    // Do not log tokens, provider responses, or secret-bearing configuration.
    logger: { error() { console.error('Authentication failed.'); }, warn() {}, debug() {} },
  };
}

export function authorizedSession(session, tenant) {
  const user = session?.user;
  if (user?.tenant !== tenant || typeof user.id !== 'string' || !user.id.startsWith(`${tenant}:`) || !guid.test(user.id.slice(tenant.length + 1))) return false;
  return typeof session.expires === 'string' && Date.parse(session.expires) > Date.now();
}

export function sessionReader(config) {
  return request => getSession(request, config);
}
