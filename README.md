# Reagent Roundup

Organic chemistry reagent practice for Cedarville University. **Stages 1 and 2 implemented.**

The React/TypeScript/Vite application includes the introduction, grouped category selection, and all 60 source questions with correct answers, seven distractors, explanations, hints, SMILES, source references, and 120 pre-generated RDKit SVGs. **57 questions are prepared; questions 35–37 are held for instructor review.** Prepared means transcribed and checked, not instructor-approved.

Interactive practice belongs to Stage 3. Start Now remains disabled while selection shows available question counts. Saving/results belong to Stage 4. No backend, student-data transmission, authentication integration, or cross-device saving is implemented.

## Development and verification

Use Node.js 24 and pnpm 11.25.0 (`npm install --global pnpm@11.25.0` if needed).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm validate
pnpm lint
pnpm test
pnpm build
pnpm preview
```

Open Vite's local URL. Select groups individually and in combination, use Select All/Clear All, and check keyboard Space activation. Expected available counts: Radical Halogenation **14**, Nucleophilic Substitution **29**, Elimination **14**, all groups **57**. There are 17 source elimination questions, including the 3 held questions. Selection resets on refresh until Stage 4.

`validate` runs TypeScript and database checks; `validate:questions` checks just the bank. Tests cover group filtering, schema failures, source revisions, 120 SVG checksums, static assets, stereochemistry metadata, formula characters, and review exclusion. Validation cannot establish experimental feasibility or regioselectivity; instructor judgment remains necessary.

## Reaction groups

- **Radical Halogenation:** radical chlorination, radical bromination using Br₂, radical bromination using NBS.
- **Nucleophilic Substitution:** SN1 with water/alcohol, SN2, alcohols to bromides using HBr, alcohols to chlorides using HCl/ZnCl₂.
- **Elimination:** E1 with water/alcohol, E2 Zaitsev, E2 Hofmann, alcohol dehydration.

Each group selects all its category IDs. Categories remain separate from questions. New categories need catalog and group entries in `src/data/categories.ts`.

## Project structure

- `src/data/categories.ts`: category catalog and group memberships.
- `src/types/question.ts`: schema, provenance, and review metadata.
- `src/data/question-bank.json`: generated bank containing all 60 source records.
- `src/data/questions.ts`: exports full `questionBank`; filters held records out of available `questions`.
- `public/structures/`: 120 SVGs; no chemical drawing library ships to students.
- `src/lib/validateQuestions.ts`: reusable validation for JSON and future editors.
- `tools/validate-questions.mjs`: data and actual SVG file validation in CI.
- `tools/source-evidence.json`: position-aware raw source answer evidence.
- `tools/structure-transcriptions.json`: manually checked SMILES and accessible descriptions.
- `tools/prepare_questions.py`: typography normalization, explanations, review flags, data/SVG generation.
- `tools/structure-manifest.json`: RDKit version, molecular formulas, stereochemistry, SVG hashes.
- `docs/instructor-review.md`: held questions, advisories, source fingerprint, and review process.
- `docs/instructor-review.html`: visual source/SVG comparison, answer sets, explanations, and notes.
- `docs/source-structures/`: final visible PDF crops, including revised/overlaid structures.

## Instructor review

Open `docs/instructor-review-standalone.html` (or `docs/instructor-review.html`) in a browser. All 240 source/prepared structure previews are embedded PNGs, so the file can be moved or shared on its own. Compare each source drawing with the rendered SVG preview and review the answers, distractors, explanation, and hint. The application retains vector SVG assets. These docs are local/repository material; Vite does not deploy the docs directory.

Questions 35–37 retain DIPEA, diisopropylamine, and 2,6-lutidine respectively. Their stated elimination conditions need confirmation; question 37's revised substrate also has only one beta-carbon position, so its Hofmann classification needs review. No reagent has been replaced based on a mechanism assumption. Additional notes address radical regioisomers, heated solvolysis competition, E/Z intent, omitted counterions, and rearrangement.

Record instructor decisions in the preparation inputs and report, regenerate, and run all checks. A held question needs its issues resolved and status changed to prepared in the generator before inclusion. Do not silently remove flags or edit only generated outputs.

## Adding or changing questions

The supplied `Organic_Reaction_Reagents_60_Problems.pdf` is authoritative. SMILES were transcribed from final visible drawings, not inferred from the answer key. Reagent identities/conditions are retained; typography is normalized to Unicode subscripts/superscripts (Br₂, ZnCl₂, H₃O⁺), Δ, and hν. Questions 51–60 use SN2. Questions 30, 32, 40 retain E + Z labels; 59–60 show inversion. See the report for details.

Update `tools/structure-transcriptions.json`, `tools/source-evidence.json`, and the relevant explanation/review metadata in `tools/prepare_questions.py`. The current generator intentionally asserts 60 records to detect omissions. For future expansion, deliberately extend its count/category mapping or add separate instructor-authored records without renumbering source questions.

Each question requires a unique ID, category ID, reactant/product (SMILES, SVG path, meaningful alt text), one correctAnswer string, seven distinct distractors, explanation, hint, document/problem/page reference, and review status/issues/notes. Stereochemistry is optional when unspecified. See actual record `pdf-59` for a stereochemical example and `pdf-53` for a charged product.

SVG references are relative to public/, such as `structures/pdf-01-reactant.svg`. Future UI must use `import.meta.env.BASE_URL + question.reactant.svgPath` to support repository subdirectories. Display the SVG molecular drawing; names in alt text provide accessibility and never replace the drawing.

Preparation uses Python 3.12 and `tools/requirements.txt`; these libraries are not browser or CI dependencies. Create and activate a local virtual environment, then:

```sh
python -m pip install -r tools/requirements.txt
python tools/inspect_source.py /path/to/Organic_Reaction_Reagents_60_Problems.pdf
# Compare tmp/pdfs/extracted.json with tools/source-evidence.json before replacing evidence.
python tools/prepare_questions.py
python tools/review_questions.py /path/to/Organic_Reaction_Reagents_60_Problems.pdf
pnpm validate
pnpm lint
pnpm test
pnpm build
```

Extraction uses page positions and final rendered crops: revised PDF text/images may remain underneath overlays, so plain text extraction misorders revised answers. Inspect review material after meaningful edits. Temporary files and virtual environments are ignored by Git.

Validation checks unique IDs/source numbers, valid categories, both structures and alt descriptions, exactly seven distractors, eight nonduplicate answers, explanation/hint presence, positive source references, safe existing SVG paths, static SVG content, and consistent review states. All source records remain reviewable.

## GitHub Pages

The purple Stage 1 deployment succeeded and the site returned HTTP 200 before Stage 2 began. Stage 2 changes have not been published automatically.

1. Commit and push to main when ready.
2. GitHub Settings → Pages → Build and deployment → Source: GitHub Actions.
3. The workflow installs locked dependencies, validates TypeScript/data, lints, tests, builds, and deploys. Pull requests run checks without deployment. Manual runs can deploy main.
4. Published URL: [Reagent Roundup](https://drsekerak.github.io/ReagentRoundup/). This HTTPS link can be placed in CU Launch; it does not integrate account authentication.

Vite uses relative URLs (`base: './'`) for repository subdirectories. TypeScript 6.0.3 remains compatible with typescript-eslint; the lockfile ensures reproducible installs. Native config loading and threaded tests work in the restricted Windows environment.

Stage 3 (practice interaction) and Stage 4 (saving/scoring/results) require approval before implementation.
