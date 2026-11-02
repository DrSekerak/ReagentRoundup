# Server services

Reagent Roundup uses its existing React/TypeScript/Vite UI behind a root Express server. The server handles Microsoft Entra OIDC through Auth.js and PostgreSQL through node-postgres. Node.js 24 and npm are required. `npm run dev` starts Vite as protected Express middleware; `npm run build` checks types and builds both the browser application and shared server validation bundle; `npm start` serves production. Never publish with Vite preview, a static file server, or GitHub Pages.

## Settings

`.env.example` documents placeholder values only. Production settings come from CU Launch. Optional local `.env.local` files are ignored by Git and loaded by Node. Do not place secrets in `VITE_*` variables, URLs in chat, logs, committed files, or browser code.

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only PostgreSQL connection string, including the provisioned TLS requirements |
| `AUTH_SECRET` | Portal-generated session encryption secret, at least 32 characters |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Provisioned Entra client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Provisioned Entra client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | `https://login.microsoftonline.com/<tenant-id>/v2.0`; must identify the specific Cedarville tenant |
| `AUTH_URL`, `NEXTAUTH_URL` | Canonical external app URL; either is accepted, and origins must match when both exist |
| `PORT` | HTTP listening port, defaults to 3000 |

The app consumes the provisioned issuer without changing the app registration. Never use the Microsoft `common`, `organizations`, or `consumers` issuer. HTTPS is required except on localhost. PostgreSQL TLS verification follows the supplied connection string; there is no certificate-verification bypass.

## Authentication and authorization

`/login` is a public sign-in page. The Express form obtains an Auth.js CSRF token, then posts to `/api/auth/signin/microsoft-entra-id`. The provisioned callback remains **`/api/auth/callback/microsoft-entra-id`**. Auth.js verifies the OIDC response; the sign-in callback additionally requires the configured tenant, immutable object and subject identifiers, and a Cedarville username. Guest-account claims are rejected when supplied. Authorization uses the validated tenant/object ID, never an email address or a browser-provided owner ID. Microsoft warns that email and preferred username are mutable; they are an additional sign-in restriction, not record identifiers. See [Microsoft's token claims reference](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference) and [Auth.js Express integration](https://authjs.dev/reference/express).

Sessions use encrypted, HttpOnly, same-site cookies with Secure enabled on HTTPS and an eight-hour lifetime. Server middleware verifies sessions and the tenant before returning app HTML, assets, or API data. Auth.js manages CSRF for authentication actions; progress writes require the canonical Origin and JSON. Return destinations are restricted to the canonical origin. Missing or invalid sign-in configuration fails closed. No development or production authentication bypass exists.

Only exact `GET /api/health`, the exact login page, and the allowlisted Auth.js sign-in/session/CSRF/sign-out/callback endpoints are anonymous. Unknown authentication endpoints fall through to protection. The health response reports process health and does not contact PostgreSQL or Entra. API failures do not reveal credentials or provider responses. The reverse proxy is trusted for one hop, and authentication request hosts are pinned to the configured app origin.

## Database and existing data

On startup the server applies versioned SQL migrations in `server/migrations` using a transaction, migration checksums and a PostgreSQL advisory lock. Add new migration files; never edit an applied one. The migration creates only `rr_schema_migrations`, `rr_users` and `rr_progress`. It does not replace databases, delete existing data, or alter unrelated tables. Migrations require the provisioned database role to create these app tables. A mismatch fails account saving rather than rewriting history. Startup retries failed preparation every 30 seconds while process health remains available.

`rr_users` stores an immutable tenant/object ID and creation time. `rr_progress` stores one versioned personal snapshot per user with update time. Snapshots contain the same question IDs, order, submitted choices, hints, selections and navigation state as browser saves. Parameterized queries scope every operation to the server-derived owner. Compare-and-swap revisions prevent silent overwrites from concurrent tabs or devices. These are practice records, not tamper-proof grades or instructor analytics.

Browser automatic saving is preserved with its original key and validation. No existing browser data is automatically uploaded, deleted or replaced. Account transfer uses explicit buttons. Loading into the browser and initially replacing an existing account save require confirmation. Damaged browser saves cannot be uploaded until replaced through the existing confirmation flow. All account payloads pass the shared current-question-bank validator. Data from a different origin, including an old GitHub Pages site, is not migrated automatically. On a shared computer, browser-local progress persists across sign-out as before; users should avoid loading personal progress into a shared browser profile.

## Verification

Run `npm run validate`, `npm run lint`, `npm test` and `npm run build`. The server suite uses a disposable PGlite PostgreSQL instance, never `DATABASE_URL`, to test SQL migrations, data preservation, account isolation, validation, conflict handling, anonymous denial, authenticated access, CSRF/origin checks, return URLs and health during service failure. Auth tests use synthetic identities, never production credentials.

Live PostgreSQL connectivity, provisioned database permissions/TLS, Entra redirects, consent and actual Cedarville sign-in still require the provisioned environment. Passing local tests does not establish live integration. Publishing is a separate authorized CU Launch action. No Azure resources or production migrations were run by this implementation.
