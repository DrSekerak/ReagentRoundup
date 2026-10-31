import { describe, expect, it } from 'vitest';
import { filterQuestions } from './questions';
import type { ReactionQuestion } from '../types/question';
import { reactionCategories, reactionGroups } from '../data/categories';
import { questionBank, questions } from '../data/questions';

// Synthetic metadata fixtures only; never published as chemistry questions.
const fixtures = [
  { id: 'fixture-a', category: 'sn2' },
  { id: 'fixture-b', category: 'sn1' },
] as ReactionQuestion[];

describe('question foundation', () => {
  it('groups all eleven categories exactly once with the requested memberships', () => {
    expect(reactionGroups.map(({ categories }) => [...categories])).toEqual([
      ['radical-chlorination', 'radical-bromination-br2', 'radical-bromination-nbs'],
      ['sn1', 'sn2', 'alcohol-hbr', 'alcohol-hcl-zncl2'],
      ['e1', 'e2-zaitsev', 'e2-hofmann', 'alcohol-dehydration'],
    ]);
    const grouped = reactionGroups.flatMap(({ categories }) => [...categories]);
    expect([...grouped].sort()).toEqual(reactionCategories.map(({ id }) => id).sort());
  });
  it('defines eleven unique category IDs', () => {
    expect(reactionCategories).toHaveLength(11);
    expect(new Set(reactionCategories.map(({ id }) => id)).size).toBe(11);
  });
  it('retains all sixty source questions and excludes held questions from practice', () => {
    expect(questionBank).toHaveLength(60);
    expect(questions).toHaveLength(57);
    expect(questionBank.filter(({ review }) => review.status === 'needs-review').map(({ id }) => id)).toEqual(['pdf-35', 'pdf-36', 'pdf-37']);
    expect(questions.every(({ review }) => review.status === 'prepared')).toBe(true);
  });
  it('counts the prepared bank correctly for each reaction group', () => {
    expect(reactionGroups.map(({ categories }) => filterQuestions(questions, categories).length)).toEqual([14, 29, 14]);
    expect(filterQuestions(questions, reactionCategories.map(({ id }) => id))).toHaveLength(57);
  });
  it('filters by any combination without mutating source data', () => {
    expect(filterQuestions(fixtures, [])).toEqual([]);
    expect(filterQuestions(fixtures, ['sn2']).map(({ id }) => id)).toEqual(['fixture-a']);
    expect(filterQuestions(fixtures, ['sn2', 'sn1'])).toEqual(fixtures);
    expect(fixtures).toHaveLength(2);
  });
});
