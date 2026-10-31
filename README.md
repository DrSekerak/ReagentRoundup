# Reagent Roundup

Organic chemistry reagent practice for Cedarville University. **Stage 1: Foundation only.**

Includes a React/TypeScript/Vite application, all eleven reaction categories, typed question schema, responsive introduction, category checkboxes, Select All/Clear All, question filtering and counts, and a GitHub Pages workflow.

The production question bank is intentionally empty. The source PDF has been supplied for future Stage 2 work and has not been transcribed. Start Now remains disabled even after category selection because no questions are available and the practice flow belongs to Stage 3. The foundation notice distinguishes the requested introductory instructions from future functionality. Saving and results belong to Stage 4; selections reset on refresh in this stage.

## Local development

Use Node.js 24 and pnpm 11.25.0. Install pnpm if needed with `npm install --global pnpm@11.25.0`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. To check this stage:

```sh
pnpm validate
pnpm lint
pnpm test
pnpm build
pnpm preview
```

Manually select individual categories, verify the mixed Select All state, select all eleven, and clear the selection. Check the selection count, keyboard Space activation, visible focus, and narrow mobile layout. Zero questions and disabled Start Now are expected.

## Project structure

- `src/data/categories.ts`: stable category IDs and display labels.
- `src/types/question.ts`: question and molecular-structure schema.
- `src/data/questions.ts`: separate, currently empty question database.
- `src/lib/questions.ts`: category filtering, independent of UI.
- `src/App.tsx`, `src/styles.css`: introduction and selection UI.
- `src/test/`: shared test setup; tests also live alongside modules.
- `.github/workflows/deploy.yml`: validation, lint, tests, build, deployment.

## Adding questions in Stage 2

Transcribe the authoritative instructor PDF; do not invent structures, reagents, or distractors. Keep ambiguous items out of the published bank and record them in an instructor-review file. Questions 51–60 use category `sn2`.

Each `ReactionQuestion` needs a unique ID, category ID, reactant and product (each with SMILES, SVG path, and meaningful structure alt text), correct answer, exactly seven distinct distractors, a specific explanation, hint, source problem number/document, and optional stereochemistry information. The tuple enforces the distractor count at compile time; runtime chemistry/data validation is future Stage 2 work.

Example field layout (placeholders only, not a publishable question):

```ts
const reviewedQuestion: ReactionQuestion = {
  id: 'pdf-01',
  category: 'sn2', // use the category actually verified from the source
  reactant: { smiles: '<verified SMILES>', svgPath: 'structures/q01-reactant.svg', alt: '<structure description>' },
  product: { smiles: '<verified SMILES>', svgPath: 'structures/q01-product.svg', alt: '<structure description>' },
  correctAnswer: '<exact instructor answer>',
  distractors: ['<1>', '<2>', '<3>', '<4>', '<5>', '<6>', '<7>'],
  explanation: '<instructor-reviewed explanation specific to this question>',
  hint: '<reaction type without the exact reagents>',
  source: { problemNumber: 1, document: '<source PDF filename>' },
};
```

Generate SVGs with a reliable chemistry renderer during preparation, verify wedges/dashes, charges, E/Z and SN2 inversion against the PDF, and put assets under `public/structures/`. SVG paths omit `public/` and leading slashes. Future UI must prefix paths with `import.meta.env.BASE_URL`. Use Unicode subscripts and superscripts (Br₂, ZnCl₂), Δ, and hν in plain text reagent labels. After review, add the record to `questions`; category counts automatically update. A new category needs only an entry in the category catalog. Do not enable practice until Stage 3 is implemented.

## GitHub Pages

1. Push these files to the repository's `main` branch.
2. In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. The workflow installs locked dependencies, validates TypeScript, lints, tests, builds, and deploys. Pull requests run checks without deploying. A manual workflow run also supports deployment from main.
4. Use the HTTPS URL reported by the deployment for a CU Launch link. The expected project URL is `https://drsekerak.github.io/ReagentRoundup/` once deployed.

Vite uses relative asset URLs (`base: './'`) to support repository subdirectories. This stage has no router, backend, authentication, student-data transmission, or external fonts. No deployment has been performed merely by creating the workflow. GitHub Pages must be enabled in repository settings.

## Next stages

Stage 2: authoritative question transcription, SVG preparation, data validation, and instructor review. Stage 3: practice interaction. Stage 4: browser persistence, scoring, and results. Stage 5: complete integration, chemistry rendering checks, and deployment verification. Stage 1 tests cover only the implemented foundation.

## Verification status

TypeScript validation, lint, six automated tests, and the production Vite build passed locally. Native config loading and threaded test workers support the restricted Windows environment without spawning helper processes.

TypeScript is pinned to 6.0.3, within typescript-eslint's supported range (`>=4.8.4 <6.1.0`). This resolves the previous TypeScript 7 API incompatibility without replacing the linter or bypassing checks. The lockfile records the compatible dependencies. No deployment or browser visual verification has been completed.
