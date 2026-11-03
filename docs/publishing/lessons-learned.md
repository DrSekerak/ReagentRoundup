# Publishing Lessons Learned

Record manual fixes and deployment blockers here.

## 2026-11-03: Login button blocked by browser policy

- Users reported that clicking **Sign in with Cedarville** left them on the login page. Reproduced against the live app in an isolated Edge browser: the console reported that the form submission violated `form-action 'self'`, and the URL stayed at `/login`. The public health and CSRF endpoints returned HTTP 200.
- Chromium applies the login page's `form-action` policy to the Auth.js redirect to Microsoft. Added only `https://login.microsoftonline.com` to that directive and clarified that the button opens Microsoft's sign-in page. The existing single-tenant checks, CSRF, PKCE, state, nonce, session protection, and portal-managed callback/settings remain unchanged.
- A regression test exercises the real Auth.js sign-in POST with isolated OIDC discovery, verifies CSRF rejection, the exact CSP destinations, Microsoft authorization URL, callback, scopes, PKCE, state, and nonce. All 92 tests passed, as did lint, TypeScript/question/SVG validation and both production builds. Isolated local Edge and Chrome tests confirmed that the fixed button navigates to Microsoft without a CSP violation. No credentials were entered; completing actual user sign-in remains a live verification step.
- CU Launch reports the existing deployment as successful. Runtime diagnostics and logs through CU Launch require portal administrator access and were unavailable to this account. The managed repository's `main` matches the checked-out starting revision. The user explicitly authorized deploying this fix on 2026-11-03; pushing the verified change to managed `main` triggers the existing Azure deployment workflow.

## Selected services and generated workflow review

- Reviewed CU Launch's merged setup against the app code. The manifest selects Node.js 24 / Express, PostgreSQL via `DATABASE_URL`, and Microsoft Entra via `/api/auth/callback/microsoft-entra-id`. These match the implementation; no portal-managed settings or callback paths were changed.
- The generated Azure workflow installed dependencies but omitted `npm run build`. The server imports `dist-server/progress-schema.js` and serves `dist`, both generated and excluded from Git. Added an explicit build step before Azure login and deployment so both bundles are present in the deployment package.
- The generated workflow already has a `main` push trigger, although CU Launch reports first publish as not started. A default-branch push can dispatch Azure deployment. Do not infer permission for that deployment from the request to implement or test app code; explain this before requesting the push.
- PostgreSQL migrations and account save/load behavior, user isolation, stale-write rejection, real encrypted session checks, anonymous denial and authenticated access are covered by isolated local tests. The fixtures never use production `DATABASE_URL` or actual Cedarville credentials.
- Live PostgreSQL connectivity, provisioned TLS/permissions, and actual Cedarville sign-in remain unverified. Do not describe fixture tests as live integration testing. The initial npm installation also remains a hosted-environment check because the available local runtime provides Node/pnpm but no npm CLI.
- Verification after reviewing the generated setup: all 91 tests passed, including 14 server/database/authentication tests; lint, TypeScript/question/SVG validation, and both production bundles passed. A web-tool attempt to reach the assigned app URL was inaccessible through that tool and established no live-service result.
