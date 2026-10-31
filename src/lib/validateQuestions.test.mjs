/* global structuredClone */
import { resolve } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { validateQuestions } from './validateQuestions';
import { reactionCategories } from '../data/categories';

const bank = JSON.parse(readFileSync(resolve('src/data/question-bank.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve('tools/structure-manifest.json'), 'utf8'));
const paths = new Set(readdirSync(resolve('public/structures')).map(name => `structures/${name}`));
const categories = reactionCategories.map(({ id }) => id);
const check = (value) => validateQuestions(value, categories, paths);

describe('question database validation', () => {
  it('validates all sixty questions, with eight unique choices each', () => {
    expect(check(bank)).toEqual([]);
    expect(bank.map(q => q.source.problemNumber)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    for (const q of bank) expect(new Set([q.correctAnswer, ...q.distractors]).size).toBe(8);
  });
  it.each([
    ['invalid category', q => { q.category = 'unknown'; }],
    ['missing reactant structure', q => { delete q.reactant; }],
    ['missing product.smiles', q => { q.product.smiles = ''; }],
    ['missing product.alt', q => { q.product.alt = ''; }],
    ['SVG file', q => { q.product.svgPath = 'structures/missing.svg'; }],
    ['SVG file', q => { q.product.svgPath = '../outside.svg'; }],
    ['correctAnswer', q => { q.correctAnswer = []; }],
    ['multiple-answer', q => { q.correctAnswers = ['a', 'b']; }],
    ['seven', q => { q.distractors.pop(); }],
    ['seven', q => { q.distractors.push('extra'); }],
    ['duplicate answers', q => { q.distractors[0] = q.correctAnswer; }],
    ['duplicate answers', q => { q.distractors[1] = q.distractors[0]; }],
    ['missing explanation', q => { q.explanation = ''; }],
    ['missing hint', q => { delete q.hint; }],
    ['source reference', q => { q.source = {}; }],
    ['unresolved issues', q => { q.review.issues = ['Unresolved']; }],
    ['held question', q => { q.review.status = 'needs-review'; }],
  ])('rejects %s', (message, mutate) => {
    const q = structuredClone(bank[0]); mutate(q);
    expect(check([q]).join('\n')).toContain(message);
  });
  it('rejects duplicate IDs, duplicate source numbers, and invalid top-level inputs', () => {
    expect(check([bank[0], bank[0]]).join('\n')).toMatch(/duplicate ID/);
    expect(check([bank[0], { ...bank[0], id: 'other' }]).join('\n')).toMatch(/duplicate source/);
    expect(check(null)).toHaveLength(1);
    expect(check([null])).toHaveLength(1);
  });
  it('keeps additional questions in SN2 and preserves the modified source answers', () => {
    expect(bank.slice(50).every(q => q.category === 'sn2')).toBe(true);
    const expected = { 24:'NaOH', 26:'NaOCH₃', 29:'NaOH, Δ', 30:'NaOPr', 32:'NaOH, Δ', 34:'KOtBu', 35:'DIPEA', 36:'diisopropylamine', 37:'2,6-lutidine', 38:'conc. H₃PO₄, Δ', 46:'HCl, ZnCl₂', 51:'NaC≡CH', 53:'PPh₃', 55:'CH₃CH₂CO₂Na' };
    for (const [n, answer] of Object.entries(expected)) expect(bank[Number(n)-1].correctAnswer).toBe(answer);
    expect(bank[28].distractors).toContain('OsO₄, H₂O₂');
    expect(bank[37].distractors).toContain('H₃O⁺');
    expect(bank[23].distractors[0]).toBe('H₂O, Δ');
    expect(bank[25].distractors[0]).toBe('CH₃OH, Δ');
  });
});

describe('static molecular structure integrity', () => {
  it('has all 120 static SVGs matching the preparation manifest', () => {
    expect(manifest.structures).toHaveLength(120);
    for (const item of manifest.structures) {
      const q = bank.find(q => q.id === item.questionId);
      const svg = readFileSync(resolve('public', q[item.role].svgPath));
      expect(svg.toString()).not.toContain('\r'); // canonical LF on every platform
      expect(createHash('sha256').update(svg).digest('hex')).toBe(item.svgSha256);
      expect(svg.toString()).toContain('<title>');
      expect(svg.toString()).toContain('viewBox=');
      expect(svg.toString()).not.toMatch(/<script|<foreignObject|href=['"]https?:/i);
      expect(q[item.role].smiles).toBe(item.smiles);
    }
  });
  it('retains inversion, E/Z annotations, charges and multiple bonds', () => {
    for (const id of ['pdf-59','pdf-60']) {
      const pair = manifest.structures.filter(s => s.questionId === id);
      expect(pair[0].chiralCenters[0][1]).toBe('S');
      expect(pair[1].chiralCenters[0][1]).toBe('R');
      const q = bank.find(q => q.id === id);
      const start = readFileSync(resolve('public', q.reactant.svgPath),'utf8');
      const end = readFileSync(resolve('public', q.product.svgPath),'utf8');
      expect(start.match(/class='bond-0 /g).length).toBeGreaterThan(3); // hashed bond
      expect(end).toContain('fill:#000000'); // solid wedge
    }
    for (const n of [30,32,40]) expect(bank[n-1].stereochemistry).toContain('E + Z');
    expect(manifest.structures.find(s => s.questionId === 'pdf-33' && s.role === 'product').doubleBondStereo).toContain('STEREOZ');
    expect(bank[52].product.smiles).toContain('[P+]');
    expect(bank[53].product.smiles).toContain('[N+]');
    expect(bank[56].product.smiles).toContain('[N-]');
    expect(bank[50].product.smiles).toContain('#');
    expect(bank[55].product.smiles).toContain('#N');
  });
});
