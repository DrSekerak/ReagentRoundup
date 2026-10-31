/* global console, process, URL */
import { readFileSync, readdirSync } from 'node:fs';
import { validateQuestions } from '../src/lib/validateQuestions.ts';
import { reactionCategories } from '../src/data/categories.ts';

const bank = JSON.parse(readFileSync(new URL('../src/data/question-bank.json', import.meta.url), 'utf8'));
const dir = new URL('../public/structures/', import.meta.url);
const paths = new Set(readdirSync(dir).map((name) => `structures/${name}`));
const errors = validateQuestions(bank, reactionCategories.map(({ id }) => id), paths);
for (const question of bank) for (const role of ['reactant','product']) {
  const path = question[role]?.svgPath;
  if (!paths.has(path)) continue;
  const svg = readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8');
  if (!svg.includes('<svg') || !svg.includes('viewBox=') || !svg.includes('<path') || /<script|<foreignObject|(?:href|src)=['"]https?:/i.test(svg)) errors.push(`${question.id}: invalid or non-static ${role} SVG`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Validated ${bank.length} questions, ${paths.size} SVGs; ${bank.filter(q => q.review.status === 'needs-review').length} held for instructor review.`);
