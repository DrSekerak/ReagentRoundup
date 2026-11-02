# Publishing Lessons Learned

Record manual fixes and deployment blockers here.

## Selected services and generated workflow review

- Reviewed CU Launch's merged setup against the app code. The manifest selects Node.js 24 / Express, PostgreSQL via `DATABASE_URL`, and Microsoft Entra via `/api/auth/callback/microsoft-entra-id`. These match the implementation; no portal-managed settings or callback paths were changed.
- The generated Azure workflow installed dependencies but omitted `npm run build`. The server imports `dist-server/progress-schema.js` and serves `dist`, both generated and excluded from Git. Added an explicit build step before Azure login and deployment so both bundles are present in the deployment package.
- The generated workflow already has a `main` push trigger, although CU Launch reports first publish as not started. A default-branch push can dispatch Azure deployment. Do not infer permission for that deployment from the request to implement or test app code; explain this before requesting the push.
- PostgreSQL migrations and account save/load behavior, user isolation, stale-write rejection, real encrypted session checks, anonymous denial and authenticated access are covered by isolated local tests. The fixtures never use production `DATABASE_URL` or actual Cedarville credentials.
- Live PostgreSQL connectivity, provisioned TLS/permissions, and actual Cedarville sign-in remain unverified. Do not describe fixture tests as live integration testing. The initial npm installation also remains a hosted-environment check because the available local runtime provides Node/pnpm but no npm CLI.
- Verification after reviewing the generated setup: all 91 tests passed, including 14 server/database/authentication tests; lint, TypeScript/question/SVG validation, and both production bundles passed. A web-tool attempt to reach the assigned app URL was inaccessible through that tool and established no live-service result.
