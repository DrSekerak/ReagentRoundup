# Stage 2 instructor review

60 questions transcribed; 120 RDKit SVGs generated. **57 prepared, 3 held.** Prepared does not mean instructor-approved. The original answer key and seven distractors are retained for every record; only chemical typography is normalized.

## Held questions (excluded from available practice count)

- **pdf-35, PDF page 12:** Confirm that DIPEA with the secondary chloride gives the intended terminal alkene under the intended conditions; no solvent or temperature is supplied. Preserve the instructor answer pending review.
- **pdf-36, PDF page 12:** Confirm diisopropylamine (the neutral amine, not an amide anion) and the required conditions for elimination of the secondary iodide to hex-1-ene. Do not silently replace this reagent.
- **pdf-37, PDF page 13:** Confirm 2,6-lutidine and the intended conditions for elimination of the revised primary bromide. The visible revised substrate has only one beta-carbon position, so a Hofmann-versus-Zaitsev choice is not illustrated.

## Additional instructor notes

- **pdf-02, PDF page 1:** Chlorination can give regioisomeric products; the source specifies the displayed transformation, not an exclusive product.
- **pdf-03, PDF page 1:** Chlorination can give regioisomeric products; do not describe the tertiary chloride as the sole product.
- **pdf-11, PDF page 4:** Allylic radical resonance can give other regioisomers; the depicted product is the instructor-selected transformation.
- **pdf-12, PDF page 4:** Allylic radical resonance can give other regioisomers; retain the source product.
- **pdf-15, PDF page 5:** Heated solvolysis can compete with E1; instructor-selected substitution answer retained.
- **pdf-16, PDF page 6:** Heated solvolysis can compete with E1; instructor-selected substitution answer retained.
- **pdf-17, PDF page 6:** Heated solvolysis can compete with E1; instructor-selected substitution answer retained.
- **pdf-18, PDF page 6:** Heated solvolysis can compete with E1; instructor-selected substitution answer retained.
- **pdf-19, PDF page 7:** Heated solvolysis can compete with E1; instructor-selected substitution answer retained.
- **pdf-29, PDF page 10:** Source draws E-but-2-ene without an E + Z label; preserve that drawing without claiming exclusive E selectivity.
- **pdf-30, PDF page 10:** Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.
- **pdf-32, PDF page 11:** Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.
- **pdf-33, PDF page 11:** Source draws Z-3-methylpent-2-ene without an E + Z label. Confirm whether one stereoisomer or a mixture is intended; the drawn Z structure is retained.
- **pdf-40, PDF page 14:** Source explicitly says E + Z; SVG shows a representative E structure with E + Z annotation.
- **pdf-45, PDF page 15:** Source shows direct replacement in cyclohexylmethanol; retain this intended structure without asserting absence of rearrangement under all conditions.
- **pdf-53, PDF page 18:** Phosphonium positive charge retained; bromide counterion is omitted in the source structure and remains omitted.
- **pdf-54, PDF page 19:** Ammonium positive charge retained; bromide counterion is omitted in the source structure and remains omitted.

## Checks and provenance

- All 60 starting materials/products were visually inspected from final visible PDF crops and transcribed to SMILES. Page 13 includes a revised image over an older image; question 37 uses the visible primary bromide.
- Questions 30, 32, 40 retain the explicit E + Z label. Questions 29 and 33 retain the E and Z structures respectively as drawn, without asserting exclusive selectivity.
- Questions 59–60 retain S → R inversion. RDKit checks both stereocenters and generates hashed reactant bonds and solid product wedges. The absolute labels follow the source geometry; inversion is not inferred solely from a change in SMILES @ notation.
- Formal charges on phosphonium/ammonium/azide products, alkynes and nitrile triple bonds are preserved. No counterions are added where omitted by the source.
- Rendered SVGs are inspected alongside source crops. Reorientation by RDKit is expected; molecular connectivity, charges and configuration govern equivalence.
- Review decisions above are preparation judgments, not alterations to the instructor key. Validate intended conditions for the held items rather than replacing their answers automatically.

Background references supporting review criteria: [OpenStax E2](https://openstax.org/books/organic-chemistry/pages/11-8-the-e2-reaction-and-the-deuterium-isotope-effect), [OpenStax SN2](https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction). These references inform flags; the supplied PDF remains the authoritative question source.

## Instructor workflow

Open `instructor-review.html` in a browser to compare each source structure with its SVG and inspect the answer set. Resolve held issues in `tools/prepare_questions.py` with instructor-approved changes, update the transcriptions if necessary, regenerate data and SVGs, run all checks, and record the decision here. Do not change only the generated JSON or the next regeneration will overwrite the correction. Additional notes do not automatically exclude an otherwise faithful source question.

Source PDF SHA-256: `f2b0e92d81c0008f5eb48bc28d0cfade1dd5668e5ef0e7d1194f999b9269d774`.
