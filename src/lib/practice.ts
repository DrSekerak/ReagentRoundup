import type { ReactionQuestion } from '../types/question';
import type { ReactionCategory } from '../data/categories';

export interface PracticeEntry {
  question: ReactionQuestion;
  choices: string[];
  attempts: string[];
  hintUsed: boolean;
  correct: boolean;
}
export interface PracticeSession { entries: PracticeEntry[]; currentIndex: number; categories: ReactionCategory[] }
export function sessionFinished(session: PracticeSession): boolean { return session.currentIndex === session.entries.length; }
export type PracticeAction =
  | { type: 'submit'; questionId: string; answer: string }
  | { type: 'hint'; questionId: string }
  | { type: 'next'; questionId: string };

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createSession(questions: readonly ReactionQuestion[], random = Math.random, count = questions.length): PracticeSession {
  if (!Number.isInteger(count) || count < 0 || count > questions.length) throw new RangeError('Session length must be an integer within the available question count.');
  return {
    currentIndex: 0,
    categories: [...new Set(questions.map(question => question.category))],
    entries: shuffle(questions, random).slice(0, count).map(question => ({
      question, choices: shuffle([question.correctAnswer, ...question.distractors], random),
      attempts: [], hintUsed: false, correct: false,
    })),
  };
}
export function isComplete(entry: PracticeEntry): boolean { return entry.correct || entry.attempts.length >= 3; }

/** Both drop and accessible submission use this transition; stale/duplicate events are ignored. */
export function transition(session: PracticeSession, action: PracticeAction): PracticeSession {
  const entry = session.entries[session.currentIndex];
  if (!entry || action.questionId !== entry.question.id) return session;
  if (action.type === 'next') return isComplete(entry) ? { ...session, currentIndex: session.currentIndex + 1 } : session;
  if (isComplete(entry)) return session;
  let updated: PracticeEntry;
  if (action.type === 'hint') {
    if (entry.attempts.length === 0 || entry.hintUsed) return session;
    updated = { ...entry, hintUsed: true };
  } else {
    if (!entry.choices.includes(action.answer) || entry.attempts.includes(action.answer)) return session;
    updated = { ...entry, attempts: [...entry.attempts, action.answer], correct: action.answer === entry.question.correctAnswer };
  }
  return { ...session, entries: session.entries.map((value, i) => i === session.currentIndex ? updated : value) };
}
