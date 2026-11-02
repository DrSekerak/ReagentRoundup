# Reagent Roundup

Organic chemistry reagent practice for Cedarville University. **Stages 1–4 implemented.**

The React/TypeScript/Vite application includes the introduction, grouped category selection, and all 60 source questions with correct answers, seven distractors, explanations, hints, SMILES, source references, and 120 pre-generated RDKit SVGs. **All 60 questions are available. Questions 35–37 were approved as supplied by the instructor on October 31, 2026.** Prepared means transcribed and checked, not instructor-approved.

Stage 3 practice is interactive: Start Now creates a shuffled session containing the chosen number of questions from the selected groups, with eight independently shuffled answer choices. Stage 4 saves progress automatically and provides scoring, category summaries, and detailed reviews. An Express server now requires Cedarville Microsoft Entra sign-in and offers explicit PostgreSQL account saves alongside the existing browser storage.

## Development and verification

Use Node.js 24 and npm. The Codex bundled workspace runtimes are supported. See [server setup](docs/server-services.md) for the environment-variable names. CU Launch supplies production values; do not paste secrets into chat or commit populated environment files. `npm run dev`, `npm start`, and `npm run preview` all run the protected Express server. Running Vite directly bypasses the server and is unsuitable for publishing.

```sh
npm install
npm run dev
npm run validate
npm run lint
npm test
npm run build
npm run preview
```

Open Vite's local URL. Select groups individually and in combination, use Select All/Clear All, and check keyboard Space activation. Expected available counts: Radical Halogenation **14**, Nucleophilic Substitution **29**, Elimination **17**, all groups **60**. No questions are currently held. Selections, session length, and practice progress are restored in the same browser/profile after refresh.

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

Questions 35–37 retain DIPEA, diisopropylamine, and 2,6-lutidine respectively. The instructor approved these questions as supplied on October 31, 2026, including their source classifications. Previous concerns are retained as resolved history in review.approval.previousIssues, with the approval recorded in tools/instructor-approvals.json. No reagent has been replaced based on a mechanism assumption. Additional notes address radical regioisomers, heated solvolysis competition, E/Z intent, omitted counterions, and rearrangement.

Record instructor decisions in tools/instructor-approvals.json and the preparation inputs/report, regenerate, and run all checks. The current approvals are applied by tools/apply_instructor_approval.py, which is also used by the question generator. A held question needs its issues resolved and status changed to prepared in the generator before inclusion. Do not silently remove flags or edit only generated outputs.

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
npm run validate
npm run lint
npm test
npm run build
```

Extraction uses page positions and final rendered crops: revised PDF text/images may remain underneath overlays, so plain text extraction misorders revised answers. Inspect review material after meaningful edits. Temporary files and virtual environments are ignored by Git.

Validation checks unique IDs/source numbers, valid categories, both structures and alt descriptions, exactly seven distractors, eight nonduplicate answers, explanation/hint presence, positive source references, safe existing SVG paths, static SVG content, and consistent review states. All source records remain reviewable.

## Managed server hosting

The supported source of truth is `https://github.com/cu-app-portal-repos/reagentroundup`, with the original source remote preserved. The existing workflow now validates TypeScript/data, lint, tests and both production bundles. Its GitHub Pages deployment step was removed because static hosting cannot enforce the requested sign-in or run PostgreSQL access.

CU Launch manages hosting and production settings. Build with `npm run build` and run with `npm start`; use the root Express application rather than serving `dist` directly. No deployment manifest or Azure publishing workflow has been created locally. Portal-generated publishing files must be reviewed when available. Any previously deployed GitHub Pages copy is a separate historical site; this change does not remove it or make it private.

## Stage 3 practice

Select one or more groups, then choose 5, 10, 15, 20, or All available (the default). Numbers above the available count are disabled and gray. If changing groups makes the selected number unavailable, selection returns to All available. Start Now samples the requested number from the entire shuffled eligible pool without repeats. Question order and each answer order are shuffled once at session creation and remain fixed while that session is open.

Drag a reagent choice by its dotted handle onto the reaction arrow. The arrow highlights during a valid hover; dropping outside it or cancelling a drag does not submit. Mouse dragging uses a movement threshold; touch dragging uses a short hold on the handle, leaving the rest of the page available for scrolling. Alternatively, select a reagent with mouse, touch, or keyboard Space/Enter and activate Submit Selected Answer. Both paths share the same state transition logic.

Each question allows three attempts. Wrong answers become disabled. After a mistake, Show Hint is optional, costs no attempt, and stays visible once requested. A correct answer or the third mistake locks the question and reveals the answer, reaction category, and explanation. Category names remain hidden beforehand except in requested hints. Next Question moves forward; Finish Practice opens the scored session summary. Returning to the introduction keeps unfinished progress; replacing it through Start New Session or Start Now requires confirmation.

Progress is saved to localStorage in the current browser and browser profile. Refreshing or reopening the page offers Resume Previous Session; completed sessions offer Review Previous Results. Save to account and Load from account explicitly transfer a copy to or from PostgreSQL using the verified Cedarville session. No account data is fetched or uploaded automatically.

Implementation: `src/lib/practice.ts` owns immutable session creation, shuffling, and guarded transitions; `src/components/Practice.tsx` owns question display and dnd-kit interaction. Structure paths use Vite's base URL for GitHub Pages subdirectories.

Manual checks: select a group and start; drag a wrong answer onto the arrow; drop another outside the target and verify attempts do not change; request a hint; submit a correct answer through the keyboard alternative; verify locking and next-question focus. Try three distinct wrong answers to verify delayed answer revelation, and return to the introduction, then start a new session to test replacement confirmation. Desktop/tablet/phone layouts and real mouse drops were checked in the in-app browser. A physical touchscreen still needs device testing.

The instructor-approved source questions, answer sets, and molecular SVGs are unchanged by the server integration.

## Stage 4 progress and results

`src/lib/progress.ts` defines a storage repository interface and its localStorage implementation. The versioned key is `reagent-roundup.progress.v1`. Stored data includes selected groups and categories, chosen session length, question IDs/order, content revisions, shuffled answer order, current question, submitted answers, attempts used, hint use, correctness, correct-attempt number, completed count, and completion status. Restored IDs are rebound to current authoritative bank records; serialized copies are never used as question definitions.

On refresh or return, the introduction offers Resume Previous Session and Start New Session for unfinished practice. Returning to the introduction does not discard progress. Both Start New Session and starting fresh through Start Now require confirmation when unfinished work exists. Cancelling preserves the saved session. Starting another practice session after completion returns to category selection; saved results remain reviewable until replaced.

Restoration validates storage version, category/group IDs, unique question IDs, question content revisions, eight unique answer choices, valid attempts, hints, counters, and navigation consistency. Changed/missing questions or malformed data produce a notice and preserve the original stored value until replacement is explicitly confirmed. Blocked storage and quota failures show a warning while allowing practice to continue in memory. Automatic saving applies only to the same browser, browser profile, and site origin; clearing browser data removes that local copy. Explicit account saving transmits practice progress to the protected server, associated with an immutable tenant/object identifier. The same validation runs on the server before storing it. Account saves are personal practice records, not authoritative grades. See [server services](docs/server-services.md) for data and verification boundaries.

`src/lib/scoring.ts` contains the instructor-adjustable 3/2/1/0 point model and summaries. Hints never reduce points. Completed results include first/second/third-attempt counts, unsuccessful questions, hints used, eventual accuracy, points out of maximum, and all eleven categories with attempted/correct/percentage columns. Unattempted categories display a dash for percentage. Review Results reveals the optional table of correct and submitted answers, attempts, hints, and final outcome. Category information remains hidden during active questions except in requested hints and completed explanations.

Stage 4 checks: start five questions, submit a wrong answer and request a hint, refresh, resume, and verify identical question/answer order, remaining attempts, and disabled wrong answer. Return to the introduction and cancel replacement to confirm nothing is discarded. Finish practice, check point totals and category rows, expand Review Results, then refresh and reopen the previous results. Automated tests cover these flows plus damaged/obsolete saves, inaccessible/full storage, completion invariants, all scoring outcomes, and zero-denominator summaries. Browser testing verified refresh/resume and a complete five-question session with one hint: four first-attempt answers and one second-attempt answer yielded 100.0% eventual accuracy and 14/15 points.
