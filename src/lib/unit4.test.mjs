/* global structuredClone */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { questionBank, questions } from '../data/questions';
import { alkeneSection, reactionGroups, reactionCategories } from '../data/categories';
import { validateQuestions } from './validateQuestions';
import { createSession, transition } from './practice';
import { decodeProgress, encodeProgress } from './progress';
import { summarizeSession } from './scoring';
import manifest from '../../tools/unit4-structure-manifest.json';
import evidence from '../../tools/unit4-source-evidence.json';

const bank = questions.filter(q => q.source.document === evidence.document);
const paths = new Set(readdirSync(resolve('public/structures')).map(name => `structures/${name}`));
const categories = reactionCategories.map(c => c.id);

describe('Unit 4 source integration', () => {
  it('validates both sources together, allowing overlapping source numbers', () => {
    expect(validateQuestions(questionBank, categories, paths)).toEqual([]);
    expect(bank).toHaveLength(80);
    expect(bank.map(q => q.source.problemNumber)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    for (const row of evidence.questions) {
      const q = bank[row.number - 1];
      expect(q.correctAnswer).toBe(row.correct);
      expect(q.distractors).toEqual(row.distractors);
      expect(q.source.page).toBe(Math.ceil(row.number / 2));
    }
    const clone = structuredClone(bank[0]);
    clone.id = 'duplicate-source';
    expect(validateQuestions([bank[0], clone], categories, paths).join()).toContain('duplicate source');
  });

  it('preserves all source diagrams and their checked crop provenance', () => {
    expect(manifest.structures).toHaveLength(160);
    expect(manifest.sourceSha256).toBe(evidence.sha256);
    for (const item of manifest.structures) {
      const q = bank.find(q => q.id === item.questionId);
      const structure = item.role === 'reactant' ? q.reactant : q.product;
      const svg = readFileSync(resolve('public', structure.svgPath));
      expect(createHash('sha256').update(svg).digest('hex')).toBe(item.svgSha256);
      expect(svg.toString()).toContain('<title>');
      expect(svg.toString()).toContain('viewBox="0 0 290 80"');
      expect(svg.toString()).not.toMatch(/<script|<foreignObject|(?:href|src)=['"]https?:/i);
      expect(structure.sourceDepiction).toEqual({ document: evidence.document, page: q.source.page, region: item.region });
    }
  });

  it('rejects missing or mismatched source depictions', () => {
    const q = structuredClone(bank[0]);
    delete q.product.sourceDepiction;
    expect(validateQuestions([q], categories, paths).join()).toContain('missing product.smiles or sourceDepiction');
    q.product.sourceDepiction = { document: 'other.pdf', page: 1, region: [0, 1, 0, 1] };
    expect(validateQuestions([q], categories, paths).join()).toContain('invalid product.sourceDepiction');
  });

  it('round-trips new group selections and a partially answered Unit 4 session', () => {
    const selectedGroups = reactionGroups.filter(g => alkeneSection.groups.includes(g.id)).map(g => g.id);
    let session = createSession(bank, () => 0.5, 5);
    session = transition(session, { type: 'submit', questionId: session.entries[0].question.id, answer: session.entries[0].question.distractors[0] });
    const progress = { selectedGroups, questionCount: 5, session };
    expect(decodeProgress(encodeProgress(progress), questions)).toEqual(progress);
    expect(summarizeSession(session).total).toBe(5);
  });
});
