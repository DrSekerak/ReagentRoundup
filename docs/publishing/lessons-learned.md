# Publishing lessons and setup record

## November 2, 2026 — requested database and sign-in integration

- Confirmed the existing app folder and source origin. Added the managed `portal` remote without replacing origin, fetched it, and confirmed a clean fast-forward state.
- Retrieved the CU App Portal skill from the user's supplied download after plugin discovery and browser access could not supply it. The CU Launch plugin subsequently confirmed the managed repository is ready and first publication has not started.
- There is no `app-portal/deployment-manifest.json` or portal-generated Azure workflow yet. Do not invent those files. The requested service contract is PostgreSQL plus Cedarville Entra login. Align the portal-generated manifest to these choices when setup is explicitly requested.
- Implemented root Express hosting while retaining the React app, question bank and local browser persistence. Added Auth.js Entra login with the provisioned callback path and PostgreSQL migrations/account saves.
- Reviewed the existing GitHub Pages workflow and removed only its static publishing/artifact steps, retaining validation. Static Pages cannot enforce the selected server-side login. Any old Pages deployment still needs separate management if the owner wants it removed; it was not deleted here.
- Missing development commands can use the bundled workspace runtime. Package installation uses the existing pnpm store with command-scoped settings; no global package/cache configuration was changed.
- Live Entra and PostgreSQL checks remain pending provisioned settings. Do not claim the app is protected on a live service merely because local code passes checks.
- Verification passed: all 91 tests (including 14 server/database/authentication tests), lint, TypeScript/question/SVG validation, both production bundles, and a real production-server startup/health check with database and authentication settings absent. The old introduction assertion was updated to reflect explicit account transfer support; its focused rerun passed.
