import { reactionGroups, reactionCategories, type ReactionGroup } from '../data/categories';
import type { ReactionQuestion } from '../types/question';
import { isComplete, sessionFinished, type PracticeSession, type PracticeEntry } from './practice';

export const STORAGE_KEY = 'reagent-roundup.progress.v1';
export type QuestionCount = 5 | 10 | 15 | 20 | 'all';
export interface Progress { selectedGroups: ReactionGroup[]; questionCount: QuestionCount; session: PracticeSession | null }
export const emptyProgress = (): Progress => ({ selectedGroups: [], questionCount: 'all', session: null });
export interface LoadResult { progress: Progress; notice: string | null; needsReplacementConfirmation: boolean }
/** A repository boundary for future authenticated/server storage. No UI depends on localStorage directly. */
export interface ProgressRepository {
  load(bank: readonly ReactionQuestion[]): LoadResult;
  save(progress: Progress): string | null;
  subscribe(listener: () => void): () => void;
  getNotice(): string | null;
}
function revision(question: ReactionQuestion): string {
  // Store the authoritative content, not a weak checksum or outdated question copy used by the UI.
  return JSON.stringify([question.category, question.reactant, question.product, question.correctAnswer, question.distractors, question.explanation, question.hint, question.stereochemistry]);
}
export function encodeProgress(progress: Progress): string {
  const session = progress.session;
  return JSON.stringify({ version: 1, selectedGroups: progress.selectedGroups, questionCount: progress.questionCount,
    session: session ? { currentIndex: session.currentIndex, categories: session.categories,
      completedCount: session.entries.filter(isComplete).length, completed: sessionFinished(session),
      entries: session.entries.map(entry => ({ questionId: entry.question.id, revision: revision(entry.question),
        choices: entry.choices, attempts: entry.attempts, attemptsUsed: entry.attempts.length,
        hintUsed: entry.hintUsed, correct: entry.correct, correctAttempt: entry.correct ? entry.attempts.length : null })) } : null });
}
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
const unique = (v: string[]) => new Set(v).size === v.length;
const invalid = (): never => { throw new Error('Invalid or incompatible saved progress'); };

/** Validate untrusted browser data and rebind IDs to the current bank. Never restore question copies. */
export function decodeProgress(raw: string, bank: readonly ReactionQuestion[]): Progress {
  const data: unknown = JSON.parse(raw);
  if (!record(data) || data.version !== 1 || !strings(data.selectedGroups) || !unique(data.selectedGroups) ||
      !data.selectedGroups.every(id => reactionGroups.some(group => group.id === id)) ||
      ![5, 10, 15, 20, 'all'].includes(data.questionCount as QuestionCount)) return invalid();
  const progress: Progress = { selectedGroups: data.selectedGroups as ReactionGroup[], questionCount: data.questionCount as QuestionCount, session: null };
  const selectedCategories = reactionGroups.filter(group => progress.selectedGroups.includes(group.id)).flatMap(group => [...group.categories]);
  if (progress.questionCount !== 'all' && progress.questionCount > bank.filter(q => selectedCategories.includes(q.category)).length) progress.questionCount = 'all';
  if (data.session === null) return progress;
  const saved = data.session;
  if (!record(saved) || !Array.isArray(saved.entries) || saved.entries.length === 0 || saved.entries.length > bank.length ||
      !Number.isInteger(saved.currentIndex) || (saved.currentIndex as number) < 0 || (saved.currentIndex as number) > saved.entries.length ||
      !strings(saved.categories) || !saved.categories.length || !unique(saved.categories) || !saved.categories.every(id => reactionCategories.some(c => c.id === id))) return invalid();
  const seen = new Set<string>();
  const entries: PracticeEntry[] = saved.entries.map(value => {
    if (!record(value) || typeof value.questionId !== 'string' || seen.has(value.questionId)) return invalid();
    seen.add(value.questionId);
    const question = bank.find(q => q.id === value.questionId);
    if (!question || question.review.status !== 'prepared' || value.revision !== revision(question) || !(saved.categories as string[]).includes(question.category) ||
        !strings(value.choices) || value.choices.length !== 8 || !unique(value.choices) ||
        !value.choices.every(choice => [question.correctAnswer, ...question.distractors].includes(choice)) ||
        !strings(value.attempts) || value.attempts.length > 3 || !unique(value.attempts) || !value.attempts.every(answer => (value.choices as string[]).includes(answer)) ||
        value.attemptsUsed !== value.attempts.length || typeof value.correct !== 'boolean' || typeof value.hintUsed !== 'boolean') return invalid();
    const correctIndex = value.attempts.indexOf(question.correctAnswer);
    const correct = correctIndex >= 0;
    if (correct && correctIndex !== value.attempts.length - 1 || value.correct !== correct || value.correctAttempt !== (correct ? value.attempts.length : null) ||
        value.hintUsed && (value.attempts.length === 0 || correct && value.attempts.length === 1)) return invalid();
    return { question, choices: value.choices, attempts: value.attempts, correct, hintUsed: value.hintUsed };
  });
  const currentIndex = saved.currentIndex as number;
  if (entries.some((entry, i) => i < currentIndex && !isComplete(entry) || i > currentIndex && (entry.attempts.length > 0 || entry.hintUsed)) ||
      saved.completedCount !== entries.filter(isComplete).length || saved.completed !== (currentIndex === entries.length)) return invalid();
  progress.session = { currentIndex, entries, categories: saved.categories as PracticeSession['categories'] };
  return progress;
}

export function createLocalProgressRepository(getStorage: () => Pick<Storage, 'getItem' | 'setItem'> = () => window.localStorage): ProgressRepository {
  let notice: string | null = null;
  const listeners = new Set<() => void>();
  function publish(next: string | null) {
    if (notice !== next) { notice = next; listeners.forEach(listener => listener()); }
    return notice;
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getNotice() { return notice; },
    load(bank) {
      let raw: string | null;
      try { raw = getStorage().getItem(STORAGE_KEY); }
      catch { return { progress: emptyProgress(), notice: 'Browser storage is unavailable. Progress cannot be saved in this browser.', needsReplacementConfirmation: false }; }
      if (raw === null) return { progress: emptyProgress(), notice: null, needsReplacementConfirmation: false };
      try { return { progress: decodeProgress(raw, bank), notice: null, needsReplacementConfirmation: false }; }
      catch { return { progress: emptyProgress(), notice: 'Saved progress could not be restored because it is damaged or the question bank has changed. It has been kept until you confirm starting a new session.', needsReplacementConfirmation: true }; }
    },
    save(progress) {
      try { getStorage().setItem(STORAGE_KEY, encodeProgress(progress)); return publish(null); }
      catch { return publish('Progress could not be saved. Browser storage may be blocked or full. Keep this page open to retain your current session.'); }
    },
  };
}
