import { describe, expect, it } from 'vitest';
import { filterQuestions } from './questions';
import type { ReactionQuestion } from '../types/question';
import { reactionCategories } from '../data/categories';
import { questions } from '../data/questions';

// Synthetic metadata fixtures only; never published as chemistry questions.
const fixtures = [
  { id: 'fixture-a', category: 'sn2' },
  { id: 'fixture-b', category: 'sn1' },
] as ReactionQuestion[];

describe('question foundation', () => {
  it('defines eleven unique category IDs', () => {
    expect(reactionCategories).toHaveLength(11);
    expect(new Set(reactionCategories.map(({ id }) => id)).size).toBe(11);
  });
  it('contains no fabricated production questions', () => expect(questions).toEqual([]));
  it('filters by any combination without mutating source data', () => {
    expect(filterQuestions(fixtures, [])).toEqual([]);
    expect(filterQuestions(fixtures, ['sn2']).map(({ id }) => id)).toEqual(['fixture-a']);
    expect(filterQuestions(fixtures, ['sn2', 'sn1'])).toEqual(fixtures);
    expect(fixtures).toHaveLength(2);
  });
});
