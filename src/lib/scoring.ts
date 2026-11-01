import { reactionCategories } from '../data/categories';
import { isComplete, type PracticeEntry, type PracticeSession } from './practice';

// Instructor-adjustable scoring; hints do not affect points.
export function scoreEntry(entry: PracticeEntry): number {
  return entry.correct ? Math.max(0, 4 - entry.attempts.length) : 0;
}
export function summarizeSession(session: PracticeSession) {
  const entries = session.entries;
  const correct = entries.filter(e => e.correct).length;
  return {
    total: entries.length, completed: entries.filter(isComplete).length,
    first: entries.filter(e => e.correct && e.attempts.length === 1).length,
    second: entries.filter(e => e.correct && e.attempts.length === 2).length,
    third: entries.filter(e => e.correct && e.attempts.length === 3).length,
    unsuccessful: entries.filter(e => !e.correct && isComplete(e)).length,
    hints: entries.filter(e => e.hintUsed).length,
    correct, percentage: entries.length ? correct / entries.length * 100 : 0,
    points: entries.reduce((total, entry) => total + scoreEntry(entry), 0), maximumPoints: entries.length * 3,
    categories: reactionCategories.map(category => {
      const attempted = entries.filter(e => e.question.category === category.id && e.attempts.length > 0);
      const correct = attempted.filter(e => e.correct).length;
      return { ...category, attempted: attempted.length, correct, percentage: attempted.length ? correct / attempted.length * 100 : null };
    }),
  };
}
