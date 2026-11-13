/** Runtime validation for hand-edited JSON and future instructor editors. */
export function validateQuestions(
  input: unknown,
  categories: readonly string[],
  structurePaths: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(input)) return ['Question bank must be an array.'];
  const ids = new Set<string>();
  const numbers = new Set<string>();
  const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
  const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  for (const [index, item] of input.entries()) {
    const prefix = `Question ${index + 1}`;
    const fail = (message: string) => errors.push(`${prefix}: ${message}`);
    if (!record(item)) { fail('must be an object'); continue; }
    if (!isText(item.id)) fail('missing ID');
    else if (ids.has(item.id)) fail('duplicate ID');
    else ids.add(item.id);
    if (!isText(item.category) || !categories.includes(item.category)) fail('invalid category');
    for (const role of ['reactant', 'product']) {
      const structure = item[role];
      if (!record(structure)) { fail(`missing ${role} structure`); continue; }
      for (const field of ['alt', 'svgPath']) if (!isText(structure[field])) fail(`missing ${role}.${field}`);
      const depiction = structure.sourceDepiction;
      if (!isText(structure.smiles) && !record(depiction)) fail(`missing ${role}.smiles or sourceDepiction`);
      if (depiction !== undefined && (!record(depiction) || !record(item.source) || depiction.document !== item.source.document || depiction.page !== item.source.page ||
          !Array.isArray(depiction.region) || depiction.region.length !== 4 || !depiction.region.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0) ||
          depiction.region[2] <= depiction.region[0] || depiction.region[3] <= depiction.region[1])) fail(`invalid ${role}.sourceDepiction`);
      const path = structure.svgPath;
      if (typeof path === 'string' && (!/^structures\/[a-zA-Z0-9_-]+\.svg$/.test(path) || !structurePaths.has(path))) fail(`invalid or missing ${role} SVG file`);
    }
    if (!isText(item.correctAnswer)) fail('exactly one nonempty correctAnswer string is required');
    if ('correctAnswers' in item) fail('multiple-answer field is not supported');
    if (!Array.isArray(item.distractors) || item.distractors.length !== 7 || !item.distractors.every(isText)) fail('exactly seven nonempty distractors required');
    else {
      const answers = [item.correctAnswer, ...item.distractors];
      const keys = answers.map((a) => typeof a === 'string' ? a.normalize('NFKC').replace(/\s+/g, '').toLowerCase() : '');
      if (new Set(keys).size !== 8) fail('duplicate answers');
    }
    for (const field of ['explanation', 'hint']) if (!isText(item[field])) fail(`missing ${field}`);
    if (!record(item.source) || !isText(item.source.document) || !Number.isInteger(item.source.problemNumber) || !Number.isInteger(item.source.page)) fail('invalid source reference');
    else {
      const n = item.source.problemNumber as number;
      if (n < 1 || (item.source.page as number) < 1) fail('source numbers must be positive');
      const key = `${item.source.document}:${n}`;
      if (numbers.has(key)) fail('duplicate source problem number');
      numbers.add(key);
      if (item.source.document === 'Organic_Reaction_Reagents_60_Problems.pdf' && n >= 51 && n <= 60 && item.category !== 'sn2') fail('source questions 51–60 must use SN2');
    }
    const review = item.review;
    if (!record(review) || !['prepared', 'needs-review'].includes(String(review.status)) || !Array.isArray(review.issues) || !review.issues.every(isText) || !Array.isArray(review.notes) || !review.notes.every(isText)) fail('invalid review metadata');
    else {
      if (review.status === 'needs-review' && review.issues.length === 0) fail('held question must include an issue');
      if (review.status === 'prepared' && review.issues.length > 0) fail('unresolved issues cannot be marked prepared');
    }
  }
  return errors;
}
