import { describe, expect, it } from 'vitest';
import { createSession } from './practice';
import { scoreEntry, summarizeSession } from './scoring';
import { finishFixture } from '../test/sessions';

describe('scoring', () => {
  it('counts attempt distributions, eventual accuracy, hints, and 3/2/1/0 points', () => {
    const session = finishFixture();
    expect(session.entries.map(scoreEntry)).toEqual([3, 2, 1, 0]);
    const summary = summarizeSession(session);
    expect(summary).toMatchObject({ total: 4, completed: 4, first: 1, second: 1, third: 1, unsuccessful: 1, hints: 2, correct: 3, percentage: 75, points: 6, maximumPoints: 12 });
    expect(summary.categories.find(c => c.id === 'radical-chlorination')).toMatchObject({ attempted: 2, correct: 2, percentage: 100 });
    expect(summary.categories.find(c => c.id === 'radical-bromination-br2')).toMatchObject({ attempted: 2, correct: 1, percentage: 50 });
    expect(summary.categories.find(c => c.id === 'sn2')?.percentage).toBeNull();
    expect(scoreEntry({ ...session.entries[1], hintUsed: false })).toBe(2);
  });
  it('handles an empty session without invalid percentages', () => {
    expect(summarizeSession(createSession([]))).toMatchObject({ total: 0, completed: 0, percentage: 0, points: 0, maximumPoints: 0 });
  });
});
