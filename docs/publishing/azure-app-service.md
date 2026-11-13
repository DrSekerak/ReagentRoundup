# Publish to Azure App Service

This imported Node.js 24 / Express app is prepared for CU Launch-managed Azure publishing.

Production deploys from `https://github.com/cu-app-portal-repos/reagentroundup`, available locally as the `portal` remote. Push production updates with `git push portal main`. Keep local `main` tracking `portal/main` so an ordinary `git push` uses the managed repository. The original `origin` remote is retained as a source mirror; CU Launch has not provisioned Azure credentials there.

The Azure workflow runs only in `cu-app-portal-repos/reagentroundup`. Validation still runs in both repositories. A deployment from the original repository fails at Azure login with missing `client-id`/`tenant-id`; copying application secrets or changing the app code does not resolve that routing error. Push the tested commit to the managed repository and verify its Azure workflow instead.

Push-to-deploy is enabled by default for new managed apps. After first publish, pushes to the managed repository’s default branch publish automatically. Select **Disable Auto-Deploy** on the app details page to use manual **Publish to Azure** instead; **Enable Auto-Deploy** restores automatic publishing. Existing apps retain their saved deployment mode.
